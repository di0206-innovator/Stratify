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

function listen(app) {
    return new Promise((resolve) => {
        const server = app.listen(0, () => {
            const { port } = server.address();
            resolve({ server, url: `http://127.0.0.1:${port}` });
        });
    });
}

test('POST /api/analyze/stream streams intermediate and final results', async () => {
    const mockReport = {
        id: 'report-stream-1',
        title: 'Validation Brief for Premium coffee',
        generatedAt: new Date().toISOString(),
        sections: { executiveSnapshot: 'Demo thesis' },
        sources: [],
        mode: 'demo',
        intelligenceMode: 'demo_grounding'
    };

    const orchestratorMock = {
        mode: 'demo',
        modelName: 'demo',
        searchProvider: { enabled: false },
        processInquiryStream: async (query, options, onUpdate) => {
            onUpdate({ event: 'log', data: { id: 'founder', message: 'Context mapped.' } });
            onUpdate({ event: 'analysis', data: { marketSignals: [], risks: [], assumptions: [] } });
            onUpdate({ event: 'strategy', data: { thesis: 'Demo thesis' } });
            onUpdate({ event: 'result', data: mockReport });
            return mockReport;
        }
    };

    const app = createApp({
        logger: silentLogger,
        reportStore: new MemoryReportStore(),
        authStore: new MemoryAuthStore(),
        config: testConfig(),
        orchestrator: orchestratorMock,
        disableBackgroundMonitor: true
    });

    const { server, url } = await listen(app);

    try {
        const response = await fetch(`${url}/api/analyze/stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: 'Should I open a coffee shop in Bengaluru?',
                founderProfile: {
                    founderType: 'solo',
                    startupStage: 'idea',
                    industry: 'consumer coffee',
                    geography: 'Bengaluru',
                    product: 'coffee shop',
                    targetCustomer: 'office workers',
                    teamSize: '1-2',
                    budget: 'bootstrapped',
                    timeline: '3 months',
                    currentGoal: 'validate first cohort'
                }
            })
        });

        assert.equal(response.status, 200);
        assert.equal(response.headers.get('content-type'), 'text/event-stream');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        const events = [];

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            let currentEvent = '';
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;

                if (trimmed.startsWith('event: ')) {
                    currentEvent = trimmed.substring(7).trim();
                } else if (trimmed.startsWith('data: ')) {
                    const rawData = trimmed.substring(6).trim();
                    events.push({
                        event: currentEvent,
                        data: JSON.parse(rawData)
                    });
                }
            }
        }

        assert.ok(events.length >= 4, 'Should receive at least 4 streamed events');
        assert.equal(events[0].event, 'log');
        assert.equal(events[0].data.id, 'founder');
        assert.equal(events[1].event, 'analysis');
        assert.equal(events[2].event, 'strategy');
        assert.equal(events[3].event, 'result');
        assert.equal(events[3].data.id, 'report-stream-1');
    } finally {
        server.close();
    }
});
