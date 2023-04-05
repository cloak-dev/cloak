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
}