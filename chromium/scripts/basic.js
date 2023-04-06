/** Hook for the basic chat server
 * Provides all three hooks
 * 1. Display
 * 2. Send
 * 3. Receive
 */
class E2EE {
    // converts the given array buffer into a UTF-8 string
    arrayBufferToString(buffer) {
        return new TextDecoder().decode(buffer);
    }

    // converts the given string to an array buffer
    stringToArrayBuffer(text) {
        return new TextEncoder().encode(text);
    }

    // generates the initialization vector for AES-CTR encryption
    // note, We cannot use Math.random as it is not a strong RNG.
    generateIv() {
        return crypto.getRandomValues(new Uint8Array(16));
    }

    /**
     * @see https://github.com/mdn/dom-examples/blob/master/web-crypto/derive-bits/ecdh.js
     *
     * Generates a key pair for elliptic curve diffie hellman
     */
    async generateKey() {
        this.key = await window.crypto.subtle.generateKey(
            { name: "ECDH", namedCurve: "P-256" },
            false,
            ["deriveBits"]
        );
    }

    // encrypts the given plaintext using the stored AES-CTR key
    async encrypt(plaintext) {
        const counter = this.generateIv();
        const buffer = await crypto.subtle.encrypt(
            {
                name: "AES-CTR",
                counter: counter,
                length: 128,
            },
            this.importedKey,
            this.stringToArrayBuffer(plaintext)
        );
        return { buffer, counter };
    }

    // decrypts the given ciphertext using the stored AES-CTR key
    async decrypt(data) {
        const buffer = await crypto.subtle.decrypt(
            {
                name: "AES-CTR",
                counter: data.counter,
                length: 128,
            },
            this.importedKey,
            data.buffer
        );
        return this.arrayBufferToString(buffer);
    }

    // simple getter for the public key
    get publicKey() {
        return this.key.publicKey;
    }

    // once the other party's public key has been received,
    // this method uses it to generate the shared secret, and
    // subsequently the key for AES.
    async setRemotePublicKey(key) {
        this.clientKey = key;

        this.sharedSecret = await window.crypto.subtle.deriveBits(
            { name: "ECDH", namedCurve: "P-256", public: this.clientKey },
            this.key.privateKey,
            256
        );

        this.importedKey = await crypto.subtle.importKey(
            "raw",
            this.sharedSecret,
            "AES-CTR",
            false,
            ["encrypt", "decrypt"]
        );
    }

    // Serializes a key into JSON format
    // not vulnerable to timing attacks
    async marshal(key) {
        const exported = await window.crypto.subtle.exportKey("jwk", key);
        return JSON.stringify(exported);
    }

    // Deserializes a key from JSON format
    // not vulnerable to timing attacks
    async unmarshal(jwk) {
        const key = await window.crypto.subtle.importKey(
            "jwk",
            JSON.parse(jwk),
            { name: "ECDH", namedCurve: "P-256" },
            true,
            []
        );
        return key;
    }
}

// will be asynchronously populated with the public key.
let pub;
async function setup() {
    const e2ee = new E2EE();
    await e2ee.generateKey();
    pub = e2ee.marshal(e2ee.getPublicKey()); // returns a promise
    socket.on("message", async function listener({ message }) {
        // this is the slug that lets us know its a cloak-generated message
        if (!message.startsWith("MIXEDKEY")) return;
        // we only do key exchange once
        socket.off("message", listener);
        const shared = message.slice("MIXEDKEY".length);
        // deserialize
        const key = await e2ee.unmarshal(shared);
        // arrive at shared key
        await e2ee.setRemotePublicKey(key);
    });

    // override existing onsubmit
    const currentOnSubmit = form.onsubmit;

    form.onsubmit = async e => {
        e.preventDefault();
        const message = form.elements.message.value;
        const { buffer, counter } = await e2ee.encrypt(message);

        // base64 encode the ciphertext
        const serialized = JSON.stringify({
            buffer: window.btoa(String.fromCharCode(...new Uint8Array(buffer))),
            counter: window.btoa(String.fromCharCode(...new Uint8Array(counter))),
        });

        form.elements.message.value = serialized;

        currentOnSubmit(e);

        messages.querySelector("li:last-child").remove();
        messages.appendChild(mkmsg({ message, username, self: true }));

        return false;
    };

    socket.on("message", async ({ message, username }) => {
        // don't try to decrypt the key exchange message
        if (message.startsWith("MIXEDKEY")) return;
        // recover the original message
        const deserialized = JSON.parse(message);
        const buffer = new Uint8Array(
            [...window.atob(deserialized.buffer)].map(c => c.charCodeAt(0))
        );
        const counter = new Uint8Array(
            [...window.atob(deserialized.counter)].map(c => c.charCodeAt(0))
        );
        const decrypted = await e2ee.decrypt({ buffer, counter });
        // update the message list with the decrypted message as the messaging app
        // would have put the ciphertext there before this.
        // (their event listener comes before ours)
        messages.querySelector("li:last-child").remove();
        messages.appendChild(mkmsg({ message: decrypted, username: username }));
    });
}

// function to send the public key during key exchange
function sendPublicKey() {
    return pub.then(key => socket.emit("message", { message: `MIXEDKEY${key}`, username }));
}

// bootstrap the whole process

setup().then(() => {
    const button = document.querySelector("#cloak-button");
    button.style.visibility = "visible";
    button.addEventListener("click", () => {
        sendPublicKey().then(() => {
            button.innerText = "";
            button.style.padding = button.style.margin = 0;
            button.style.borderRadius = "50%";

            const img = document.querySelector("#cloak-logo");
            img.style.visibility = "visible";
            button.appendChild(img);
        });
    });
});