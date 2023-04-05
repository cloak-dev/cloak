const slugs = { mixedkey: "MIXEDKEY" };

const g = +window.prompt("Enter g");
const p = +window.prompt("Enter p");

const secret = Math.floor(1 + Math.random() * 9);

const toShare = modPow(g, secret, p);

const message = slugs.mixedkey + toShare;

let key;
socket.on("message", function slugListener({ message }) {
    if (!message.startsWith(slugs.mixedkey)) return;
    socket.off("message", slugListener);
    const othersShare = Number.parseInt(message.slice(slugs.mixedkey.length));
    key = modPow(othersShare, secret, p);
    console.log("Arrived at shared secret", key);
});

const currentOnSubmit = form.onsubmit;

form.onsubmit = e => {
    e.preventDefault();
    const message = form.elements.message.value;
    const cipher = caesarCipher(message, key);
    form.elements.message.value = cipher;

    currentOnSubmit(e);

    messages.querySelector("li:last-child").remove();
    messages.appendChild(mkmsg({ message, username, self: true }));

    return false;
};

socket.on("message", ({ message, username }) => {
    console.log("message", message);
    const actual = caesarCipher(message, -key);
    messages.querySelector("li:last-child").remove();
    messages.appendChild(mkmsg({ message: actual, username: username }));
});

function caesarCipher(message, key) {
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    const alphabetLength = alphabet.length;
    const messageLength = message.length;
    let cipher = "";
    for (let i = 0; i < messageLength; i++) {
        const letter = message[i];

        if (!alphabet.includes(letter)) {
            cipher += letter;
            continue;
        }

        const letterIndex = alphabet.indexOf(letter);
        const cipherIndex =
            (((letterIndex + key) % alphabetLength) + alphabetLength) % alphabetLength;
        cipher += alphabet[cipherIndex];
    }
    return cipher;
}

function toZn(a, n) {
    if (typeof a === "number") a = BigInt(a);
    if (typeof n === "number") n = BigInt(n);

    if (n <= 0n) {
        throw new RangeError("n must be > 0");
    }

    const aZn = a % n;
    return aZn < 0n ? aZn + n : aZn;
}

function modPow(b, e, n) {
    if (typeof b === "number") b = BigInt(b);
    if (typeof e === "number") e = BigInt(e);
    if (typeof n === "number") n = BigInt(n);

    if (n <= 0n) {
        throw new RangeError("n must be > 0");
    } else if (n === 1n) {
        return 0n;
    }

    b = toZn(b, n);

    if (e < 0n) {
        return modInv(modPow(b, abs(e), n), n);
    }

    let r = 1n;
    while (e > 0) {
        if (e % 2n === 1n) {
            r = (r * b) % n;
        }
        e = e / 2n;
        b = b ** 2n % n;
    }
    return r;
}
