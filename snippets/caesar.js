const key = 2;

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
    const actual = caesarCipher(message, -key);
    messages.querySelector("li:last-child").remove();
    messages.appendChild(mkmsg({ message: actual, username: username, self: false }));
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
        const cipherIndex = (letterIndex + key) % alphabetLength;
        cipher += alphabet[cipherIndex];
    }
    return cipher;
}
