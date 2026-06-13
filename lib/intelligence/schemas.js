const queryPlannerSchema = {
    type: "array",
    description: "Exactly 4 search queries targeting real-time market signals.",
    items: {
        type: "string"
    }
};

const marketAnalystSchema = {
    type: "object",
    properties: {
        marketSignals: {
            type: "array",
            items: { type: "string" },
            description: "Bullet points detailing real signals from research and sources with source index citations."
        },
        opportunityGaps: {
            type: "array",
            items: { type: "string" },
            description: "Opportunity gaps identified for the founder."
        },
        risks: {
            type: "array",
            items: { type: "string" },
            description: "Risks specific to the founder's situation."
        },
        assumptions: {
            type: "array",
            items: { type: "string" },
            description: "Assumptions the founder needs to verify."
        }
    },
    required: ["marketSignals", "opportunityGaps", "risks", "assumptions"]
};

const marketTrendsSchema = {
    type: "object",
    properties: {
        marketSignals: {
            type: "array",
            items: { type: "string" },
            description: "Bullet points detailing real signals from research and sources with source index citations."
        },
        opportunityGaps: {
            type: "array",
            items: { type: "string" },
            description: "Opportunity gaps identified for the founder."
        }
    },
    required: ["marketSignals", "opportunityGaps"]
};

const riskAssessmentSchema = {
    type: "object",
    properties: {
        risks: {
            type: "array",
            items: { type: "string" },
            description: "Risks specific to the founder's situation."
        },
        assumptions: {
            type: "array",
            items: { type: "string" },
            description: "Assumptions the founder needs to verify."
        }
    },
    required: ["risks", "assumptions"]
};

const strategistSchema = {
    type: "object",
    properties: {
        thesis: {
            type: "string",
            description: "Core thesis or executive verdict."
        },
        positioning: {
            type: "string",
            description: "Product/concept positioning statement."
        },
        recommendations: {
            type: "array",
            items: { type: "string" },
            description: "3-5 actionable recommendations."
        },
        trendAnalysis: {
            type: "string",
            description: "Market trend analysis (optional, used in market_pulse)."
        },
        competitivePositioning: {
            type: "string",
            description: "Competitive positioning matrix/landscape (optional, used in competitor_brief, investor_memo)."
        },
        targetSegment: {
            type: "string",
            description: "Target segment details (optional, used in gtm_strategy)."
        },
        channelStrategy: {
            type: "string",
            description: "Channel strategy details (optional, used in gtm_strategy)."
        },
        marketOpportunity: {
            type: "string",
            description: "Market opportunity size and timeline (optional, used in investor_memo)."
        },
        tractionEvidence: {
            type: "string",
            description: "Traction evidence required (optional, used in investor_memo)."
        },
        askAndUse: {
            type: "string",
            description: "Ask and use of funds details (optional, used in investor_memo)."
        },
        threatCategories: {
            type: "string",
            description: "Detailed threat categories (optional, used in risk_radar)."
        },
        mitigationPlan: {
            type: "string",
            description: "Mitigation plan details (optional, used in risk_radar)."
        }
    },
    required: ["thesis", "positioning", "recommendations"]
};

const executionCoachSchema = {
    type: "object",
    properties: {
        sevenDaySprint: {
            type: "array",
            items: { type: "string" },
            description: "7 bullet points, each representing a day in the sprint, e.g., 'Day 1: ...', 'Day 2: ...'."
        },
        thirtyDayRoadmap: {
            type: "array",
            items: { type: "string" },
            description: "4 bullet points, each representing a week in the roadmap, e.g., 'Week 1: ...', 'Week 2: ...'."
        },
        validationChecklist: {
            type: "array",
            items: { type: "string" },
            description: "Questions the founder must answer to validate assumptions."
        },
        nextAssets: {
            type: "array",
            items: { type: "string" },
            description: "Deliverables the founder should produce."
        }
    },
    required: ["sevenDaySprint", "thirtyDayRoadmap", "validationChecklist", "nextAssets"]
};

const marketSignalsSchema = {
    type: "array",
    description: "List of market signals extracted from web research.",
    items: {
        type: "object",
        properties: {
            type: {
                type: "string",
                description: "Type of the signal (e.g. COMPETITOR MOVE, FUNDING ROUND, REGULATION CHANGE, CUSTOMER TREND, TECH SHIFT)."
            },
            title: {
                type: "string",
                description: "Concise headline summarizing the signal."
            },
            description: {
                type: "string",
                description: "1-2 sentence description explaining the occurrence and impact."
            },
            impact: {
                type: "string",
                enum: ["High", "Medium", "Low"],
                description: "Potential impact level on the founder's space."
            },
            sentiment: {
                type: "string",
                enum: ["Positive", "Negative", "Neutral"],
                description: "General business tone of the signal."
            },
            sourceIndex: {
                type: "integer",
                description: "The 1-based index of the ranked source this signal comes from, or null if synthesized.",
                nullable: true
            }
        },
        required: ["type", "title", "description", "impact", "sentiment"]
    }
};

const criticSchema = {
    type: "object",
    properties: {
        verdict: {
            type: "string",
            enum: ["approve", "revise"],
            description: "Decide whether to approve the report as is, or require a revision loop."
        },
        feedback: {
            type: "string",
            description: "Detailed instructions for what needs to be changed in the strategist or coach responses if the verdict is revise."
        },
        issues: {
            type: "array",
            items: { type: "string" },
            description: "A list of specific issues found in the draft report (e.g. missing citations, inconsistencies, generic advice)."
        }
    },
    required: ["verdict", "feedback", "issues"]
};

const reactStepSchema = {
    type: "object",
    properties: {
        thought: {
            type: "string",
            description: "Reasoning about what is missing and what step to take next."
        },
        action: {
            type: "string",
            enum: ["searchWeb", "getPageContent", "finish"],
            description: "The action to execute: searchWeb to run a search query, getPageContent to read a specific URL, or finish if research is complete."
        },
        actionInput: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "The search query (required if action is searchWeb)."
                },
                url: {
                    type: "string",
                    description: "The absolute URL to fetch (required if action is getPageContent)."
                }
            }
        }
    },
    required: ["thought", "action", "actionInput"]
};

module.exports = {
    queryPlannerSchema,
    marketAnalystSchema,
    marketTrendsSchema,
    riskAssessmentSchema,
    strategistSchema,
    executionCoachSchema,
    marketSignalsSchema,
    criticSchema,
    reactStepSchema
};
