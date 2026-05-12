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
        ...overrides
    };
}

function createTestApp(options = {}) {
    return createApp({
        logger: silentLogger,
        reportStore: options.reportStore || new MemoryReportStore(),
        authStore: options.authStore || new MemoryAuthStore(),
        config: testConfig(options.config),
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
