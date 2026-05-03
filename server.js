require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize Gemini
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

app.post('/api/analyze', async (req, res) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`Processing intelligence query: ${query}`);

    // Simulate multi-agent BI process logs
    const agentLog = [
        { id: 'researcher', name: 'Neural Researcher', action: `Scanning global datasets for "${query}"...` },
        { id: 'analyst', name: 'Trend Analyst', action: 'Extracting patterns and market signals...' },
        { id: 'strategist', name: 'Strategic Advisory', action: 'Synthesizing executive recommendations...' }
    ];

    try {
        let reportText = "";

        if (genAI) {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `You are a group of specialized BI agents working together as the "NeuralBI Agent Network".
            Create a professional, data-driven intelligence report based on the query: "${query}".
            
            Structure the report exactly like this:
            ## Strategic Intelligence Report: ${query}
            
            ### 1. Executive Summary
            (A punchy summary of the situation)
            
            ### 2. Market Dynamics & Patterns
            (Bullet points of key findings)
            
            ### 3. Predictive Insights
            (Data-driven projections)
            
            ### 4. Strategic Recommendations
            (Actionable steps)
            
            ---
            *Report synthesized by NeuralBI Autonomous Network*`;

            const result = await model.generateContent(prompt);
            reportText = result.response.text();
        } else {
            // High-quality fallback mock if no API key
            reportText = `## Strategic Intelligence Report: ${query} (DEMO MODE)

### 1. Executive Summary
Our multi-agent autonomous network has completed a deep-dive analysis. The findings suggest a paradigm shift in the current landscape for "${query}", driven by convergent technologies and shifting consumer behaviors.

### 2. Market Dynamics & Patterns
*   **Adoption Rates:** Identifying a 12-15% increase in adoption across top-tier sectors.
*   **Competitive Landscape:** Emerging players are challenging incumbents with decentralized models.
*   **Structural Shifts:** High probability of a significant market pivot within the next 18 months.

### 3. Predictive Insights
*   **Growth Correlation:** Our models indicate a 0.85 correlation between R&D spend and market leadership.
*   **Confidence Score:** Analysis verified at an 88% confidence level.
*   **Risk Profile:** Categorized as a strategic opportunity with manageable volatility.

### 4. Strategic Recommendations
*   **Immediate Action:** Integrate autonomous monitoring loops to capture high-frequency signals.
*   **Operational Pivot:** Align internal frameworks with agentic workflows to reduce decision latency.
*   **Next Steps:** Provision a Gemini API Key to enable real-time neural processing of live global data.

---
*Report synthesized by NeuralBI Autonomous Network*`;
        }

        // Simulate network delay for the "agentic" feel
        setTimeout(() => {
            res.json({ 
                report: reportText,
                agentLog: agentLog
            });
        }, 2000);

    } catch (error) {
        console.error('Analysis Error:', error);
        res.status(500).json({ error: 'Strategic bottleneck encountered in neural network.' });
    }
});

app.listen(port, () => {
    console.log(`NeuralBI Backend listening at http://localhost:${port}`);
});
