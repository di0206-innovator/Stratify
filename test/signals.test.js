const test = require('node:test');
const assert = require('node:assert/strict');
const { GeminiBIOrchestrator } = require('../lib/intelligence/orchestrator');

const testProfile = {
    founderType: 'solo',
    startupStage: 'idea',
    industry: 'consumer coffee',
    geography: 'Bengaluru',
    product: 'premium pickup-first coffee brand',
    targetCustomer: 'urban professionals',
    teamSize: 'solo',
    budget: 'bootstrapped',
    timeline: '30 days',
    currentGoal: 'validate repeat demand'
};

test('orchestrator signals generation in demo mode returns structured signals', async () => {
    const orchestrator = new GeminiBIOrchestrator({ apiKey: '' });
    const result = await orchestrator.processSignals(testProfile);

    assert.equal(result.mode, 'demo');
    assert.ok(Array.isArray(result.signals), 'Signals should be an array');
    assert.ok(result.signals.length >= 4, 'Should return at least 4 signals');

    const firstSignal = result.signals[0];
    assert.ok(firstSignal.type, 'Signal should have type');
    assert.ok(firstSignal.title, 'Signal should have title');
    assert.ok(firstSignal.description, 'Signal should have description');
    assert.ok(firstSignal.impact, 'Signal should have impact');
    assert.ok(firstSignal.sentiment, 'Signal should have sentiment');
    assert.ok(firstSignal.source, 'Signal should have source details');

    // Verify signals are founder-specific
    assert.ok(
        result.signals.some(sig => sig.description.includes('consumer coffee') || sig.title.includes('consumer coffee')),
        'Signals description or title should reference founder industry'
    );
    assert.ok(
        result.signals.some(sig => sig.description.includes('urban professionals')),
        'Signals should reference founder target customer'
    );
    assert.ok(
        result.signals.some(sig => sig.description.includes('Bengaluru') || sig.title.includes('Bengaluru')),
        'Signals should reference founder geography'
    );
});
