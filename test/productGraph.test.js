const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../server');
const { FileStartupStore } = require('../lib/startupStore');
const { MemoryReportStore } = require('../lib/reportStore');
const { MemoryAuthStore } = require('../lib/authStore');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs/promises');
const crypto = require('node:crypto');

const silentLogger = {
    info: () => {},
    warn: () => {},
    error: () => {}
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
        adminEmails: [],
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

test('Startup Graph Integration Tests', async (t) => {
    const tmpDir = path.join(os.tmpdir(), `stratify-prod-graph-test-${Date.now()}`);
    await fs.mkdir(tmpDir, { recursive: true });
    const userId = crypto.randomUUID();

    // Initialize stores
    const authStore = new MemoryAuthStore({
        users: [{
            id: userId,
            email: 'founder@example.com',
            passwordHash: 'hashed',
            emailVerified: true,
            createdAt: Date.now(),
            role: 'founder'
        }],
        sessions: [{
            id: 'mock-session-id',
            userId: userId,
            tokenHash: crypto.createHash('sha256').update('session-token-123').digest('base64url'),
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString()
        }]
    });
    const startupStore = new FileStartupStore(tmpDir);
    const reportStore = new MemoryReportStore();

    // Mock Orchestrator
    const mockOrchestrator = {
        mode: 'demo',
        modelName: 'demo',
        searchProvider: { enabled: false },
        processInquiry: async (query, options) => {
            return {
                id: 'report-' + crypto.randomUUID(),
                title: 'Market Analysis Report',
                founderContext: options.founderProfile,
                sources: [],
                mode: 'demo',
                intelligenceMode: 'demo_grounding',
                rawStrategy: {
                    validationScore: 92,
                    riskScore: 15,
                    founderMarketFit: 88
                },
                rawExecution: {
                    executionReadiness: 75,
                    fundraisingReadiness: 80,
                    nextBestActions: []
                }
            };
        }
    };

    const app = createApp({
        logger: silentLogger,
        reportStore,
        authStore,
        startupStore,
        orchestrator: mockOrchestrator,
        config: testConfig(),
        disableBackgroundMonitor: true
    });

    const { server, url } = await listen(app);
    const cookie = `stratify_session=session-token-123`;

    try {
        // Step 1: Create a Startup profile via POST /api/startups
        const startupPayload = {
            name: 'Wedge AI',
            pitch: 'Next-gen database query optimization',
            problem: 'Query latency is too high',
            solution: 'Vector indexes',
            stage: 'idea',
            industry: 'Infrastructure',
            geography: 'SF'
        };

        const createRes = await fetch(`${url}/api/startups`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookie
            },
            body: JSON.stringify(startupPayload)
        });

        assert.equal(createRes.status, 201, 'Startup creation should succeed');
        const createData = await createRes.json();
        const startupId = createData.startup.id;
        assert.ok(startupId);

        // Step 2: Post a milestone to execution feed (POST /api/posts)
        const postPayload = {
            content: 'Launched closed alpha version to 50 design partners.',
            type: 'milestone',
            metadata: { powUrl: 'https://github.com/stratify' }
        };

        const postRes = await fetch(`${url}/api/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookie
            },
            body: JSON.stringify(postPayload)
        });

        assert.equal(postRes.status, 201, 'Posting milestone should succeed');
        
        // Verify Startup Score boosted and Timeline Event created
        const startupAfterMilestone = await startupStore.getStartup(startupId);
        assert.ok(startupAfterMilestone.score > 0, 'Startup score should be updated');

        const timelineEvents = await startupStore.listTimeline(startupId);
        const milestoneEvent = timelineEvents.find(e => e.eventType === 'milestone');
        assert.ok(milestoneEvent, 'Timeline should contain milestone event');
        assert.equal(milestoneEvent.metadata.powUrl, 'https://github.com/stratify');

        // Step 3: Log a decision (POST /api/decisions)
        const decisionPayload = {
            title: 'Transitioned deployment architecture to AWS Fargate',
            context: 'Allows horizontal auto-scaling based on latency metrics',
            outcome: 'Reduced operations burn by 15%',
            status: 'completed'
        };

        const decisionRes = await fetch(`${url}/api/decisions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookie
            },
            body: JSON.stringify(decisionPayload)
        });

        assert.equal(decisionRes.status, 201, 'Decision creation should succeed');

        // Verify Decision logged, Score boosted and Timeline Event created
        const decisionsList = await startupStore.listDecisions(startupId);
        const decisionRecord = decisionsList.find(d => d.title === decisionPayload.title);
        assert.ok(decisionRecord, 'Founder Memory should contain the decision');

        const startupAfterDecision = await startupStore.getStartup(startupId);
        assert.equal(startupAfterDecision.score, startupAfterMilestone.score + 5, 'Score should increase by 5 on decision logging');

        // Step 4: Generate a validation report (POST /api/analyze)
        const analyzePayload = {
            query: 'Evaluate GTM for DevTools wedge',
            founderProfile: {
                founderType: 'solo',
                startupStage: 'idea',
                industry: 'Infrastructure',
                geography: 'SF',
                product: 'Wedge AI',
                targetCustomer: 'Developers',
                currentGoal: 'Validate GTM'
            },
            reportOptions: {
                reportType: 'idea_validation',
                focusArea: 'market'
            }
        };

        const analyzeRes = await fetch(`${url}/api/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookie
            },
            body: JSON.stringify(analyzePayload)
        });

        assert.equal(analyzeRes.status, 201, 'Report analysis should succeed');
        
        // Verify Startup Scores are updated (validation_score, score, founder_market_fit, execution_readiness, fundraising_readiness)
        const finalStartup = await startupStore.getStartup(startupId);
        assert.equal(finalStartup.validation_score, 92, 'validation_score should update');
        assert.equal(finalStartup.founder_market_fit, 88, 'founder_market_fit should update');
        assert.equal(finalStartup.execution_readiness, 75, 'execution_readiness should update');
        assert.equal(finalStartup.fundraising_readiness, 80, 'fundraising_readiness should update');
        assert.equal(finalStartup.score, 100 - 15, 'score should update from riskScore inversion');

    } finally {
        server.close();
        await fs.rm(tmpDir, { recursive: true, force: true });
    }
});
