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

test('orchestrator uses grounded demo mode without API key', async () => {
    const orchestrator = new GeminiBIOrchestrator({ apiKey: '' });
    const report = await orchestrator.processInquiry('Analyze premium coffee expansion in Bengaluru', {
        founderProfile: testProfile,
        reportOptions: {
            reportType: 'idea_validation',
            audience: 'founder',
            timeHorizon: '30_days'
        },
        sources: [{ title: 'Store interviews', summary: 'Customers mention freshness and convenient pickup.' }]
    });

    assert.equal(report.mode, 'demo');
    assert.equal(report.intelligenceMode, 'demo_grounding');
    assert.ok(report.markdown.includes('7-Day Sprint'), 'idea_validation should include 7-Day Sprint');
    assert.equal(report.agentLogs.length, 7);
    assert.equal(report.sources[0].title, 'Store interviews');
    assert.ok(Array.isArray(report.sectionOrder), 'Report should include sectionOrder');
});

test('demo report sections differ by report type', async () => {
    const orchestrator = new GeminiBIOrchestrator({ apiKey: '' });
    const baseOptions = {
        founderProfile: testProfile,
        sources: [{ title: 'Test source', summary: 'Test summary for validation.' }]
    };

    const ideaReport = await orchestrator.processInquiry('Validate coffee concept', {
        ...baseOptions,
        reportOptions: { reportType: 'idea_validation', audience: 'founder', timeHorizon: '30_days' }
    });

    const pulseReport = await orchestrator.processInquiry('Validate coffee concept', {
        ...baseOptions,
        reportOptions: { reportType: 'market_pulse', audience: 'founder', timeHorizon: '30_days' }
    });

    const competitorReport = await orchestrator.processInquiry('Validate coffee concept', {
        ...baseOptions,
        reportOptions: { reportType: 'competitor_brief', audience: 'founder', timeHorizon: '30_days' }
    });

    const investorReport = await orchestrator.processInquiry('Validate coffee concept', {
        ...baseOptions,
        reportOptions: { reportType: 'investor_memo', audience: 'founder', timeHorizon: '30_days' }
    });

    const riskReport = await orchestrator.processInquiry('Validate coffee concept', {
        ...baseOptions,
        reportOptions: { reportType: 'risk_radar', audience: 'founder', timeHorizon: '30_days' }
    });

    // Section orders should differ
    assert.notDeepEqual(ideaReport.sectionOrder, pulseReport.sectionOrder,
        'idea_validation and market_pulse should have different section orders');
    assert.notDeepEqual(ideaReport.sectionOrder, competitorReport.sectionOrder,
        'idea_validation and competitor_brief should have different section orders');

    // market_pulse should NOT have actionPlan section in its order
    assert.ok(!pulseReport.sectionOrder.includes('actionPlan'),
        'market_pulse should not include actionPlan');

    // investor_memo should have investment-specific sections
    assert.ok(investorReport.sectionOrder.includes('tractionEvidence'),
        'investor_memo should include tractionEvidence');
    assert.ok(investorReport.sectionOrder.includes('askAndUse'),
        'investor_memo should include askAndUse');

    // risk_radar should have threat-specific sections
    assert.ok(riskReport.sectionOrder.includes('threatCategories'),
        'risk_radar should include threatCategories');
    assert.ok(riskReport.sectionOrder.includes('mitigationPlan'),
        'risk_radar should include mitigationPlan');

    // investor_memo sections should actually have content
    assert.ok(investorReport.sections.tractionEvidence,
        'investor_memo tractionEvidence should have content');
    assert.ok(investorReport.sections.marketOpportunity,
        'investor_memo marketOpportunity should have content');
});

test('demo mode uses founder-specific context in execution plan', async () => {
    const orchestrator = new GeminiBIOrchestrator({ apiKey: '' });
    const report = await orchestrator.processInquiry('Validate coffee concept', {
        founderProfile: testProfile,
        reportOptions: { reportType: 'idea_validation', audience: 'founder', timeHorizon: '30_days' },
        sources: []
    });

    const sprint = report.sections.actionPlan.sevenDaySprint;
    const roadmap = report.sections.actionPlan.thirtyDayRoadmap;
    const checklist = report.sections.actionPlan.validationChecklist;

    // Sprint should reference the founder's specific context
    assert.ok(sprint.some((item) => item.text.includes('urban professionals')),
        'Sprint should reference target customer');
    assert.ok(sprint.some((item) => item.text.includes('consumer coffee') || item.text.includes('Bengaluru')),
        'Sprint should reference industry or geography');

    // Roadmap should reference founder context
    assert.ok(roadmap.some((item) => item.text.includes('urban professionals') || item.text.includes('Bengaluru')),
        'Roadmap should reference founder context');

    // Checklist should reference founder context
    assert.ok(checklist.some((item) => item.text.includes('urban professionals') || item.text.includes('premium pickup-first coffee brand')),
        'Checklist should reference target customer or product');
});

test('demo mode risks and assumptions are founder-specific', async () => {
    const orchestrator = new GeminiBIOrchestrator({ apiKey: '' });
    const report = await orchestrator.processInquiry('Validate coffee concept', {
        founderProfile: testProfile,
        reportOptions: { reportType: 'idea_validation', audience: 'founder', timeHorizon: '30_days' },
        sources: []
    });

    const risks = report.sections.risks;
    const assumptions = report.sections.assumptions;

    assert.ok(risks.some((item) => item.includes('consumer coffee') || item.includes('urban professionals')),
        'Risks should reference founder industry or target customer');
    assert.ok(assumptions.some((item) => item.includes('urban professionals') || item.includes('premium pickup-first coffee brand')),
        'Assumptions should reference founder target customer or product');
});

test('live mode chains agents and includes role system prompts', async () => {
    const orchestrator = new GeminiBIOrchestrator({ apiKey: 'mock-api-key' });
    const promptsCaptured = [];

    orchestrator.model = {
        generateContent: async (prompt) => {
            promptsCaptured.push(prompt);
            if (prompt.includes('Discovery & Research Specialist Agent')) {
                return {
                    response: {
                        text: () => JSON.stringify([
                            'pickup coffee Bengaluru market size',
                            'urban professional coffee consumer preferences',
                            'office park coffee kiosks regulation Bengaluru',
                            'competitors premium pickup-first coffee brands'
                        ])
                    }
                };
            }
            if (prompt.includes('Market Analyst Agent')) {
                return {
                    response: {
                        text: () => `MARKET_SIGNALS:
- Growing convenience preference in tech parks [Source 1].
- Pre-orders surge by 40% [Source 2].

OPPORTUNITY_GAPS:
- Gap 1: High queue wait times in office corridors.

RISKS:
- Risk 1: High real estate costs in tech zones.

ASSUMPTIONS:
- Assumption 1: Corporate parks allow pickup kiosks.`
                    }
                };
            }
            if (prompt.includes('Founder Strategist Agent')) {
                return {
                    response: {
                        text: () => `THESIS:
Highly positive. Execute on pickup kiosks.

POSITIONING:
Zero-wait premium convenience.

RECOMMENDATIONS:
- launch pilot at Outer Ring Road hub.
- build pre-order app.`
                    }
                };
            }
            if (prompt.includes('Execution Coach Agent')) {
                return {
                    response: {
                        text: () => `SEVEN_DAY_SPRINT:
- Day 1: Step 1
- Day 2: Step 2
- Day 3: Step 3
- Day 4: Step 4
- Day 5: Step 5
- Day 6: Step 6
- Day 7: Step 7

THIRTY_DAY_ROADMAP:
- Week 1: Week 1
- Week 2: Week 2
- Week 3: Week 3
- Week 4: Week 4

VALIDATION_CHECKLIST:
- Question 1
- Question 2

NEXT_ASSETS:
- Asset 1
- Asset 2`
                    }
                };
            }
            return { response: { text: () => 'Dummy text' } };
        }
    };

    const report = await orchestrator.processInquiry('Analyze premium coffee expansion in Bengaluru', {
        founderProfile: testProfile,
        reportOptions: {
            reportType: 'idea_validation',
            audience: 'founder',
            timeHorizon: '30_days'
        },
        sources: [
            { title: 'Tech park stats', url: 'https://example.com/park', summary: 'High tech parks occupancy.' }
        ]
    });

    assert.equal(report.mode, 'live');
    assert.equal(report.searchPlan.queries.length, 4);
    assert.equal(report.searchPlan.queries[0], 'pickup coffee Bengaluru market size');

    // Verify all 4 prompts were captured
    assert.equal(promptsCaptured.length, 4);

    // Verify system prompts were prepended
    assert.ok(promptsCaptured[0].includes('# ROLE: DISCOVERY & RESEARCH SPECIALIST'));
    assert.ok(promptsCaptured[1].includes('# ROLE: QUANTITATIVE & QUALITATIVE DATA ANALYST'));
    assert.ok(promptsCaptured[2].includes('# ROLE: EXECUTIVE STRATEGIST & LEAD ORCHESTRATOR'));
    assert.ok(promptsCaptured[3].includes("You are NeuralBI's Execution Coach Agent."));

    // Verify section extraction worked
    assert.equal(report.sections.opportunityThesis, 'Zero-wait premium convenience.');
    assert.equal(report.sections.actionPlan.sevenDaySprint.length, 7);
    assert.equal(report.sections.actionPlan.sevenDaySprint[0].text, 'Day 1: Step 1');
});

