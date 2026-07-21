const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../server');
const { MemoryAuthStore } = require('../lib/authStore');
const { FileStartupStore } = require('../lib/startupStore');
const { hashPassword } = require('../lib/security/passwords');
const fs = require('fs/promises');
const path = require('path');

const silentLogger = {
    info() {},
    warn() {},
    error() {}
};

function testConfig(overrides = {}) {
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
        adminEmails: ['divyanshu.b.sinha@gmail.com'],
        ...overrides
    };
}

function listen(app) {
    return new Promise((resolve) => {
        const server = app.listen(0, () => {
            const { port } = server.address();
            resolve({ server, url: `http://127.0.0.1:${port}` });
        });
    });
}

test('Strategic Briefs API - creation, updates, and whitelisted access', async () => {
    const passwordHash = await hashPassword('SecurePass123!');
    const authStore = new MemoryAuthStore({
        users: [
            {
                id: 'founder-id',
                email: 'founder@myco.com',
                name: 'Founder User',
                passwordHash: passwordHash,
                emailVerified: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 'investor-id',
                email: 'investor@accel.com',
                name: 'Investor User',
                passwordHash: passwordHash,
                emailVerified: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 'random-id',
                email: 'stranger@example.com',
                name: 'Random User',
                passwordHash: passwordHash,
                emailVerified: true,
                createdAt: new Date().toISOString()
            }
        ]
    });

    const testDataDir = path.join(__dirname, 'temp_briefs_test_data');
    await fs.mkdir(testDataDir, { recursive: true });
    const startupStore = new FileStartupStore(testDataDir);
    await startupStore.init();

    const app = createApp({
        logger: silentLogger,
        authStore,
        startupStore,
        config: testConfig(),
        disableBackgroundMonitor: true
    });
    
    const { server, url } = await listen(app);

    try {
        // 1. Log in as founder
        const founderLogin = await fetch(`${url}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'founder@myco.com', password: 'SecurePass123!' })
        });
        const founderCookie = founderLogin.headers.get('set-cookie');
        assert.ok(founderCookie, 'Should receive session cookie for founder');

        // 2. Create a brief
        const briefPayload = {
            name: 'Myco Inc',
            pitch: 'We build cool stuff',
            problem: 'Uncool stuff',
            solution: 'Make it cool',
            isPublic: false,
            whitelist: ['investor@accel.com', 'sequoia.com'],
            deckUrl: 'https://example.com/deck.pdf',
            showRunway: true
        };

        const createRes = await fetch(`${url}/api/briefs`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                Cookie: founderCookie
            },
            body: JSON.stringify(briefPayload)
        });
        assert.equal(createRes.status, 201, 'Should create brief');
        const createBody = await createRes.json();
        const briefId = createBody.brief.id;
        assert.ok(briefId, 'Brief should have an ID');

        // 3. Update the same brief (POST to /api/briefs when brief already exists)
        const updatePayload = {
            ...briefPayload,
            pitch: 'We build the coolest stuff'
        };
        const updateRes = await fetch(`${url}/api/briefs`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                Cookie: founderCookie
            },
            body: JSON.stringify(updatePayload)
        });
        assert.equal(updateRes.status, 201, 'Should update existing brief');
        
        // Assert store contains exactly 1 brief (inline update, no duplicates)
        const startup = await startupStore.getStartupByOwner('founder-id');
        const list = await startupStore.listBriefs(startup.id);
        assert.equal(list.length, 1, 'Should only have 1 brief in the store (no duplicate unshifts)');

        // 4. Retrieve private brief as unauthenticated user (denied 403)
        const unauthGet = await fetch(`${url}/api/briefs/${briefId}`);
        assert.equal(unauthGet.status, 403, 'Unauthenticated access to private brief should be forbidden');

        // 5. Retrieve private brief as whitelisted investor
        const investorLogin = await fetch(`${url}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'investor@accel.com', password: 'SecurePass123!' })
        });
        const investorCookie = investorLogin.headers.get('set-cookie');

        const whitelistedGet = await fetch(`${url}/api/briefs/${briefId}`, {
            headers: { Cookie: investorCookie }
        });
        assert.equal(whitelistedGet.status, 200, 'Whitelisted user should access private brief');
        const whitelistedBody = await whitelistedGet.json();
        assert.equal(whitelistedBody.brief.pitch, 'We build the coolest stuff');

        // 6. Retrieve private brief as non-whitelisted user (denied 403)
        const strangerLogin = await fetch(`${url}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'stranger@example.com', password: 'SecurePass123!' })
        });
        const strangerCookie = strangerLogin.headers.get('set-cookie');

        const strangerGet = await fetch(`${url}/api/briefs/${briefId}`, {
            headers: { Cookie: strangerCookie }
        });
        assert.equal(strangerGet.status, 403, 'Non-whitelisted user should be denied access');
    } finally {
        server.close();
        await fs.rm(testDataDir, { recursive: true, force: true });
    }
});
