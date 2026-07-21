const test = require('node:test');
const assert = require('node:assert/strict');
const { FileWaitlistStore } = require('../lib/waitlistStore');

test('FileWaitlistStore correctly adds and counts waitlist candidates', async () => {
    const store = new FileWaitlistStore();
    await store.init();
    const initialCount = await store.count();

    const entry = await store.add({
        name: 'Test Founder',
        email: `test-${Date.now()}@example.com`,
        plan: 'pro',
        message: 'Excited for Stratify Pro!'
    });

    assert.ok(entry.id);
    assert.equal(entry.name, 'Test Founder');

    const newCount = await store.count();
    assert.equal(newCount, initialCount + 1);
});
