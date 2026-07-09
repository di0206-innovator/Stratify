require('dotenv').config();
const { GeminiBIOrchestrator } = require('../lib/intelligence/orchestrator');
const { PgStartupStore, FileStartupStore } = require('../lib/startupStore');
const crypto = require('crypto');

const USE_PG = !!(process.env.DATABASE_URL || process.env.PGHOST);
const startupStore = USE_PG ? new PgStartupStore() : new FileStartupStore();

const orchestrator = new GeminiBIOrchestrator({
    apiKey: process.env.GEMINI_API_KEY,
    modelName: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    tavilyApiKey: process.env.TAVILY_API_KEY
});

async function seedStartups() {
    console.log('Seeding startups...');
    if (startupStore.init) await startupStore.init();

    // Prompts to generate startups
    const prompts = [
        "Find the top 5 YC backed startups from recent batches (2023-2024). Return ONLY a JSON array of objects with keys: name, pitch, problem, solution, industry, stage, websiteUrl.",
        "Find 5 top emerging Indian unicorn startups in 2024. Return ONLY a JSON array of objects with keys: name, pitch, problem, solution, industry, stage, websiteUrl."
    ];

    for (const p of prompts) {
        console.log(`Running prompt: ${p}`);
        try {
            // We use standard Gemini generation via the orchestrator's geminiModel
            const response = await orchestrator.model.generateContent(p);
            const text = response.response.text();
            
            // Basic JSON extraction
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                console.error('Failed to parse JSON from response:', text);
                continue;
            }
            const startupsList = JSON.parse(jsonMatch[0]);

            for (const s of startupsList) {
                const id = 'seeded-' + crypto.randomBytes(8).toString('hex');
                const startupObj = {
                    id,
                    ownerId: 'system',
                    name: s.name,
                    pitch: s.pitch || '',
                    problem: s.problem || '',
                    solution: s.solution || '',
                    industry: s.industry || '',
                    stage: s.stage || 'Launched',
                    geography: p.includes('Indian') ? 'India' : 'Global',
                    score: Math.floor(Math.random() * 40) + 60, // 60-100
                    websiteUrl: s.websiteUrl || ''
                };
                console.log(`Saving ${s.name}...`);
                await startupStore.saveStartup(startupObj);
            }
        } catch (e) {
            console.error('Error seeding:', e);
        }
    }
    console.log('Seeding complete.');
    process.exit(0);
}

seedStartups();
