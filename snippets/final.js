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
    }
}