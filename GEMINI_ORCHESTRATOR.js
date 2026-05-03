const { GoogleGenerativeAI } = require("@google/generative-ai");
const { RESEARCHER_PROMPT, ANALYST_PROMPT, STRATEGIST_PROMPT } = require("./GEMINI_SYSTEM_PROMPT");
require('dotenv').config();

class GeminiBIOrchestrator {
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("CRITICAL: GEMINI_API_KEY is missing from environment variables.");
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
        // Using flash for faster sequential processing
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }

    async processInquiry(userQuery) {
        try {
            const agentLogs = [];

            // --- STAGE 1: RESEARCH ---
            console.log("Agent 1: Research Analyst starting...");
            const researchResult = await this.model.generateContent([RESEARCHER_PROMPT, `Query: ${userQuery}`]);
            const researchText = researchResult.response.text();
            agentLogs.push({ agent: "Research Analyst", message: "Research phase complete. Data gathered." });

            // --- STAGE 2: ANALYSIS ---
            console.log("Agent 2: Data Scientist starting...");
            const analysisResult = await this.model.generateContent([ANALYST_PROMPT, `Research Data: ${researchText}`]);
            const analysisText = analysisResult.response.text();
            agentLogs.push({ agent: "Data Scientist", message: "Analysis complete. Trends and insights identified." });

            // --- STAGE 3: STRATEGY ---
            console.log("Agent 3: Executive Writer starting...");
            const strategyResult = await this.model.generateContent([STRATEGIST_PROMPT, `Original Query: ${userQuery}\nResearch: ${researchText}\nAnalysis: ${analysisText}`]);
            const finalReport = strategyResult.response.text();
            agentLogs.push({ agent: "Executive Writer", message: "Strategy report generated and formatted." });

            return {
                finalReport,
                agentLogs
            };
        } catch (error) {
            console.error("ORCHESTRATION FAILED:", error);
            throw error;
        }
    }
}

module.exports = { GeminiBIOrchestrator };
