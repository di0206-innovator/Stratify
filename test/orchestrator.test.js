const test = require('node:test');
const assert = require('node:assert/strict');
const { GeminiBIOrchestrator } = require('../GEMINI_ORCHESTRATOR');

test('orchestrator uses grounded demo mode without API key', async () => {
    const orchestrator = new GeminiBIOrchestrator({ apiKey: '' });
    const report = await orchestrator.processInquiry('Analyze premium coffee expansion in Bengaluru', {
        founderProfile: {
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
        },
        reportOptions: {
            reportType: 'idea_validation',
            audience: 'founder',
            timeHorizon: '30_days'
        },
        sources: [{ title: 'Store interviews', summary: 'Customers mention freshness and convenient pickup.' }]
    });

    assert.equal(report.mode, 'demo');
    assert.equal(report.intelligenceMode, 'demo_grounding');
    assert.match(report.markdown, /7-Day Sprint/i);
    assert.equal(report.agentLogs.length, 7);
    assert.equal(report.sources[0].title, 'Store interviews');
});
