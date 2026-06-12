const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs/promises');
const { FileSignalStore, MemorySignalStore } = require('../lib/signalStore');
const { startBackgroundSignalMonitor, createApp } = require('../server');
const { MemoryReportStore } = require('../lib/reportStore');
const { MemoryAuthStore } = require('../lib/authStore');

const tmpDir = path.join(__dirname, 'tmp_signals_test');

test.before(async () => {
    await fs.mkdir(tmpDir, { recursive: true });
});

test.after(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
});

test('MemorySignalStore caching and expiration', async () => {
    const store = new MemorySignalStore();
    await store.init();

    // Cache miss
    const miss = await store.getSignals('retail', 'Global');
    assert.equal(miss, null);

    // Save & Cache hit
    const testSignals = [{ type: 'TREND', title: 'Retail growth' }];
    await store.saveSignals('retail', 'Global', testSignals, 'demo');
    
    const hit = await store.getSignals('retail', 'Global');
    assert.ok(hit);
    assert.equal(hit.mode, 'demo');
    assert.deepEqual(hit.signals, testSignals);

    // Case-insensitivity and trim check
    const hit2 = await store.getSignals(' RETAIL ', ' global ');
    assert.ok(hit2);
    assert.deepEqual(hit2.signals, testSignals);
});

test('FileSignalStore reads and writes correctly', async () => {
    const filePath = path.join(tmpDir, 'signals_test_store.json');
    const store = new FileSignalStore({ filePath });
    await store.init();

    const testSignals = [{ type: 'FUNDING', title: 'Coffee startup funding' }];
    await store.saveSignals('consumer coffee', 'Bengaluru', testSignals, 'live');

    // Re-instantiate to verify persistence
    const store2 = new FileSignalStore({ filePath });
    await store2.init();

    const hit = await store2.getSignals('consumer coffee', 'Bengaluru');
    assert.ok(hit);
    assert.equal(hit.mode, 'live');
    assert.deepEqual(hit.signals, testSignals);
});

test('Background signals sweep processes sectors from reports', async () => {
    const authStore = new MemoryAuthStore({
        users: [{ id: 'user-1', email: 'user1@example.com', emailVerified: true }],
        sessions: [],
        tokens: [],
        emailOutbox: []
    });

    const reportStore = new MemoryReportStore();
    await reportStore.save({
        id: 'report-1',
        ownerId: 'user-1',
        title: 'Report 1',
        generatedAt: new Date().toISOString(),
        founderContext: {
            profile: {
                industry: 'SaaS',
                geography: 'US',
                targetCustomer: 'developers'
            }
        }
    });

    const signalStore = new MemorySignalStore();
    
    let processedSector = null;
    const orchestrator = {
        processSignals: async (sector) => {
            processedSector = sector;
            return {
                signals: [{ type: 'TECH SHIFT', title: `Sweep shift for ${sector.industry}` }],
                mode: 'demo'
            };
        }
    };

    const logger = {
        info() {},
        warn() {},
        error() {}
    };

    const monitor = startBackgroundSignalMonitor({
        authStore,
        reportStore,
        orchestrator,
        signalStore,
        logger,
        config: { nodeEnv: 'test' }
    });

    try {
        // Manually run sweep for instant test validation
        await monitor.runSweep();

        assert.ok(processedSector, 'Orchestrator should have processed a sector');
        assert.equal(processedSector.industry, 'SaaS');
        assert.equal(processedSector.geography, 'US');

        // Check if saved to store
        const cached = await signalStore.getSignals('SaaS', 'US');
        assert.ok(cached);
        assert.equal(cached.mode, 'demo');
        assert.equal(cached.signals[0].title, 'Sweep shift for SaaS');
    } finally {
        monitor.stop();
    }
});
