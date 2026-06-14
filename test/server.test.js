const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../server');
const { MemoryReportStore } = require('../lib/reportStore');
const { MemoryAuthStore } = require('../lib/authStore');

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
        adminEmails: ['divyanshu.b.sinha@gmail.com', 'divyanshusunstone@gmail.com'],
        ...overrides
    };
}

function createTestApp(options = {}) {
    return createApp({
        logger: silentLogger,
        reportStore: options.reportStore || new MemoryReportStore(),
        authStore: options.authStore || new MemoryAuthStore(),
        config: testConfig(options.config),
        disableBackgroundMonitor: true,
        ...options
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

function validAnalyzeBody(overrides = {}) {
    return {
        query: 'Analyze fintech adoption in India',
        founderProfile: {
            founderType: 'solo',
            startupStage: 'idea',
            industry: 'fintech',
            geography: 'India',
            product: 'cashflow forecasting copilot',
            targetCustomer: 'small business owners',
            teamSize: 'solo',
            budget: 'bootstrapped',
            timeline: '30 days',
            currentGoal: 'validate buyer demand'
        },
        reportOptions: {
            reportType: 'idea_validation',
            audience: 'founder',
            timeHorizon: '30_days'
        },
        ...overrides
    };
}

test('GET /api/health returns mode metadata', async () => {
    const app = createTestApp({
        orchestrator: {
            mode: 'demo',
            modelName: 'demo',
            searchProvider: { enabled: false },
            processInquiry: async () => ({})
        }
    });
    const { server, url } = await listen(app);

    try {
        const response = await fetch(`${url}/api/health`);
        const body = await response.json();

        assert.equal(response.status, 200);
        assert.equal(body.ok, true);
        assert.equal(body.mode, 'demo');
    } finally {
        server.close();
    }
});

test('POST /api/analyze rejects invalid query', async () => {
    const app = createTestApp({
        orchestrator: {
            mode: 'demo',
            modelName: 'demo',
            searchProvider: { enabled: false },
            processInquiry: async () => {
                throw new Error('should not call orchestrator');
            }
        }
    });
    const { server, url } = await listen(app);

    try {
        const response = await fetch(`${url}/api/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: '' })
        });
        const body = await response.json();

        assert.equal(response.status, 400);
        assert.equal(body.error.code, 'INVALID_ANALYSIS_REQUEST');
    } finally {
        server.close();
    }
});

test('POST /api/analyze returns structured report', async () => {
    const app = createTestApp({
        orchestrator: {
            mode: 'demo',
            modelName: 'demo',
            searchProvider: { enabled: false },
            processInquiry: async (query, options) => ({
                id: 'report-1',
                title: `Report for ${query}`,
                generatedAt: new Date().toISOString(),
                markdown: `## Report for ${query}`,
                founderContext: { reportOptions: { reportType: 'idea_validation' } },
                sections: { actionPlan: {} },
                sectionOrder: ['executiveSnapshot', 'founderContext', 'marketSignals', 'recommendations', 'actionPlan', 'risks', 'sources'],
                agentLogs: [{ id: 'researcher', agent: 'Research Analyst', message: 'Done' }],
                mode: 'demo',
                intelligenceMode: 'demo_grounding',
                sources: options.sources
            })
        }
    });
    const { server, url } = await listen(app);

    try {
        const response = await fetch(`${url}/api/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(validAnalyzeBody({
                sources: [{ title: 'Brief', summary: 'Reviewed notes' }]
            }))
        });
        const body = await response.json();

        assert.equal(response.status, 201);
        assert.equal(body.report.mode, 'demo');
        assert.equal(body.report.sources[0].title, 'Brief');
    } finally {
        server.close();
    }
});

test('POST /api/analyze handles orchestrator failure', async () => {
    const app = createTestApp({
        orchestrator: {
            mode: 'demo',
            modelName: 'demo',
            searchProvider: { enabled: false },
            processInquiry: async () => {
                throw new Error('provider failed');
            }
        }
    });
    const { server, url } = await listen(app);

    try {
        const response = await fetch(`${url}/api/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(validAnalyzeBody())
        });
        const body = await response.json();

        assert.equal(response.status, 500);
        assert.equal(body.error.code, 'INTERNAL_ERROR');
    } finally {
        server.close();
    }
});

test('report resource endpoints persist and fetch generated reports', async () => {
    const store = new MemoryReportStore();
    const app = createTestApp({
        reportStore: store,
        config: { apiAuthToken: 'secret' },
        orchestrator: {
            mode: 'demo',
            modelName: 'demo',
            searchProvider: { enabled: false },
            processInquiry: async () => ({
                id: 'persisted-report',
                title: 'Persisted report',
                generatedAt: new Date().toISOString(),
                markdown: '# Persisted report',
                founderContext: { reportOptions: { reportType: 'idea_validation' } },
                sections: { actionPlan: {} },
                sectionOrder: ['executiveSnapshot', 'founderContext', 'marketSignals', 'recommendations', 'actionPlan', 'risks', 'sources'],
                agentLogs: [],
                mode: 'demo',
                intelligenceMode: 'demo_grounding',
                model: 'demo',
                sources: []
            })
        }
    });
    const { server, url } = await listen(app);

    try {
        const createResponse = await fetch(`${url}/api/reports`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer secret' },
            body: JSON.stringify(validAnalyzeBody())
        });
        assert.equal(createResponse.status, 201);

        const listResponse = await fetch(`${url}/api/reports`, {
            headers: { Authorization: 'Bearer secret' }
        });
        const listBody = await listResponse.json();
        assert.equal(listResponse.status, 200);
        assert.equal(listBody.reports.length, 1);
        assert.equal(listBody.reports[0].id, 'persisted-report');

        const getResponse = await fetch(`${url}/api/reports/persisted-report`, {
            headers: { Authorization: 'Bearer secret' }
        });
        const getBody = await getResponse.json();
        assert.equal(getResponse.status, 200);
        assert.equal(getBody.report.title, 'Persisted report');
    } finally {
        server.close();
    }
});

test('API auth token protects report management endpoints', async () => {
    const app = createTestApp({
        config: { apiAuthToken: 'secret' },
        orchestrator: {
            mode: 'demo',
            modelName: 'demo',
            searchProvider: { enabled: false },
            processInquiry: async () => ({})
        }
    });
    const { server, url } = await listen(app);

    try {
        const unauthorized = await fetch(`${url}/api/reports`);
        const unauthorizedBody = await unauthorized.json();
        assert.equal(unauthorized.status, 401);
        assert.equal(unauthorizedBody.error.code, 'UNAUTHORIZED');

        const authorized = await fetch(`${url}/api/reports`, {
            headers: { Authorization: 'Bearer secret' }
        });
        assert.equal(authorized.status, 200);
    } finally {
        server.close();
    }
});

test('POST /api/signals returns market signals', async () => {
    const app = createTestApp({
        orchestrator: {
            mode: 'demo',
            modelName: 'demo',
            searchProvider: { enabled: false },
            processSignals: async (profile) => ({
                signals: [
                    { type: 'TECH SHIFT', title: 'Test Tech Shift', description: 'Test desc', impact: 'High', sentiment: 'Positive', source: null }
                ],
                mode: 'demo'
            })
        }
    });
    const { server, url } = await listen(app);

    try {
        const response = await fetch(`${url}/api/signals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                founderProfile: {
                    industry: 'fintech',
                    geography: 'India'
                }
            })
        });
        const body = await response.json();

        assert.equal(response.status, 200);
        assert.equal(body.signals.length, 1);
        assert.equal(body.signals[0].title, 'Test Tech Shift');
        assert.equal(body.mode, 'demo');
    } finally {
        server.close();
    }
});

test('POST /api/signals rejects request with missing industry/geography', async () => {
    const app = createTestApp();
    const { server, url } = await listen(app);

    try {
        const response = await fetch(`${url}/api/signals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                founderProfile: {
                    industry: '',
                    geography: ''
                }
            })
        });
        const body = await response.json();

        assert.equal(response.status, 400);
        assert.equal(body.error.code, 'INVALID_PROFILE');
    } finally {
        server.close();
    }
});

test('GET /api/dev/emails returns queued outbox emails in test/development mode', async () => {
    const authStore = new MemoryAuthStore({
        emailOutbox: [
            { id: '1', to: 'alex@startup.com', type: 'email_verification', subject: 'Verify email', token: 'token123', createdAt: new Date().toISOString() }
        ]
    });
    const app = createTestApp({
        authStore,
        config: { nodeEnv: 'development' }
    });
    const { server, url } = await listen(app);

    try {
        const response = await fetch(`${url}/api/dev/emails`);
        const body = await response.json();

        assert.equal(response.status, 200);
        assert.equal(body.emails.length, 1);
        assert.equal(body.emails[0].to, 'alex@startup.com');
        assert.equal(body.emails[0].token, 'token123');
    } finally {
        server.close();
    }
});

test('admin endpoints block non-admins and allow authorized admins', async () => {
    const { hashPassword } = require('../lib/security/passwords');
    const adminPasswordHash = await hashPassword('SecurePass123!');
    const regularPasswordHash = await hashPassword('SecurePass123!');

    const authStore = new MemoryAuthStore({
        users: [
            {
                id: 'admin-id',
                email: 'admin@neuralbi.io',
                name: 'Admin User',
                passwordHash: adminPasswordHash,
                emailVerified: true,
                role: 'admin',
                createdAt: new Date().toISOString()
            },
            {
                id: 'regular-id',
                email: 'regular@example.com',
                name: 'Regular User',
                passwordHash: regularPasswordHash,
                emailVerified: true,
                createdAt: new Date().toISOString()
            }
        ]
    });

    const reportStore = new MemoryReportStore();
    await reportStore.save({
        id: 'r1',
        title: 'Report 1',
        generatedAt: new Date().toISOString(),
        ownerId: 'regular-id',
        sources: []
    });

    const app = createTestApp({ authStore, reportStore });
    const { server, url } = await listen(app);

    try {
        // 1. Unauthenticated request to admin stats is blocked (401)
        const res1 = await fetch(`${url}/api/admin/stats`);
        assert.equal(res1.status, 401);

        // 2. Regular user logs in and tries to access admin stats (blocked 403)
        const regularLogin = await fetch(`${url}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'regular@example.com', password: 'SecurePass123!' })
        });
        const regCookie = regularLogin.headers.get('set-cookie');
        
        const res2 = await fetch(`${url}/api/admin/stats`, {
            headers: { Cookie: regCookie }
        });
        assert.equal(res2.status, 403);

        // 3. Admin user logs in and accesses admin stats (success 200)
        const adminLogin = await fetch(`${url}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@neuralbi.io', password: 'SecurePass123!' })
        });
        const adminCookie = adminLogin.headers.get('set-cookie');

        const res3 = await fetch(`${url}/api/admin/stats`, {
            headers: { Cookie: adminCookie }
        });
        const body3 = await res3.json();
        assert.equal(res3.status, 200);
        assert.equal(body3.stats.totalUsers, 2);
        assert.equal(body3.stats.totalReports, 1);

        // 4. Admin lists reports
        const res4 = await fetch(`${url}/api/admin/reports`, {
            headers: { Cookie: adminCookie }
        });
        const body4 = await res4.json();
        assert.equal(res4.status, 200);
        assert.equal(body4.reports.length, 1);

        // 5. Admin lists users
        const res5 = await fetch(`${url}/api/admin/users`, {
            headers: { Cookie: adminCookie }
        });
        const body5 = await res5.json();
        assert.equal(res5.status, 200);
        assert.equal(body5.users.length, 2);

        // 6. Admin deletes a report
        const res6 = await fetch(`${url}/api/admin/reports/r1`, {
            method: 'DELETE',
            headers: { Cookie: adminCookie }
        });
        assert.equal(res6.status, 204);
        assert.equal((await reportStore.readAll()).length, 0);

        // 7. Admin deletes a user (regular user)
        const res7 = await fetch(`${url}/api/admin/users/regular-id`, {
            method: 'DELETE',
            headers: { Cookie: adminCookie }
        });
        assert.equal(res7.status, 204);
        assert.equal((await authStore.readState()).users.length, 1);

    } finally {
        server.close();
    }
});

test('requireAdmin blocks email starting with admin@ if not whitelisted or role not admin', async () => {
    const { hashPassword } = require('../lib/security/passwords');
    const attackerPasswordHash = await hashPassword('SecurePass123!');

    const authStore = new MemoryAuthStore({
        users: [
            {
                id: 'attacker-id',
                email: 'admin@attacker.com',
                name: 'Attacker User',
                passwordHash: attackerPasswordHash,
                emailVerified: true,
                createdAt: new Date().toISOString()
            }
        ]
    });

    const app = createTestApp({ authStore });
    const { server, url } = await listen(app);

    try {
        const login = await fetch(`${url}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@attacker.com', password: 'SecurePass123!' })
        });
        const cookie = login.headers.get('set-cookie');
        
        const res = await fetch(`${url}/api/admin/stats`, {
            headers: { Cookie: cookie }
        });
        assert.equal(res.status, 403);
    } finally {
        server.close();
    }
});

test('requireAdmin allows whitelisted email addresses even without role admin', async () => {
    const { hashPassword } = require('../lib/security/passwords');
    const whitelistedPasswordHash = await hashPassword('SecurePass123!');

    const authStore = new MemoryAuthStore({
        users: [
            {
                id: 'whitelisted-id',
                email: 'divyanshu.b.sinha@gmail.com',
                name: 'Whitelisted User',
                passwordHash: whitelistedPasswordHash,
                emailVerified: true,
                createdAt: new Date().toISOString()
            }
        ]
    });

    const app = createTestApp({ authStore });
    const { server, url } = await listen(app);

    try {
        const login = await fetch(`${url}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'divyanshu.b.sinha@gmail.com', password: 'SecurePass123!' })
        });
        const cookie = login.headers.get('set-cookie');
        
        const res = await fetch(`${url}/api/admin/stats`, {
            headers: { Cookie: cookie }
        });
        assert.equal(res.status, 200);
    } finally {
        server.close();
    }
});

test('timingSafeEqual is used for API token auth', async () => {
    const reportStore = new MemoryReportStore();
    const app = createTestApp({
        reportStore,
        config: testConfig({ apiAuthToken: 'secure-token-123' })
    });
    const { server, url } = await listen(app);

    try {
        // Correct token should succeed (200)
        const res1 = await fetch(`${url}/api/reports`, {
            headers: { 'Authorization': 'Bearer secure-token-123' }
        });
        assert.equal(res1.status, 200);

        // Incorrect token should fail (401)
        const res2 = await fetch(`${url}/api/reports`, {
            headers: { 'Authorization': 'Bearer wrong-token' }
        });
        assert.equal(res2.status, 401);
    } finally {
        server.close();
    }
});
