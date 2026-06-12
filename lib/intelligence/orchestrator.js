const crypto = require('crypto');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { TavilySearchProvider } = require('./searchProvider');
const { rankAndDedupeSources } = require('./sourceRanker');
const { summarizeFounder } = require('../founderProfile');
const {
    RESEARCHER_PROMPT,
    ANALYST_PROMPT,
    STRATEGIST_PROMPT,
    ANALYST_STRUCTURED_PROMPT,
    EXECUTION_COACH_PROMPT,
    REPORT_TYPE_INSTRUCTIONS,
    REPORT_SECTION_MAP,
    SECTION_TITLES,
    MARKET_SIGNALS_PROMPT
} = require('./prompts');
require('dotenv').config();

class GeminiBIOrchestrator {
    constructor(options = {}) {
        const apiKey = options.apiKey !== undefined ? options.apiKey : (process.env.GEMINI_API_KEY || '');
        this.modelName = options.modelName || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
        this.mode = apiKey ? 'live' : 'demo';
        this.genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
        this.model = this.genAI ? this.genAI.getGenerativeModel({ model: this.modelName }) : null;
        this.searchProvider = options.searchProvider || new TavilySearchProvider({
            apiKey: options.tavilyApiKey || process.env.TAVILY_API_KEY || ''
        });

        if (!apiKey) {
            console.warn('GEMINI_API_KEY is missing. Running in structured founder demo mode.');
        }
    }

    async processInquiry(userQuery, options = {}) {
        const agentLogs = [];
        const founderProfile = options.founderProfile;
        const reportOptions = options.reportOptions;

        const founderContext = this.runFounderContextAgent(founderProfile, reportOptions, userQuery);
        agentLogs.push(log('founder', 'Founder Context Agent', 'Founder profile, constraints, and decision context mapped.'));

        const searchPlan = this.mode === 'live'
            ? await this.runLiveQueryPlannerAgent(founderContext)
            : this.runQueryPlannerAgent(founderContext);
        agentLogs.push(log('research', 'Live Research Agent', `Prepared ${searchPlan.queries.length} real-time intelligence queries.`));

        const searchResults = await this.runLiveResearchAgent(searchPlan);
        const sources = rankAndDedupeSources(searchResults, options.sources || []);
        agentLogs.push(log('research', 'Live Research Agent', `${sources.length} sources ranked and deduplicated.`));

        const analysis = this.mode === 'live'
            ? await this.runLiveMarketAnalystAgent(founderContext, sources, searchResults)
            : this.runDemoMarketAnalystAgent(founderContext, sources, searchResults);
        agentLogs.push(log('analyst', 'Market Analyst Agent', 'Market signals, risks, and opportunity gaps extracted.'));

        const strategy = this.mode === 'live'
            ? await this.runFounderStrategistAgent(founderContext, analysis, sources)
            : this.runDemoStrategistAgent(founderContext, analysis, sources);
        agentLogs.push(log('strategy', 'Founder Strategist Agent', 'Founder-specific strategy and positioning generated.'));

        const executionPlan = this.mode === 'live'
            ? await this.runLiveExecutionCoachAgent(founderContext, strategy, analysis)
            : this.runDemoExecutionCoachAgent(founderContext, strategy, analysis);
        agentLogs.push(log('coach', 'Execution Coach Agent', '7-day sprint, 30-day roadmap, and validation checklist created.'));

        const report = this.composeReport({
            founderContext,
            searchPlan,
            searchResults,
            sources,
            analysis,
            strategy,
            executionPlan
        });
        agentLogs.push(log('composer', 'Report Composer Agent', 'Founder report assembled with citations and next steps.'));

        return {
            ...report,
            agentLogs,
            mode: this.mode,
            intelligenceMode: this.searchProvider.enabled ? 'live_web' : 'demo_grounding',
            model: this.modelName
        };
    }

    async processInquiryStream(userQuery, options = {}, onUpdate = () => {}) {
        const agentLogs = [];
        const founderProfile = options.founderProfile;
        const reportOptions = options.reportOptions;

        // Step 1: Founder Context
        const founderContext = this.runFounderContextAgent(founderProfile, reportOptions, userQuery);
        const log1 = log('founder', 'Founder Context Agent', 'Founder profile, constraints, and decision context mapped.');
        agentLogs.push(log1);
        onUpdate({ event: 'log', data: log1 });

        // Step 2: Query Planner
        const searchPlan = this.mode === 'live'
            ? await this.runLiveQueryPlannerAgent(founderContext)
            : this.runQueryPlannerAgent(founderContext);
        const log2 = log('research', 'Live Research Agent', `Prepared ${searchPlan.queries.length} real-time intelligence queries.`);
        agentLogs.push(log2);
        onUpdate({ event: 'log', data: log2 });

        // Step 3: Live Research & rank sources
        const searchResults = await this.runLiveResearchAgent(searchPlan);
        const sources = rankAndDedupeSources(searchResults, options.sources || []);
        const log3 = log('research', 'Live Research Agent', `${sources.length} sources ranked and deduplicated.`);
        agentLogs.push(log3);
        onUpdate({ event: 'log', data: log3 });
        onUpdate({ event: 'sources', data: sources });

        // Step 4: Analyst
        const analysis = this.mode === 'live'
            ? await this.runLiveMarketAnalystAgent(founderContext, sources, searchResults)
            : this.runDemoMarketAnalystAgent(founderContext, sources, searchResults);
        const log4 = log('analyst', 'Market Analyst Agent', 'Market signals, risks, and opportunity gaps extracted.');
        agentLogs.push(log4);
        onUpdate({ event: 'log', data: log4 });
        onUpdate({ event: 'analysis', data: analysis });

        // Step 5: Strategy
        const strategy = this.mode === 'live'
            ? await this.runFounderStrategistAgent(founderContext, analysis, sources)
            : this.runDemoStrategistAgent(founderContext, analysis, sources);
        const log5 = log('strategy', 'Founder Strategist Agent', 'Founder-specific strategy and positioning generated.');
        agentLogs.push(log5);
        onUpdate({ event: 'log', data: log5 });
        onUpdate({ event: 'strategy', data: strategy });

        // Step 6: Coach
        const executionPlan = this.mode === 'live'
            ? await this.runLiveExecutionCoachAgent(founderContext, strategy, analysis)
            : this.runDemoExecutionCoachAgent(founderContext, strategy, analysis);
        const log6 = log('coach', 'Execution Coach Agent', '7-day sprint, 30-day roadmap, and validation checklist created.');
        agentLogs.push(log6);
        onUpdate({ event: 'log', data: log6 });
        onUpdate({ event: 'executionPlan', data: executionPlan });

        // Step 7: Compose Report
        const report = this.composeReport({
            founderContext,
            searchPlan,
            searchResults,
            sources,
            analysis,
            strategy,
            executionPlan
        });
        const log7 = log('composer', 'Report Composer Agent', 'Founder report assembled with citations and next steps.');
        agentLogs.push(log7);
        onUpdate({ event: 'log', data: log7 });

        const finalReport = {
            ...report,
            agentLogs,
            mode: this.mode,
            intelligenceMode: this.searchProvider.enabled ? 'live_web' : 'demo_grounding',
            model: this.modelName
        };
        onUpdate({ event: 'result', data: finalReport });
        return finalReport;
    }

    // ── Agent 1: Founder Context (sync, always runs) ─────────────────────

    runFounderContextAgent(profile, reportOptions, query) {
        return {
            founderSummary: summarizeFounder(profile),
            profile,
            reportOptions,
            userProblem: query,
            decisionFrame: inferDecisionFrame(reportOptions.reportType),
            constraints: [profile.budget, profile.teamSize, profile.timeline].filter(Boolean),
            strategicQuestion: `${query} For a ${summarizeFounder(profile)}.`
        };
    }

    async runLiveQueryPlannerAgent(context) {
        const prompt = `${RESEARCHER_PROMPT}

You are NeuralBI's Discovery & Research Specialist Agent. Generate 4 search queries to find real-time market signals (funding, regulation, competitor moves, customer trends) for the founder context below.

Founder context:
${JSON.stringify(context, null, 2)}

Your output must be a valid JSON array of exactly 4 strings representing search queries, and NOTHING else. Do not enclose it in markdown blocks (like \`\`\`json ... \`\`\`).
`;
        try {
            const result = await this.model.generateContent(prompt);
            let text = result.response.text();
            text = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
            const queries = JSON.parse(text);
            if (Array.isArray(queries) && queries.length > 0) {
                return {
                    intent: context.reportOptions.reportType.replace(/_/g, ' '),
                    queries: queries.slice(0, 4),
                    timeRange: context.reportOptions.timeHorizon === '7_days' ? 'week' : 'month'
                };
            }
        } catch (error) {
            console.warn('Live query planner failed, falling back to static queries:', error.message);
        }
        return this.runQueryPlannerAgent(context);
    }

    runQueryPlannerAgent(context) {
        const { profile, reportOptions, userProblem } = context;
        const base = `${profile.industry} ${profile.geography} ${profile.product} ${profile.targetCustomer}`;
        const reportLabel = reportOptions.reportType.replace(/_/g, ' ');

        return {
            intent: reportLabel,
            queries: [
                `${base} latest market news startup funding product launches`,
                `${base} competitors pricing customer pain points`,
                `${base} regulation trends adoption ${reportLabel}`,
                `${userProblem} ${profile.industry} founders startup strategy`
            ],
            timeRange: reportOptions.timeHorizon === '7_days' ? 'week' : 'month'
        };
    }

    // ── Agent 3: Live Research (async, Tavily) ───────────────────────────

    async runLiveResearchAgent(plan) {
        const searches = plan.queries.slice(0, 4).map((query, index) => this.searchProvider.search(query, {
            topic: index === 0 ? 'news' : 'general',
            timeRange: plan.timeRange,
            maxResults: 4
        }).catch((error) => ({
            provider: this.searchProvider.name,
            query,
            answer: '',
            error: error.message,
            results: []
        })));

        return Promise.all(searches);
    }

    // ── Agent 4: Market Analyst ──────────────────────────────────────────

    async runLiveMarketAnalystAgent(context, sources, searchResults) {
        const numberedSources = numberSources(sources);
        const prompt = `${ANALYST_PROMPT}\n\n` + ANALYST_STRUCTURED_PROMPT
            .replace('{founderContext}', JSON.stringify(context, null, 2))
            .replace('{searchResults}', JSON.stringify(searchResults.map(simplifySearchResult), null, 2))
            .replace('{numberedSources}', numberedSources)
            .replace('{founderType}', context.profile.founderType)
            .replace('{startupStage}', context.profile.startupStage)
            .replace('{geography}', context.profile.geography);

        try {
            const result = await this.model.generateContent(prompt);
            const text = result.response.text();

            return {
                marketSignals: extractList(text, 'MARKET_SIGNALS', []),
                opportunityGaps: extractList(text, 'OPPORTUNITY_GAPS', []),
                risks: extractList(text, 'RISKS', this.buildDemoRisks(context)),
                assumptions: extractList(text, 'ASSUMPTIONS', this.buildDemoAssumptions(context)),
                raw: text
            };
        } catch (error) {
            console.warn('Live analyst agent failed, falling back to demo:', error.message);
            return this.runDemoMarketAnalystAgent(context, sources, searchResults);
        }
    }

    runDemoMarketAnalystAgent(context, sources, searchResults) {
        const sourceSignals = sources.slice(0, 6).map((source) => source.summary).filter(Boolean);
        const providerAnswers = searchResults.map((result) => result.answer).filter(Boolean);

        return {
            marketSignals: unique([
                ...providerAnswers.slice(0, 2),
                ...sourceSignals.slice(0, 4)
            ].filter(Boolean)),
            opportunityGaps: [
                `Narrow the wedge around ${context.profile.targetCustomer} instead of attacking the whole ${context.profile.industry} market.`,
                `Use ${context.profile.geography} as the first validation geography before expanding.`,
                `Turn current founder constraints (${context.constraints.join(', ') || 'limited resources'}) into positioning: speed, focus, and direct customer access.`
            ],
            risks: this.buildDemoRisks(context),
            assumptions: this.buildDemoAssumptions(context),
            raw: ''
        };
    }

    buildDemoRisks(context) {
        return [
            `Weak source coverage can make market timing for ${context.profile.industry} look clearer than it is.`,
            `Competitors targeting ${context.profile.targetCustomer} with distribution can copy generic features quickly.`,
            `Founder time can be wasted if validation of ${context.profile.product} is not tied to paid intent.`
        ];
    }

    buildDemoAssumptions(context) {
        return [
            `The founder can interview ${context.profile.targetCustomer} within the next 7 days.`,
            `The first MVP of ${context.profile.product} should stay narrow enough to validate manually.`,
            `Any numerical market claim about ${context.profile.industry} must be confirmed before fundraising.`
        ];
    }

    // ── Agent 5: Founder Strategist ──────────────────────────────────────

    async runFounderStrategistAgent(context, analysis, sources) {
        const reportType = context.reportOptions.reportType;
        const typeInstructions = REPORT_TYPE_INSTRUCTIONS[reportType] || REPORT_TYPE_INSTRUCTIONS.idea_validation;
        const prompt = buildStrategyPrompt(context, analysis, sources, typeInstructions);

        try {
            const result = await this.model.generateContent(prompt);
            const text = result.response.text();

            return parseStrategyResponse(text, context, reportType);
        } catch (error) {
            console.warn('Live strategist agent failed, falling back to demo:', error.message);
            return this.runDemoStrategistAgent(context, analysis, sources);
        }
    }

    runDemoStrategistAgent(context, analysis) {
        const reportType = context.reportOptions.reportType;
        const base = {
            thesis: `${context.profile.product} should be treated as a focused validation bet for ${context.profile.targetCustomer} in ${context.profile.geography}, not a broad market-entry play yet.`,
            positioning: `Position as a founder-led solution for one urgent ${context.profile.industry} workflow where speed, clarity, or cost reduction matters now.`,
            recommendations: [
                `Interview 10 ${context.profile.targetCustomer} before expanding MVP scope.`,
                `Build a concierge or lightweight MVP of ${context.profile.product} that proves willingness to pay.`,
                'Track one activation metric, one revenue signal, and one repeat-use signal.',
                'Use live web intelligence once TAVILY_API_KEY is configured to keep reports current.'
            ],
            raw: ''
        };

        // Add report-type-specific demo fields
        const extras = buildDemoStrategyExtras(context, reportType, analysis);
        return { ...base, ...extras };
    }

    // ── Agent 6: Execution Coach ─────────────────────────────────────────

    async runLiveExecutionCoachAgent(context, strategy, analysis) {
        const prompt = EXECUTION_COACH_PROMPT
            .replace('{founderContext}', JSON.stringify(context, null, 2))
            .replace('{strategy}', JSON.stringify(strategy, null, 2))
            .replace('{analysis}', JSON.stringify({ risks: analysis.risks, opportunityGaps: analysis.opportunityGaps }, null, 2))
            .replace('{reportType}', context.reportOptions.reportType.replace(/_/g, ' '))
            .replace('{timeHorizon}', context.reportOptions.timeHorizon.replace(/_/g, ' '))
            .replace('{product}', context.profile.product)
            .replace('{targetCustomer}', context.profile.targetCustomer)
            .replace('{industry}', context.profile.industry)
            .replace('{geography}', context.profile.geography)
            .replace('{founderType}', context.profile.founderType)
            .replace('{startupStage}', context.profile.startupStage)
            .replace('{teamSize}', context.profile.teamSize || 'small team')
            .replace('{budget}', context.profile.budget || 'constrained')
            .replace('{timeline}', context.profile.timeline || '30 days');

        try {
            const result = await this.model.generateContent(prompt);
            const text = result.response.text();

            return {
                sevenDaySprint: extractList(text, 'SEVEN_DAY_SPRINT', this.buildDemoSprint(context)),
                thirtyDayRoadmap: extractList(text, 'THIRTY_DAY_ROADMAP', this.buildDemoRoadmap(context)),
                validationChecklist: extractList(text, 'VALIDATION_CHECKLIST', this.buildDemoChecklist(context)),
                nextAssets: extractList(text, 'NEXT_ASSETS', this.buildDemoAssets(context)),
                strategySummary: strategy.thesis,
                keyRisks: analysis.risks
            };
        } catch (error) {
            console.warn('Live execution coach failed, falling back to demo:', error.message);
            return this.runDemoExecutionCoachAgent(context, strategy, analysis);
        }
    }

    runDemoExecutionCoachAgent(context, strategy, analysis) {
        return {
            sevenDaySprint: this.buildDemoSprint(context),
            thirtyDayRoadmap: this.buildDemoRoadmap(context),
            validationChecklist: this.buildDemoChecklist(context),
            nextAssets: this.buildDemoAssets(context),
            strategySummary: strategy.thesis,
            keyRisks: analysis.risks
        };
    }

    buildDemoSprint(context) {
        const p = context.profile;
        return [
            `Day 1: Write a one-page problem brief for ${p.targetCustomer} in ${p.geography} — define the core pain, current workaround, and urgency.`,
            `Day 2: Build a list of 25 reachable ${p.targetCustomer} and 10 competitor/reference products in ${p.industry}.`,
            `Day 3: Conduct 3 discovery calls with ${p.targetCustomer}; ask for current workaround, cost, urgency, and buying owner.`,
            `Day 4: Draft a landing page or demo script for ${p.product} using the positioning thesis.`,
            `Day 5: Test willingness to pay with 5 ${p.targetCustomer} or pilot commitments.`,
            `Day 6: Scope the smallest MVP of ${p.product} that proves the core workflow for ${p.targetCustomer}.`,
            'Day 7: Review evidence and decide: build, narrow, pivot, or pause.'
        ];
    }

    buildDemoRoadmap(context) {
        const p = context.profile;
        return [
            `Week 1: Validate problem urgency and buyer profile among ${p.targetCustomer} in ${p.geography}.`,
            `Week 2: Build concierge MVP or clickable prototype of ${p.product}.`,
            `Week 3: Run pilots with 3-5 ${p.targetCustomer} and measure repeat usage.`,
            `Week 4: Package learnings into ${p.currentGoal === 'prepare investor memo' ? 'investor narrative' : 'customer narrative'} and next build plan.`
        ];
    }

    buildDemoChecklist(context) {
        const p = context.profile;
        return [
            `Can ${p.targetCustomer} describe the problem ${p.product} solves without prompting?`,
            `Do ${p.targetCustomer} already spend time or money solving this in ${p.industry}?`,
            `Is there a specific trigger event that makes ${p.targetCustomer} buy now?`,
            `Can the first version be delivered by the current team (${p.teamSize || 'small team'})?`,
            `Does the wedge for ${p.product} avoid direct feature-by-feature competition?`
        ];
    }

    buildDemoAssets(context) {
        const p = context.profile;
        return [
            `Customer interview script for ${p.targetCustomer}`,
            `One-page market memo for ${p.industry} in ${p.geography}`,
            `Landing page positioning for ${p.product}`,
            'MVP scope document',
            `Pilot offer for ${p.targetCustomer}`
        ];
    }

    // ── Report Composer ──────────────────────────────────────────────────

    composeReport(parts) {
        const id = crypto.randomUUID();
        const generatedAt = new Date().toISOString();
        const reportType = parts.founderContext.reportOptions.reportType;
        const title = `${titleCase(reportType)} for ${parts.founderContext.profile.product}`;

        const sections = buildSections(parts, reportType);
        const sectionOrder = REPORT_SECTION_MAP[reportType] || REPORT_SECTION_MAP.idea_validation;

        return {
            id,
            title,
            generatedAt,
            founderContext: parts.founderContext,
            searchPlan: parts.searchPlan,
            sections,
            sectionOrder,
            sources: parts.sources,
            markdown: toMarkdown(title, generatedAt, sections, sectionOrder, parts.sources)
        };
    }

    async processSignals(founderProfile) {
        const profile = founderProfile || {};
        const industry = profile.industry || 'technology';
        const geography = profile.geography || 'global';
        const targetCustomer = profile.targetCustomer || 'businesses';

        const query = `latest startup news funding product launches trends in ${industry} ${geography}`;
        let searchResults = [];
        try {
            const rawResults = await this.searchProvider.search(query, {
                topic: 'news',
                timeRange: 'month',
                maxResults: 6
            });
            searchResults = [rawResults];
        } catch (error) {
            console.warn('Search for signals failed:', error.message);
            searchResults = [createDemoSearchResult(query)];
        }

        const sources = rankAndDedupeSources(searchResults, []);

        if (this.mode === 'live') {
            const numberedSources = numberSources(sources);
            const prompt = MARKET_SIGNALS_PROMPT
                .replace('{geography}', geography)
                .replace('{industry}', industry)
                .replace('{targetCustomer}', targetCustomer)
                .replace('{searchResults}', JSON.stringify(searchResults.map(simplifySearchResult), null, 2))
                .replace('{numberedSources}', numberedSources);

            try {
                const result = await this.model.generateContent(prompt);
                let text = result.response.text();
                text = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
                const signals = JSON.parse(text);
                if (Array.isArray(signals)) {
                    return {
                        signals: signals.map(sig => ({
                            ...sig,
                            source: sig.sourceIndex && sources[sig.sourceIndex - 1] ? {
                                title: sources[sig.sourceIndex - 1].title,
                                url: sources[sig.sourceIndex - 1].url
                            } : null
                        })),
                        mode: 'live'
                    };
                }
            } catch (error) {
                console.warn('Live signals parsing failed, falling back to demo signals:', error.message);
            }
        }

        return {
            signals: this.buildDemoSignals(profile),
            mode: 'demo'
        };
    }

    buildDemoSignals(profile) {
        const industry = profile.industry || 'technology';
        const geography = profile.geography || 'global';
        const targetCustomer = profile.targetCustomer || 'users';
        const product = profile.product || 'software solution';

        return [
            {
                type: 'FUNDING ROUND',
                title: `Leading competitor in ${industry} raises $12M to expand automation`,
                description: `A competitor closed a Series A round. Indicates strong investor appetite in ${industry} but increases competitive pressure in ${geography}.`,
                impact: 'High',
                sentiment: 'Negative',
                source: { title: 'Crunchbase News', url: 'https://crunchbase.com' }
            },
            {
                type: 'REGULATION CHANGE',
                title: `New compliance standard announced for ${industry} in ${geography}`,
                description: `Regulators are tightening rules starting next quarter. Startups building ${product} must adapt architectures early to avoid audit delays.`,
                impact: 'High',
                sentiment: 'Neutral',
                source: { title: 'Regulatory Oversight Journal', url: '' }
            },
            {
                type: 'CUSTOMER TREND',
                title: `Adoption of AI-first workflows among ${targetCustomer} grew by 45%`,
                description: `Recent survey shows rising willingness to adopt tools similar to ${product} among ${targetCustomer}. Customer discovery should focus on workflow integration rather than basic features.`,
                impact: 'High',
                sentiment: 'Positive',
                source: { title: 'Industry Intelligence Report', url: 'https://example.com/trends' }
            },
            {
                type: 'TECH SHIFT',
                title: 'Open-source foundational models reduce operational costs by 30%',
                description: `New model releases make building ${product} significantly cheaper, enabling bootstrapped projects to run at scale with lower infrastructure costs.`,
                impact: 'Medium',
                sentiment: 'Positive',
                source: { title: 'AI Research Weekly', url: '' }
            }
        ];
    }
}

// ── Section Builder ──────────────────────────────────────────────────────

function normalizeActionPlan(actionPlan) {
    if (!actionPlan || typeof actionPlan !== 'object') return {};
    const keys = ['sevenDaySprint', 'thirtyDayRoadmap', 'validationChecklist', 'nextAssets'];
    const result = {};
    for (const key of keys) {
        const list = actionPlan[key] || [];
        result[key] = list.map((item, idx) => {
            if (item && typeof item === 'object') {
                return {
                    id: item.id || `${key}-${idx}`,
                    text: item.text || '',
                    completed: Boolean(item.completed)
                };
            }
            return {
                id: `${key}-${idx}`,
                text: String(item),
                completed: false
            };
        });
    }
    return result;
}

function buildSections(parts, reportType) {
    const base = {
        executiveSnapshot: parts.strategy.thesis,
        founderContext: parts.founderContext.founderSummary,
        marketSignals: parts.analysis.marketSignals,
        opportunityThesis: parts.strategy.positioning,
        recommendations: parts.strategy.recommendations,
        risks: parts.analysis.risks,
        assumptions: parts.analysis.assumptions,
        actionPlan: normalizeActionPlan(parts.executionPlan)
    };

    // Report-type-specific sections from strategy
    const extras = {};
    const strategyFields = [
        'trendAnalysis', 'competitivePositioning', 'targetSegment',
        'channelStrategy', 'marketOpportunity', 'tractionEvidence',
        'askAndUse', 'threatCategories', 'mitigationPlan'
    ];

    for (const field of strategyFields) {
        if (parts.strategy[field]) {
            extras[field] = parts.strategy[field];
        }
        if (parts.analysis[field]) {
            extras[field] = parts.analysis[field];
        }
    }

    return { ...base, ...extras };
}

// ── Helpers ──────────────────────────────────────────────────────────────

function log(id, agent, message) {
    return { id, agent, message, at: new Date().toISOString() };
}

function inferDecisionFrame(reportType) {
    return {
        market_pulse: 'Understand what changed and whether timing is improving.',
        idea_validation: 'Decide whether to validate, build, narrow, pivot, or pause.',
        competitor_brief: 'Find competitor moves and defensible positioning.',
        gtm_strategy: 'Choose the first customer segment, channel, and offer.',
        investor_memo: 'Turn evidence into a fundable narrative.',
        risk_radar: 'Identify threats before committing capital or time.',
        execution_plan: 'Convert strategy into near-term operating steps.'
    }[reportType] || 'Make a founder decision with current evidence.';
}

function numberSources(sources) {
    if (!sources.length) return 'No external sources available.';
    return sources.slice(0, 8).map((source, index) =>
        `[Source ${index + 1}] ${source.title}${source.url ? ` (${source.url})` : ''} — ${source.summary}`
    ).join('\n');
}

function simplifySearchResult(result) {
    return {
        query: result.query,
        answer: result.answer || '',
        resultCount: (result.results || []).length,
        topResults: (result.results || []).slice(0, 3).map((r) => ({
            title: r.title,
            summary: r.summary
        }))
    };
}

function buildStrategyPrompt(context, analysis, sources, typeInstructions) {
    const numberedSources = numberSources(sources);

    return `${STRATEGIST_PROMPT}

You are NeuralBI's Founder Strategist Agent. Create concise, practical startup strategy for the founder below.

Founder context:
${JSON.stringify(context, null, 2)}

Market analysis:
${JSON.stringify(analysis, null, 2)}

Ranked sources (numbered for citation):
${numberedSources}

REPORT TYPE INSTRUCTIONS:
${typeInstructions}

General rules:
- Give advice personalized to the founder type, stage, constraints, geography, and target customer.
- Reference sources by number when a claim is supported, e.g., "Growing demand in logistics [Source 2]."
- Mention uncertainty when sources are weak or missing.
- Do not invent exact market numbers.
- Make recommendations actionable for a startup founder.`;
}

function parseStrategyResponse(text, context, reportType) {
    const base = {
        thesis: extractSection(text, 'THESIS') || text.slice(0, 700),
        positioning: extractSection(text, 'POSITIONING') || `Position around a focused ${context.profile.targetCustomer} pain point.`,
        recommendations: extractList(text, 'RECOMMENDATIONS', [
            'Validate the highest-risk assumption before building more product.',
            'Choose one narrow customer segment and one measurable pain.',
            'Create a founder-led sales motion before scaling acquisition.'
        ]),
        raw: text
    };

    // Extract report-type-specific sections
    const typeExtractors = {
        market_pulse: { trendAnalysis: 'TREND_ANALYSIS' },
        competitor_brief: { competitivePositioning: 'COMPETITIVE_POSITIONING' },
        gtm_strategy: { targetSegment: 'TARGET_SEGMENT', channelStrategy: 'CHANNEL_STRATEGY' },
        investor_memo: {
            marketOpportunity: 'MARKET_OPPORTUNITY',
            tractionEvidence: 'TRACTION_EVIDENCE',
            competitivePositioning: 'COMPETITIVE_POSITIONING',
            askAndUse: 'ASK_AND_USE'
        },
        risk_radar: { threatCategories: 'THREAT_CATEGORIES', mitigationPlan: 'MITIGATION_PLAN' }
    };

    const extractors = typeExtractors[reportType] || {};
    for (const [field, label] of Object.entries(extractors)) {
        const extracted = extractSection(text, label);
        if (extracted) {
            base[field] = extracted;
        }
    }

    return base;
}

function buildDemoStrategyExtras(context, reportType, analysis) {
    const p = context.profile;
    const extras = {};

    switch (reportType) {
        case 'market_pulse':
            extras.trendAnalysis = `The ${p.industry} market in ${p.geography} is evolving. Monitor adoption velocity among ${p.targetCustomer}, competitive launches, and regulatory signals. Current source coverage is limited — treat timing assumptions as unvalidated until confirmed with live intelligence (configure TAVILY_API_KEY).`;
            break;

        case 'competitor_brief':
            extras.competitivePositioning = `${p.product} can differentiate by focusing narrowly on ${p.targetCustomer} pain points that generalist competitors ignore. The defensible wedge is speed-to-value for a specific ${p.industry} workflow in ${p.geography}. Map 5-10 competitors by positioning and identify the underserved niche.`;
            break;

        case 'gtm_strategy':
            extras.targetSegment = `Start with ${p.targetCustomer} in ${p.geography} who have the most acute version of the problem. Look for trigger events (budget cycles, regulation changes, team growth) that create buying urgency.`;
            extras.channelStrategy = `For a ${p.founderType} founder at ${p.startupStage} stage: prioritize founder-led outbound (LinkedIn, warm intros, community posts) over paid acquisition. Build 3 repeatable touchpoints before investing in scalable channels.`;
            break;

        case 'investor_memo':
            extras.marketOpportunity = `The ${p.industry} market in ${p.geography} presents an opportunity for ${p.product}. Quantify TAM/SAM/SOM with validated data before including in investor materials. Current source coverage is insufficient for credible market sizing.`;
            extras.tractionEvidence = `At ${p.startupStage} stage, focus on qualitative traction: customer interview insights, pilot commitments, waitlist signups, and repeat usage signals. Convert these into a narrative arc showing problem-solution fit.`;
            extras.competitivePositioning = `Frame ${p.product} as the focused alternative to broad-market solutions. Emphasize founder-market fit and the narrow wedge that incumbents are too large to serve well.`;
            extras.askAndUse = `Frame the ask around the specific milestone: validate ${p.currentGoal}. Allocate capital to customer acquisition experiments, product iteration, and founder runway. Avoid allocating to overhead before product-market fit signals are clear.`;
            break;

        case 'risk_radar':
            extras.threatCategories = `Market Risk: ${p.industry} timing and adoption velocity are uncertain. Execution Risk: ${p.teamSize || 'small team'} capacity constrains iteration speed. Competitive Risk: well-funded competitors targeting ${p.targetCustomer}. Regulatory Risk: monitor ${p.geography}-specific compliance requirements. Financial Risk: ${p.budget || 'constrained budget'} limits runway for pivots.`;
            extras.mitigationPlan = `Top 3 mitigations: (1) Validate demand with paid pilots before building features. (2) Keep MVP scope narrow enough for ${p.teamSize || 'the current team'} to ship in ${p.timeline || '30 days'}. (3) Build relationships with 3-5 ${p.targetCustomer} who will provide honest feedback.`;
            break;

        default:
            break;
    }

    return extras;
}

function extractSection(text, label) {
    const pattern = new RegExp(`${label}:\\s*([\\s\\S]*?)(?=\\n[A-Z][A-Z_ ]+:|$)`, 'i');
    const match = text.match(pattern);
    return match ? match[1].trim() : '';
}

function extractList(text, label, fallback) {
    const section = extractSection(text, label);
    const items = section.split('\n')
        .map((line) => line.replace(/^[-*]\s*/, '').trim())
        .filter(Boolean);
    return items.length ? items : fallback;
}

function titleCase(value) {
    return String(value || '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function toMarkdown(title, generatedAt, sections, sectionOrder, sources) {
    const lines = [`# ${title}`, '', `Generated: ${generatedAt}`, ''];

    for (const key of sectionOrder) {
        if (key === 'sources') continue;
        const sectionTitle = SECTION_TITLES[key] || titleCase(key);
        const content = sections[key];

        if (content == null) continue;

        lines.push(`## ${sectionTitle}`);

        if (key === 'actionPlan' && typeof content === 'object') {
            if (content.sevenDaySprint) {
                lines.push('### 7-Day Sprint');
                lines.push(list(content.sevenDaySprint));
                lines.push('');
            }
            if (content.thirtyDayRoadmap) {
                lines.push('### 30-Day Roadmap');
                lines.push(list(content.thirtyDayRoadmap));
                lines.push('');
            }
            if (content.validationChecklist) {
                lines.push('### Validation Checklist');
                lines.push(list(content.validationChecklist));
                lines.push('');
            }
            if (content.nextAssets) {
                lines.push('### Next Assets');
                lines.push(list(content.nextAssets));
                lines.push('');
            }
        } else if (Array.isArray(content)) {
            lines.push(list(content));
        } else {
            lines.push(String(content));
        }

        lines.push('');
    }

    if (sectionOrder.includes('sources')) {
        lines.push('## Sources');
        lines.push(sources.length
            ? sources.map((source, index) =>
                `${index + 1}. ${source.url ? `[${source.title}](${source.url})` : source.title} — ${source.summary}`
            ).join('\n')
            : 'No external sources available.');
    }

    return lines.join('\n');
}

function list(items = []) {
    if (!items.length) return '- No strong signal found yet.';
    return items.map((item) => {
        if (item && typeof item === 'object') {
            const check = item.completed ? '[x]' : '[ ]';
            return `- ${check} ${item.text}`;
        }
        return `- ${item}`;
    }).join('\n');
}

function unique(items) {
    return [...new Set(items.map((item) => String(item).trim()).filter(Boolean))];
}

module.exports = { GeminiBIOrchestrator, toMarkdown };
