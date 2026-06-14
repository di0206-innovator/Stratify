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
