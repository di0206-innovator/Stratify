const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../server');
const { MemoryAuthStore } = require('../lib/authStore');
const { MemoryReportStore } = require('../lib/reportStore');

const strongPassword = 'SecurePass123!';
const strongerPassword = 'NewSecurePass123!';

const silentLogger = {
    info() {},
    warn() {},
    error() {}
};

function config(overrides = {}) {
    return {
        port: 0,
        geminiApiKey: '',
        geminiModel: 'demo',
        tavilyApiKey: '',
        apiAuthToken: '',
        authStorePath: '',
        sessionTtlMs: 1000 * 60 * 60,
        emailVerificationTokenTtlMs: 1000 * 60 * 30,
        passwordResetTokenTtlMs: 1000 * 60 * 15,
        loginRateLimitWindowMs: 1000 * 60,
        loginRateLimitMax: 5,
        requireAuthForAnalyze: false,
        corsOrigins: ['http://localhost:3000'],
        jsonBodyLimit: '128kb',
        requestTimeoutMs: 30_000,
        rateLimitWindowMs: 60_000,
        rateLimitMax: 100,
        reportStorePath: '',
        maxStoredReports: 100,
        nodeEnv: 'test',
        ...overrides
    };
}

function appWithStore(authStore, overrides = {}) {
    return createApp({
        logger: silentLogger,
        authStore,
        reportStore: new MemoryReportStore(),
        config: config(overrides),
        orchestrator: {
            mode: 'demo',
            modelName: 'demo',
            searchProvider: { enabled: false },
            processInquiry: async () => ({})
        }
    });
}

function listen(app) {
    return new Promise((resolve) => {
        const server = app.listen(0, () => {
            const { port } = server.address();
            resolve({ server, url: `http://127.0.0.1:${port}` });
        });
    });
}

async function register(url, email = 'founder@example.com') {
    return fetch(`${url}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Secure Founder',
            email,
            password: strongPassword
        })
    });
}

test('registration hashes passwords and queues verification without exposing tokens', async () => {
    const authStore = new MemoryAuthStore();
    const { server, url } = await listen(appWithStore(authStore));

    try {
        const response = await register(url);
        const body = await response.json();
        const state = await authStore.readState();

        assert.equal(response.status, 201);
        assert.equal(body.user.email, 'founder@example.com');
        assert.equal(body.user.passwordHash, undefined);
        assert.equal(body.token, undefined);
        assert.equal(state.users.length, 1);
        assert.notEqual(state.users[0].passwordHash, strongPassword);
        assert.match(state.users[0].passwordHash, /^scrypt\$/);
        assert.equal(state.emailOutbox.length, 1);
        assert.equal(state.emailOutbox[0].type, 'email_verification');
    } finally {
        server.close();
    }
});

test('login requires verified email and creates expiring HttpOnly session', async () => {
    const authStore = new MemoryAuthStore();
    const { server, url } = await listen(appWithStore(authStore));

    try {
        await register(url);

        const blocked = await fetch(`${url}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'founder@example.com', password: strongPassword })
        });
        const blockedBody = await blocked.json();
        assert.equal(blocked.status, 403);
        assert.equal(blockedBody.error.code, 'EMAIL_NOT_VERIFIED');

        const verificationToken = (await authStore.readState()).emailOutbox[0].token;
        const verify = await fetch(`${url}/api/auth/verify-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: verificationToken })
        });
        assert.equal(verify.status, 200);

        const login = await fetch(`${url}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'founder@example.com', password: strongPassword })
        });
        const loginBody = await login.json();
        const setCookie = login.headers.get('set-cookie');

        assert.equal(login.status, 200);
        assert.equal(loginBody.session.expiresAt.length > 0, true);
        assert.match(setCookie, /HttpOnly/);
        assert.match(setCookie, /SameSite=Lax/);
        assert.doesNotMatch(JSON.stringify(loginBody), /neuralbi_session/);
    } finally {
        server.close();
    }
});

test('password reset tokens expire and successful reset invalidates sessions', async () => {
    const authStore = new MemoryAuthStore();
    const { server, url } = await listen(appWithStore(authStore, {
        passwordResetTokenTtlMs: 1000
    }));

    try {
        await register(url);
        const verificationToken = (await authStore.readState()).emailOutbox[0].token;
        await fetch(`${url}/api/auth/verify-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: verificationToken })
        });
        const login = await fetch(`${url}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'founder@example.com', password: strongPassword })
        });
        assert.equal(login.status, 200);
        assert.equal((await authStore.readState()).sessions.length, 1);

        await fetch(`${url}/api/auth/request-password-reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'founder@example.com' })
        });
        const resetToken = (await authStore.readState()).emailOutbox.find((item) => item.type === 'password_reset').token;
        await authStore.update((state) => {
            const token = state.tokens.find((item) => item.type === 'password_reset');
            token.expiresAt = new Date(Date.now() - 1000).toISOString();
        });
        const expired = await fetch(`${url}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: resetToken, password: strongerPassword })
        });
        assert.equal(expired.status, 400);

        await fetch(`${url}/api/auth/request-password-reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'founder@example.com' })
        });
        const freshResetToken = (await authStore.readState()).emailOutbox.filter((item) => item.type === 'password_reset').at(-1).token;
        const reset = await fetch(`${url}/api/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: freshResetToken, password: strongerPassword })
        });

        assert.equal(reset.status, 200);
        assert.equal((await authStore.readState()).sessions.length, 0);
    } finally {
        server.close();
    }
});

test('login attempts are rate limited', async () => {
    const authStore = new MemoryAuthStore();
    const { server, url } = await listen(appWithStore(authStore, {
        loginRateLimitMax: 2
    }));

    try {
        for (let index = 0; index < 2; index += 1) {
            const response = await fetch(`${url}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'missing@example.com', password: 'wrong' })
            });
            assert.equal(response.status, 401);
        }

        const limited = await fetch(`${url}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'missing@example.com', password: 'wrong' })
        });
        const body = await limited.json();

        assert.equal(limited.status, 429);
        assert.equal(body.error.code, 'RATE_LIMITED');
    } finally {
        server.close();
    }
});
