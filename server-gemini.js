const express = require('express');
const cors = require('cors');
const path = require('path');
const { GeminiBIOrchestrator } = require('./GEMINI_ORCHESTRATOR');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const orchestrator = new GeminiBIOrchestrator();

app.post('/api/analyze', async (req, res) => {
    const { query } = req.body;
    if (!query) {
        return res.status(400).json({ error: "Query is required" });
    }

    try {
        const report = await orchestrator.processInquiry(query);
        res.json({ report });
    } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ error: "Failed to process intelligence request" });
    }
});

app.listen(port, () => {
    console.log(`BI Agent Network running at http://localhost:${port}`);
});
