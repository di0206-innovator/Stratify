const test = require('node:test');
const assert = require('node:assert/strict');
const { LockManager } = require('../lib/security/lock');

test('LockManager serializes concurrent acquisitions on the same key', async () => {
    const lock = new LockManager();
    const order = [];

    const p1 = lock.acquire('test-key').then(async (release) => {
        order.push('start-1');
        await new Promise(r => setTimeout(r, 50));
        order.push('end-1');
        release();
    });

    // Let the event loop advance slightly before starting p2 (though not strictly necessary)
    await new Promise(r => setTimeout(r, 5));

    const p2 = lock.acquire('test-key').then(async (release) => {
        order.push('start-2');
        await new Promise(r => setTimeout(r, 10));
        order.push('end-2');
        release();
    });

    await Promise.all([p1, p2]);

    // Check that p2 did not start until p1 ended
    assert.deepEqual(order, ['start-1', 'end-1', 'start-2', 'end-2']);
});

test('LockManager allows parallel acquisitions on different keys', async () => {
    const lock = new LockManager();
    const order = [];

    const p1 = lock.acquire('key-1').then(async (release) => {
        order.push('start-1');
        await new Promise(r => setTimeout(r, 30));
        order.push('end-1');
        release();
    });

    const p2 = lock.acquire('key-2').then(async (release) => {
        order.push('start-2');
        await new Promise(r => setTimeout(r, 10));
        order.push('end-2');
        release();
    });

    await Promise.all([p1, p2]);

    // Since key-2 is parallel and shorter, it should end before key-1 ends
    assert.equal(order.indexOf('start-2') > -1, true);
    assert.equal(order.indexOf('end-2') < order.indexOf('end-1'), true);
});

test('LockManager serializes multi-process access using atomic lockfiles', async () => {
    const lock = new LockManager();
    const fs = require('fs/promises');
    const path = require('path');
    
    const key = path.join(__dirname, 'test-process-lock-file.json');
    const lockFilePath = `${key}.lock`;
    
    // Ensure clean start (no stale lockfile)
    try {
        await fs.unlink(lockFilePath);
    } catch (err) {}

    // 1. Manually create the lock file to simulate another process holding the lock
    await fs.writeFile(lockFilePath, 'held-by-external-process');

    const start = Date.now();
    let lockAcquired = false;

    // 2. Try to acquire the lock in a promise (it should block and wait)
    const acquirePromise = lock.acquire(key).then((release) => {
        lockAcquired = true;
        return release;
    });

    // Let the acquire attempt run and get blocked
    await new Promise(r => setTimeout(r, 150));
    assert.equal(lockAcquired, false, 'Lock acquisition should be blocked by existing lockfile');

    // 3. Delete the lockfile manually to simulate the other process releasing it
    await fs.unlink(lockFilePath);

    // 4. The acquire promise should resolve now
    const release = await acquirePromise;
    assert.equal(lockAcquired, true, 'Lock should be successfully acquired once lockfile is deleted');

    // Clean up
    await release();
    
    // Check that lockfile was unlinked by release
    const exists = await fs.access(lockFilePath).then(() => true).catch(() => false);
    assert.equal(exists, false, 'Lockfile should be unlinked upon release');
});
