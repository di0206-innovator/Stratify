const crypto = require('crypto');

const KEY_LENGTH = 64;
const DEFAULT_PARAMS = {
    N: 16384,
    r: 8,
    p: 1
};

function hashPassword(password, params = DEFAULT_PARAMS) {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString('base64url');
        crypto.scrypt(password, salt, KEY_LENGTH, params, (error, derivedKey) => {
            if (error) return reject(error);
            return resolve([
                'scrypt',
                params.N,
                params.r,
                params.p,
                salt,
                derivedKey.toString('base64url')
            ].join('$'));
        });
    });
}

function verifyPassword(password, encodedHash) {
    return new Promise((resolve, reject) => {
        const parts = String(encodedHash || '').split('$');
        if (parts.length !== 6 || parts[0] !== 'scrypt') {
            return resolve(false);
        }

        const [, N, r, p, salt, hash] = parts;
        const params = { N: Number(N), r: Number(r), p: Number(p) };
        const expected = Buffer.from(hash, 'base64url');

        crypto.scrypt(password, salt, expected.length, params, (error, derivedKey) => {
            if (error) return reject(error);
            if (expected.length !== derivedKey.length) return resolve(false);
            return resolve(crypto.timingSafeEqual(expected, derivedKey));
        });
    });
}

function validatePasswordStrength(password) {
    const errors = [];
    const value = String(password || '');

    if (value.length < 12) errors.push('Password must be at least 12 characters.');
    if (!/[a-z]/.test(value)) errors.push('Password must include a lowercase letter.');
    if (!/[A-Z]/.test(value)) errors.push('Password must include an uppercase letter.');
    if (!/\d/.test(value)) errors.push('Password must include a number.');
    if (!/[^a-zA-Z0-9]/.test(value)) errors.push('Password must include a symbol.');

    return errors;
}

module.exports = {
    hashPassword,
    verifyPassword,
    validatePasswordStrength
};
