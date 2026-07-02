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
    info: console.log,
    warn: console.warn,
    error: console.error
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

test('End-to-End Graph Integration', async (t) => {
    const tmpDir = path.join(os.tmpdir(), `stratify-graph-test-${Date.now()}`);
    await fs.mkdir(tmpDir, { recursive: true });
    const userId = crypto.randomUUID();

    // Initialize stores
    const authStore = new MemoryAuthStore({
        users: [{
            id: userId,
            email: 'test@example.com',
            passwordHash: 'dummy',
            emailVerified: true,
            createdAt: Date.now()
        }],
        sessions: [{
            id: 'mock-session',
            userId: userId,
            tokenHash: crypto.createHash('sha256').update('test-session-id').digest('base64url'),
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString()
        }]
    });
    const startupStore = new FileStartupStore(tmpDir);
    const reportStore = new MemoryReportStore();

    let passedHistory = null;
    let orchestratorCalled = false;

    // Mock Orchestrator
    const mockOrchestrator = {
        mode: 'demo',
        modelName: 'demo',
        searchProvider: { enabled: false },
        processInquiry: async (query, options) => {
            orchestratorCalled = true;
            passedHistory = options.founderProfile.history;

            return {
                id: 'report-123',
                title: 'Test Report',
                founderContext: options.founderProfile,
                sources: [],
                mode: 'demo',
                intelligenceMode: 'demo_grounding',
                rawStrategy: {
                    validationScore: 85,
                    riskScore: 20
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

    try {
        // 1. Setup session cookie
        const cookie = `stratify_session=test-session-id`;

        // 2. Create a startup for this user
        const startup = await startupStore.saveStartup({
            id: 'test-startup-id',
            ownerId: userId,
            name: 'Graph Test Startup',
            product: 'End to end testing tool',
            targetCustomer: 'Developers',
            industry: 'DevTools',
            geography: 'Global',
            stage: 'idea',
            score: 0
        });
        const fetched = await startupStore.getStartupByOwner(userId);
        assert.ok(fetched, 'Startup should be retrievable by ownerId');

        // 3. Create a decision (history)
        await startupStore.createDecision({
            id: 'test-decision-id',
            startupId: startup.id,
            authorId: userId,
            title: 'Pivoted to E2E Testing',
            context: 'Found better market fit here.',
            status: 'completed'
        });

        // 4. Create a timeline event
        await startupStore.createTimelineEvent({
            id: 'test-timeline-id',
            startupId: startup.id,
            actorId: userId,
            eventType: 'milestone',
            title: 'Wrote first test',
            description: 'It passes.',
            metadata: {}
        });

        // 5. Call /api/analyze
        const analyzeBody = {
            query: 'Should we expand to QA engineers?',
            founderProfile: {
                founderType: 'solo',
                startupStage: startup.stage,
                industry: startup.industry,
                geography: startup.geography,
                product: startup.product,
                targetCustomer: startup.targetCustomer,
                teamSize: 'solo',
                budget: 'bootstrapped',
                timeline: '30 days',
                currentGoal: 'expansion'
            },
            reportOptions: {
                reportType: 'idea_validation',
                audience: 'founder',
                timeHorizon: '30_days'
            }
        };

        const res = await fetch(`${url}/api/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookie
            },
            body: JSON.stringify(analyzeBody)
        });

        assert.equal(res.status, 201);
        const data = await res.json();
        assert.ok(data.report);

        // 6. Verify Orchestrator received history
        assert.ok(orchestratorCalled, 'Orchestrator should have been called');
        assert.ok(passedHistory, 'History should have been passed to orchestrator');
        
        assert.equal(passedHistory.decisions.length, 1);
        assert.equal(passedHistory.decisions[0].title, 'Pivoted to E2E Testing');
        
        assert.equal(passedHistory.timeline.length, 1);
        assert.equal(passedHistory.timeline[0].title, 'Wrote first test');

        // 7. Verify Startup Scores were updated based on rawStrategy
        const updatedStartup = await startupStore.getStartup(startup.id);
        
        assert.equal(updatedStartup.validation_score, 85, 'validation_score should be updated from rawStrategy');
        // score is 100 - riskScore (100 - 20 = 80)
        assert.equal(updatedStartup.score, 80, 'score should be updated from inverted riskScore');

    } finally {
        server.close();
        await fs.rm(tmpDir, { recursive: true, force: true });
    }
});
