const crypto = require('crypto');

function createSecretToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString('base64url');
}

function hashToken(token) {
    return crypto.createHash('sha256').update(String(token)).digest('base64url');
}

function addMs(ms) {
    return new Date(Date.now() + ms).toISOString();
}

function isExpired(isoDate) {
    return !isoDate || new Date(isoDate).getTime() <= Date.now();
}

module.exports = {
    createSecretToken,
    hashToken,
    addMs,
    isExpired
};
