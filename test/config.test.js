const test = require('node:test');
const assert = require('node:assert/strict');
const { getConfig } = require('../lib/config');

test('getConfig parses production backend settings', () => {
    const config = getConfig({
        PORT: '8080',
        CORS_ORIGINS: 'https://app.example.com',
        REQUEST_TIMEOUT_MS: '5000',
        RATE_LIMIT_WINDOW_MS: '60000',
        RATE_LIMIT_MAX: '10',
        MAX_STORED_REPORTS: '50',
        NODE_ENV: 'production'
    });

    assert.equal(config.port, 8080);
    assert.deepEqual(config.corsOrigins, ['https://app.example.com']);
    assert.equal(config.nodeEnv, 'production');
});

test('getConfig rejects invalid numeric config', () => {
    assert.throws(() => getConfig({
        PORT: 'abc',
        CORS_ORIGINS: 'https://app.example.com',
        REQUEST_TIMEOUT_MS: '5000',
        RATE_LIMIT_WINDOW_MS: '60000',
        RATE_LIMIT_MAX: '10',
        MAX_STORED_REPORTS: '50',
        NODE_ENV: 'production'
    }), /Invalid configuration/);
});
