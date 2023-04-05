class E2EE {
    arrayBufferToString(buffer) {
        return new TextDecoder().decode(buffer);
    }

    stringToArrayBuffer(text) {
        return new TextEncoder().encode(text);
    }

    generateIv() {
        return crypto.getRandomValues(new Uint8Array(16));
    }

    /**
     * @see https://github.com/mdn/dom-examples/blob/master/web-crypto/derive-bits/ecdh.js
     */
    async generateKey() {
        this.key = await window.crypto.subtle.generateKey(
            { name: "ECDH", namedCurve: "P-256" },
            false,
            ["deriveBits"]
        );
    }

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

    getPublicKey() {
        return { publicKey: this.key.publicKey };
    }

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
}
