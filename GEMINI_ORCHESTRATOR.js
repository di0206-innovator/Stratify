const crypto = require('crypto');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { TavilySearchProvider } = require('./lib/intelligence/searchProvider');
const { rankAndDedupeSources } = require('./lib/intelligence/sourceRanker');
const { summarizeFounder } = require('./lib/founderProfile');
require('dotenv').config();

class GeminiBIOrchestrator {
    constructor(options = {}) {
        const apiKey = options.apiKey || process.env.GEMINI_API_KEY || '';
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

        const searchPlan = this.runQueryPlannerAgent(founderContext);
        agentLogs.push(log('research', 'Live Research Agent', `Prepared ${searchPlan.queries.length} real-time intelligence queries.`));

        const searchResults = await this.runLiveResearchAgent(searchPlan);
        const sources = rankAndDedupeSources(searchResults, options.sources || []);
        agentLogs.push(log('research', 'Live Research Agent', `${sources.length} sources ranked and deduplicated.`));

        const analysis = this.runMarketAnalystAgent(founderContext, sources, searchResults);
        agentLogs.push(log('analyst', 'Market Analyst Agent', 'Market signals, risks, and opportunity gaps extracted.'));

        const strategy = this.mode === 'live'
            ? await this.runFounderStrategistAgent(founderContext, analysis, sources)
            : this.runDemoStrategistAgent(founderContext, analysis, sources);
        agentLogs.push(log('strategy', 'Founder Strategist Agent', 'Founder-specific strategy and positioning generated.'));

        const executionPlan = this.runExecutionCoachAgent(founderContext, strategy, analysis);
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

    runMarketAnalystAgent(context, sources, searchResults) {
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
                `Turn current founder constraints into positioning: speed, focus, and direct customer access.`
            ],
            risks: [
                'Weak source coverage can make market timing look clearer than it is.',
                'Competitors with distribution can copy generic AI features quickly.',
                'Founder time can be wasted if validation is not tied to paid intent.'
            ],
            assumptions: [
                'The founder can interview target customers within the next 7 days.',
                'The first MVP should stay narrow enough to validate manually or semi-manually.',
                'Any numerical market claim must be confirmed before fundraising or major spend.'
            ]
        };
    }

    async runFounderStrategistAgent(context, analysis, sources) {
        const prompt = buildStrategyPrompt(context, analysis, sources);
        const result = await this.model.generateContent(prompt);
        const text = result.response.text();

        return {
            thesis: extractSection(text, 'THESIS') || text.slice(0, 700),
            positioning: extractSection(text, 'POSITIONING') || `Position around a focused ${context.profile.targetCustomer} pain point.`,
            recommendations: extractList(text, 'RECOMMENDATIONS', [
                'Validate the highest-risk assumption before building more product.',
                'Choose one narrow customer segment and one measurable pain.',
                'Create a founder-led sales motion before scaling acquisition.'
            ]),
            raw: text
        };
    }

    runDemoStrategistAgent(context, analysis) {
        return {
            thesis: `${context.profile.product} should be treated as a focused validation bet for ${context.profile.targetCustomer} in ${context.profile.geography}, not a broad market-entry play yet.`,
            positioning: `Position as a founder-led solution for one urgent ${context.profile.industry} workflow where speed, clarity, or cost reduction matters now.`,
            recommendations: [
                'Interview 10 target customers before expanding MVP scope.',
                'Build a concierge or lightweight MVP that proves willingness to pay.',
                'Track one activation metric, one revenue signal, and one repeat-use signal.',
                'Use live web intelligence once TAVILY_API_KEY is configured to keep reports current.'
            ],
            raw: ''
        };
    }

    runExecutionCoachAgent(context, strategy, analysis) {
        return {
            sevenDaySprint: [
                `Day 1: Write a one-page problem brief for ${context.profile.targetCustomer}.`,
                'Day 2: Build a list of 25 reachable prospects and 10 competitor/reference products.',
                'Day 3: Conduct 3 customer discovery calls; ask for current workaround, cost, urgency, and buying owner.',
                'Day 4: Draft a landing page or demo script with the positioning thesis.',
                'Day 5: Test willingness to pay with 5 prospects or pilot commitments.',
                'Day 6: Scope the smallest MVP that proves the core workflow.',
                'Day 7: Review evidence and decide: build, narrow, pivot, or pause.'
            ],
            thirtyDayRoadmap: [
                'Week 1: Validate problem urgency and buyer profile.',
                'Week 2: Build concierge MVP or clickable prototype.',
                'Week 3: Run pilots with 3-5 users and measure repeat usage.',
                'Week 4: Package learnings into investor/customer narrative and next build plan.'
            ],
            validationChecklist: [
                'Can target customers describe the problem without prompting?',
                'Do they already spend time or money solving it?',
                'Is there a specific trigger event that makes them buy now?',
                'Can the first version be delivered by the current team?',
                'Does the wedge avoid direct feature-by-feature competition?'
            ],
            nextAssets: [
                'Customer interview script',
                'One-page market memo',
                'Landing page positioning',
                'MVP scope document',
                'Pilot offer'
            ],
            strategySummary: strategy.thesis,
            keyRisks: analysis.risks
        };
    }

    composeReport(parts) {
        const id = crypto.randomUUID();
        const generatedAt = new Date().toISOString();
        const title = `${titleCase(parts.founderContext.reportOptions.reportType)} for ${parts.founderContext.profile.product}`;

        const sections = {
            executiveSnapshot: parts.strategy.thesis,
            founderContext: parts.founderContext.founderSummary,
            marketSignals: parts.analysis.marketSignals,
            opportunityThesis: parts.strategy.positioning,
            recommendations: parts.strategy.recommendations,
            risks: parts.analysis.risks,
            assumptions: parts.analysis.assumptions,
            actionPlan: parts.executionPlan
        };

        return {
            id,
            title,
            generatedAt,
            founderContext: parts.founderContext,
            searchPlan: parts.searchPlan,
            sections,
            sources: parts.sources,
            markdown: toMarkdown(title, generatedAt, sections, parts.sources)
        };
    }
}

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

function buildStrategyPrompt(context, analysis, sources) {
    return `You are NeuralBI's Founder Strategist Agent. Create concise, practical startup strategy for the founder below.

Founder context:
${JSON.stringify(context, null, 2)}

Market analysis:
${JSON.stringify(analysis, null, 2)}

Ranked sources:
${JSON.stringify(sources.slice(0, 8), null, 2)}

Return sections with these exact labels:
THESIS:
POSITIONING:
RECOMMENDATIONS:
- recommendation 1
- recommendation 2
- recommendation 3

Rules:
- Give advice personalized to the founder type, stage, constraints, geography, and target customer.
- Mention uncertainty when sources are weak.
- Do not invent exact market numbers.
- Make recommendations actionable for a startup founder.`;
}

function extractSection(text, label) {
    const pattern = new RegExp(`${label}:\\s*([\\s\\S]*?)(?=\\n[A-Z ]+:|$)`, 'i');
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

function toMarkdown(title, generatedAt, sections, sources) {
    return `# ${title}

Generated: ${generatedAt}

## Executive Snapshot
${sections.executiveSnapshot}

## Founder Context
${sections.founderContext}

## Real-Time Market Signals
${list(sections.marketSignals)}

## Opportunity Thesis
${sections.opportunityThesis}

## Recommendations
${list(sections.recommendations)}

## Risks
${list(sections.risks)}

## Assumptions
${list(sections.assumptions)}

## 7-Day Sprint
${list(sections.actionPlan.sevenDaySprint)}

## 30-Day Roadmap
${list(sections.actionPlan.thirtyDayRoadmap)}

## Validation Checklist
${list(sections.actionPlan.validationChecklist)}

## Sources
${sources.length ? sources.map((source, index) => `${index + 1}. ${source.url ? `[${source.title}](${source.url})` : source.title} - ${source.summary}`).join('\n') : 'No external sources available.'}`;
}

function list(items = []) {
    return items.length ? items.map((item) => `- ${item}`).join('\n') : '- No strong signal found yet.';
}

function unique(items) {
    return [...new Set(items.map((item) => String(item).trim()).filter(Boolean))];
}

module.exports = { GeminiBIOrchestrator };
