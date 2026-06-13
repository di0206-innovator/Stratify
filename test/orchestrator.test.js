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
        generateContent: async (request) => {
            let prompt = '';
            if (typeof request === 'string') {
                prompt = request;
            } else if (request && Array.isArray(request.contents)) {
                prompt = request.contents[0].parts[0].text;
            } else if (request && request.contents) {
                prompt = request.contents;
            }
            promptsCaptured.push(prompt);
            if (prompt.includes('ReAct Researcher Agent')) {
                if (prompt.includes('Step 1:')) {
                    return {
                        response: {
                            text: () => JSON.stringify({
                                thought: 'I have found sufficient intelligence.',
                                action: 'finish',
                                actionInput: {}
                            })
                        }
                    };
                }
                return {
                    response: {
                        text: () => JSON.stringify({
                            thought: 'I will search for premium coffee market signals in Bengaluru.',
                            action: 'searchWeb',
                            actionInput: { query: 'pickup coffee Bengaluru market size' }
                        })
                    }
                };
            }
            if (prompt.includes('Market Trends Analyst Agent')) {
                return {
                    response: {
                        text: () => JSON.stringify({
                            marketSignals: [
                                'Growing convenience preference in tech parks [Source 1].',
                                'Pre-orders surge by 40% [Source 2].'
                            ],
                            opportunityGaps: [
                                'Gap 1: High queue wait times in office corridors.'
                            ]
                        })
                    }
                };
            }
            if (prompt.includes('Risk & Defense Assessment Specialist')) {
                return {
                    response: {
                        text: () => JSON.stringify({
                            risks: [
                                'Risk 1: High real estate costs in tech zones.'
                            ],
                            assumptions: [
                                'Assumption 1: Corporate parks allow pickup kiosks.'
                            ]
                        })
                    }
                };
            }
            if (prompt.includes('Founder Strategist Agent')) {
                return {
                    response: {
                        text: () => JSON.stringify({
                            thesis: 'Highly positive. Execute on pickup kiosks.',
                            positioning: 'Zero-wait premium convenience.',
                            recommendations: [
                                'launch pilot at Outer Ring Road hub.',
                                'build pre-order app.'
                            ]
                        })
                    }
                };
            }
            if (prompt.includes('Execution Coach Agent')) {
                return {
                    response: {
                        text: () => JSON.stringify({
                            sevenDaySprint: ['Day 1: Step 1', 'Day 2: Step 2', 'Day 3: Step 3', 'Day 4: Step 4', 'Day 5: Step 5', 'Day 6: Step 6', 'Day 7: Step 7'],
                            thirtyDayRoadmap: ['Week 1: Week 1', 'Week 2: Week 2', 'Week 3: Week 3', 'Week 4: Week 4'],
                            validationChecklist: ['Question 1', 'Question 2'],
                            nextAssets: ['Asset 1', 'Asset 2']
                        })
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
    assert.equal(report.searchPlan.queries.length, 1);
    assert.equal(report.searchPlan.queries[0], 'pickup coffee Bengaluru market size');

    // Verify all 7 prompts were captured (2 research steps + 2 parallel analysts + 1 strategy + 1 coach + 1 critic)
    assert.equal(promptsCaptured.length, 7);

    // Verify system prompts were prepended
    assert.ok(promptsCaptured[0].includes('# ROLE: AUTONOMOUS RESEARCH & DISCOVERY SPECIALIST'));
    assert.ok(promptsCaptured[1].includes('# ROLE: AUTONOMOUS RESEARCH & DISCOVERY SPECIALIST'));
    assert.ok(promptsCaptured[2].includes('# ROLE: QUANTITATIVE & QUALITATIVE MARKET TRENDS ANALYST') || promptsCaptured[2].includes('# ROLE: RISK & DEFENSE ASSESSMENT SPECIALIST'));
    assert.ok(promptsCaptured[3].includes('# ROLE: RISK & DEFENSE ASSESSMENT SPECIALIST') || promptsCaptured[3].includes('# ROLE: QUANTITATIVE & QUALITATIVE MARKET TRENDS ANALYST'));
    assert.ok(promptsCaptured[4].includes('# ROLE: EXECUTIVE STRATEGIST & LEAD ORCHESTRATOR'));
    assert.ok(promptsCaptured[5].includes("You are NeuralBI's Execution Coach Agent."));
    assert.ok(promptsCaptured[6].includes('QUALITY ASSURANCE & RESEARCH CRITIC'));

    // Verify section extraction worked
    assert.equal(report.sections.opportunityThesis, 'Zero-wait premium convenience.');
    assert.equal(report.sections.actionPlan.sevenDaySprint.length, 7);
    assert.equal(report.sections.actionPlan.sevenDaySprint[0].text, 'Day 1: Step 1');
});

test('live mode with JSON-enforced outputs parses correctly', async () => {
    const orchestrator = new GeminiBIOrchestrator({ apiKey: 'mock-api-key' });
    const schemasCaptured = [];

    orchestrator.model = {
        generateContent: async (request) => {
            let prompt = '';
            if (typeof request === 'string') {
                prompt = request;
            } else if (request && Array.isArray(request.contents)) {
                prompt = request.contents[0].parts[0].text;
            } else if (request && request.contents) {
                prompt = request.contents;
            }
            const schema = request.generationConfig && request.generationConfig.responseSchema;
            schemasCaptured.push(schema);

            if (prompt.includes('ReAct Researcher Agent')) {
                if (prompt.includes('Step 1:')) {
                    return {
                        response: {
                            text: () => JSON.stringify({
                                thought: 'I have found sufficient intelligence.',
                                action: 'finish',
                                actionInput: {}
                            })
                        }
                    };
                }
                return {
                    response: {
                        text: () => JSON.stringify({
                            thought: 'I will search for premium coffee market signals in Bengaluru.',
                            action: 'searchWeb',
                            actionInput: { query: 'query A' }
                        })
                    }
                };
            }
            if (prompt.includes('Market Trends Analyst Agent')) {
                return {
                    response: {
                        text: () => JSON.stringify({
                            marketSignals: ['JSON Signal 1', 'JSON Signal 2'],
                            opportunityGaps: ['JSON Gap 1']
                        })
                    }
                };
            }
            if (prompt.includes('Risk & Defense Assessment Specialist')) {
                return {
                    response: {
                        text: () => JSON.stringify({
                            risks: ['JSON Risk 1'],
                            assumptions: ['JSON Assumption 1']
                        })
                    }
                };
            }
            if (prompt.includes('Founder Strategist Agent')) {
                return {
                    response: {
                        text: () => JSON.stringify({
                            thesis: 'JSON Thesis.',
                            positioning: 'JSON Positioning.',
                            recommendations: ['JSON Rec 1', 'JSON Rec 2']
                        })
                    }
                };
            }
            if (prompt.includes('Execution Coach Agent')) {
                return {
                    response: {
                        text: () => JSON.stringify({
                            sevenDaySprint: ['Day 1: J1', 'Day 2: J2', 'Day 3: J3', 'Day 4: J4', 'Day 5: J5', 'Day 6: J6', 'Day 7: J7'],
                            thirtyDayRoadmap: ['Week 1: W1', 'Week 2: W2', 'Week 3: W3', 'Week 4: W4'],
                            validationChecklist: ['Q1', 'Q2'],
                            nextAssets: ['A1', 'A2']
                        })
                    }
                };
            }
            return { response: { text: () => '{}' } };
        }
    };

    const report = await orchestrator.processInquiry('Analyze JSON schemas path', {
        founderProfile: testProfile,
        reportOptions: {
            reportType: 'idea_validation',
            audience: 'founder',
            timeHorizon: '30_days'
        },
        sources: []
    });

    assert.equal(report.mode, 'live');
    assert.deepEqual(report.searchPlan.queries, ['query A']);
    assert.equal(report.sections.marketSignals[0], 'JSON Signal 1');
    assert.equal(report.sections.opportunityThesis, 'JSON Positioning.');
    assert.equal(report.sections.actionPlan.sevenDaySprint[0].text, 'Day 1: J1');
    assert.equal(report.sections.actionPlan.thirtyDayRoadmap[0].text, 'Week 1: W1');
    
    // Verify schemas were indeed captured (Planner, Trends, Risks, Strategist, Coach, Critic)
    assert.ok(schemasCaptured[0] != null, 'ReAct steps should have schema');
    assert.ok(schemasCaptured[1] != null, 'Market Trends should have schema');
    assert.ok(schemasCaptured[2] != null, 'Risk Assessment should have schema');
    assert.ok(schemasCaptured[3] != null, 'Founder Strategist should have schema');
    assert.ok(schemasCaptured[4] != null, 'Execution Coach should have schema');
    assert.ok(schemasCaptured[5] != null, 'QA Critic should have schema');
});

test('live mode with QA Critic revision loop triggered and resolved', async () => {
    const orchestrator = new GeminiBIOrchestrator({ apiKey: 'mock-api-key' });
    let criticCallCount = 0;
    let strategistCallCount = 0;
    let coachCallCount = 0;
    let feedbackReceivedByStrategist = null;
    let feedbackReceivedByCoach = null;

    orchestrator.model = {
        generateContent: async (request) => {
            let prompt = '';
            if (typeof request === 'string') {
                prompt = request;
            } else if (request && Array.isArray(request.contents)) {
                prompt = request.contents[0].parts[0].text;
            } else if (request && request.contents) {
                prompt = request.contents;
            }

            if (prompt.includes('ReAct Researcher Agent')) {
                if (prompt.includes('Step 1:')) {
                    return {
                        response: {
                            text: () => JSON.stringify({
                                thought: 'I have found sufficient intelligence.',
                                action: 'finish',
                                actionInput: {}
                            })
                        }
                    };
                }
                return {
                    response: {
                        text: () => JSON.stringify({
                            thought: 'I will search for critique target signals.',
                            action: 'searchWeb',
                            actionInput: { query: 'q1' }
                        })
                    }
                };
            }
            if (prompt.includes('Market Trends Analyst Agent')) {
                return {
                    response: {
                        text: () => JSON.stringify({
                            marketSignals: ['S1'],
                            opportunityGaps: ['G1']
                        })
                    }
                };
            }
            if (prompt.includes('Risk & Defense Assessment Specialist')) {
                return {
                    response: {
                        text: () => JSON.stringify({
                            risks: ['R1'],
                            assumptions: ['A1']
                        })
                    }
                };
            }
            if (prompt.includes('Founder Strategist Agent')) {
                strategistCallCount++;
                if (prompt.includes('REVISION INSTRUCTIONS FROM QUALITY CRITIC')) {
                    feedbackReceivedByStrategist = prompt;
                    return {
                        response: {
                            text: () => JSON.stringify({
                                thesis: 'Revised strategy thesis.',
                                positioning: 'Revised positioning.',
                                recommendations: ['Revised recommendation 1']
                            })
                        }
                    };
                }
                return {
                    response: {
                        text: () => JSON.stringify({
                            thesis: 'Original strategy thesis.',
                            positioning: 'Original positioning.',
                            recommendations: ['Original recommendation 1']
                        })
                    }
                };
            }
            if (prompt.includes('Execution Coach Agent')) {
                coachCallCount++;
                if (prompt.includes('REVISION INSTRUCTIONS FROM QUALITY CRITIC')) {
                    feedbackReceivedByCoach = prompt;
                    return {
                        response: {
                            text: () => JSON.stringify({
                                sevenDaySprint: ['Day 1: Revised Step', 'Day 2: Step 2', 'Day 3: Step 3', 'Day 4: Step 4', 'Day 5: Step 5', 'Day 6: Step 6', 'Day 7: Step 7'],
                                thirtyDayRoadmap: ['Week 1: Revised W1', 'Week 2: W2', 'Week 3: W3', 'Week 4: W4'],
                                validationChecklist: ['Revised Checklist Q'],
                                nextAssets: ['Revised Asset']
                            })
                        }
                    };
                }
                return {
                    response: {
                        text: () => JSON.stringify({
                            sevenDaySprint: ['Day 1: Step 1', 'Day 2: Step 2', 'Day 3: Step 3', 'Day 4: Step 4', 'Day 5: Step 5', 'Day 6: Step 6', 'Day 7: Step 7'],
                            thirtyDayRoadmap: ['Week 1: W1', 'Week 2: W2', 'Week 3: W3', 'Week 4: W4'],
                            validationChecklist: ['Original Checklist Q'],
                            nextAssets: ['Original Asset']
                        })
                    }
                };
            }
            if (prompt.includes('QUALITY ASSURANCE & RESEARCH CRITIC')) {
                criticCallCount++;
                if (criticCallCount === 1) {
                    return {
                        response: {
                            text: () => JSON.stringify({
                                verdict: 'revise',
                                feedback: 'Please refine recommendations and execution steps.',
                                issues: ['Generic recommendations.']
                            })
                        }
                    };
                } else {
                    return {
                        response: {
                            text: () => JSON.stringify({
                                verdict: 'approve',
                                feedback: '',
                                issues: []
                            })
                        }
                    };
                }
            }
            return { response: { text: () => '{}' } };
        }
    };

    const report = await orchestrator.processInquiry('Analyze critic loop', {
        founderProfile: testProfile,
        reportOptions: {
            reportType: 'idea_validation',
            audience: 'founder',
            timeHorizon: '30_days'
        },
        sources: []
    });

    assert.equal(report.mode, 'live');
    // Critic should have been called twice (once for revision, once for final approval)
    assert.equal(criticCallCount, 2);
    // Strategist and Coach should have been called twice (once for initial draft, once for revision)
    assert.equal(strategistCallCount, 2);
    assert.equal(coachCallCount, 2);

    // Verify feedback was received in the prompt of revision calls
    assert.ok(feedbackReceivedByStrategist.includes('Please refine recommendations and execution steps.'));
    assert.ok(feedbackReceivedByCoach.includes('Please refine recommendations and execution steps.'));

    // Verify final report sections contain revised content
    assert.equal(report.sections.executiveSnapshot, 'Revised strategy thesis.');
    assert.equal(report.sections.opportunityThesis, 'Revised positioning.');
    assert.equal(report.sections.actionPlan.sevenDaySprint[0].text, 'Day 1: Revised Step');
    assert.equal(report.sections.actionPlan.validationChecklist[0].text, 'Revised Checklist Q');

    // Verify logs show critic revision events
    const criticLogs = report.agentLogs.filter(l => l.id === 'critic');
    assert.equal(criticLogs.length, 2);
    assert.ok(criticLogs[0].message.includes('Revision requested: Generic recommendations.'));
    assert.ok(criticLogs[1].message.includes('Final validation completed: approve'));
});

test('cleanHtml strips scripts, styles, layouts and sanitizes text', () => {
    const { cleanHtml } = require('../lib/intelligence/searchProvider');
    const rawHtml = `
        <html>
            <head>
                <style>body { color: red; }</style>
                <script>alert("hello");</script>
            </head>
            <body>
                <header><nav><a href="/">Home</a></nav></header>
                <main>
                    <h1>Competitor Pricing</h1>
                    <p>Pricing starts at &nbsp; $10/month &amp; includes all features.</p>
                    <svg><path d="M0 0h24v24H0z"/></svg>
                </main>
                <footer>© 2026 Competitor</footer>
            </body>
        </html>
    `;
    const cleaned = cleanHtml(rawHtml);
    assert.ok(cleaned.includes('Competitor Pricing'));
    assert.ok(cleaned.includes('Pricing starts at $10/month & includes all features.'));
    assert.ok(!cleaned.includes('body { color'));
    assert.ok(!cleaned.includes('alert('));
    assert.ok(!cleaned.includes('Home'));
});

test('TavilySearchProvider extract method falls back to direct fetch', async () => {
    const { TavilySearchProvider } = require('../lib/intelligence/searchProvider');
    let fetchCalledUrls = [];
    const provider = new TavilySearchProvider({
        apiKey: 'dummy-key',
        fetchImpl: async (url, options) => {
            fetchCalledUrls.push(url);
            if (url === 'https://api.tavily.com/extract') {
                return {
                    ok: false,
                    status: 500,
                    text: async () => 'Internal Error'
                };
            }
            if (url === 'https://fallback-url.com') {
                return {
                    ok: true,
                    status: 200,
                    text: async () => '<html><body>Fallback Success</body></html>'
                };
            }
        }
    });

    const content = await provider.extract('https://fallback-url.com');
    assert.equal(content, 'Fallback Success');
    assert.ok(fetchCalledUrls.includes('https://api.tavily.com/extract'));
    assert.ok(fetchCalledUrls.includes('https://fallback-url.com'));
});

