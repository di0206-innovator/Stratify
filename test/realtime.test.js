const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../server');
const { MemoryAuthStore } = require('../lib/authStore');
const { MemoryReportStore } = require('../lib/reportStore');

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
        apiAuthToken: 'test-api-token',
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

class MockStartupStore {
    constructor() {
        this.posts = [];
        this.bounties = [];
        this.startups = [];
    }
    async init() {}
    async createPost(post) {
        this.posts.unshift(post);
        return post;
    }
    async listPosts() {
        return this.posts;
    }
    async getPost(id) {
        return this.posts.find(p => p.id === id) || null;
    }
    async updatePost(id, updates) {
        const post = this.posts.find(p => p.id === id);
        if (!post) return null;
        Object.assign(post, updates);
        return post;
    }
    async getStartupByOwner() {
        return { id: 'startup-123', name: 'Mock Startup' };
    }
    async createTimelineEvent() {}
    async listStartups() {
        return this.startups;
    }
    async saveStartup(startup) {
        const idx = this.startups.findIndex(s => s.id === startup.id);
        if (idx !== -1) {
            this.startups[idx] = startup;
        } else {
            this.startups.push(startup);
        }
        return startup;
    }
}

function appWithMockStore(startupStore) {
    return createApp({
        logger: silentLogger,
        authStore: new MemoryAuthStore(),
        reportStore: new MemoryReportStore(),
        startupStore,
        config: config(),
        disableBackgroundMonitor: true,
        orchestrator: {
            mode: 'demo',
            modelName: 'demo',
            searchProvider: { enabled: false }
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

test('SSE connection establishes and receives initial connection payload', async () => {
    const store = new MockStartupStore();
    const app = appWithMockStore(store);
    const { server, url } = await listen(app);
    const controller = new AbortController();

    try {
        const response = await fetch(`${url}/api/realtime/stream`, {
            signal: controller.signal
        });
        assert.equal(response.status, 200);
        assert.equal(response.headers.get('content-type'), 'text/event-stream');
        assert.equal(response.headers.get('cache-control'), 'no-cache');
        
        // Read the stream to verify first data chunk
        const reader = response.body.getReader();
        const { value } = await reader.read();
        const chunkStr = new TextDecoder().decode(value);
        
        assert.match(chunkStr, /Stratify Realtime stream activated/);
        reader.releaseLock();
    } finally {
        controller.abort();
        if (server.closeAllConnections) {
            server.closeAllConnections();
        }
        server.close();
    }
});

test('Clapping post updates score and returns success', async () => {
    const store = new MockStartupStore();
    const app = appWithMockStore(store);
    const { server, url } = await listen(app);

    try {
        // Create initial post
        const post = {
            id: 'post-1',
            startupId: 'startup-123',
            authorId: 'user-1',
            content: 'Hello World',
            type: 'post',
            metadata: {}
        };
        await store.createPost(post);

        // Post clap with test auth token
        const clapRes = await fetch(`${url}/api/posts/post-1/clap`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer test-api-token'
            }
        });
        
        assert.equal(clapRes.status, 200);
        const body = await clapRes.json();
        assert.equal(body.post.metadata.claps, 1);
    } finally {
        if (server.closeAllConnections) {
            server.closeAllConnections();
        }
        server.close();
    }
});

test('Explore API fallback seeds a startup in real-time when query returns empty list', async () => {
    const store = new MockStartupStore();
    const app = appWithMockStore(store);
    const { server, url } = await listen(app);

    try {
        const res = await fetch(`${url}/api/explore/startups?search=zomato`);
        assert.equal(res.status, 200);
        const body = await res.json();

        // Assert that the dynamic seeding succeeded and returned the synthesized/mocked Zomato startup
        assert.equal(body.startups.length, 1);
        assert.equal(body.startups[0].name.toLowerCase(), 'zomato');
        assert.equal(body.startups[0].ownerId, 'system-seeded');

        // Confirm it was actually persisted in our store
        const savedStartups = await store.listStartups();
        assert.equal(savedStartups.length, 1);
        assert.equal(savedStartups[0].name.toLowerCase(), 'zomato');
    } finally {
        if (server.closeAllConnections) {
            server.closeAllConnections();
        }
        server.close();
    }
});
