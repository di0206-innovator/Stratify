const { GeminiBIOrchestrator } = require("../lib/intelligence/orchestrator");

async function runTest() {
    const orchestrator = new GeminiBIOrchestrator();
    const founderProfile = {
        founderType: 'technical',
        startupStage: 'validating',
        industry: 'autonomous logistics',
        geography: 'United States',
        product: 'autonomous delivery drone operations platform',
        targetCustomer: 'regional logistics operators',
        teamSize: '2 founders',
        budget: 'bootstrapped',
        timeline: '30 days',
        currentGoal: 'validate a narrow market wedge'
    };

    const reportTypes = ['idea_validation', 'market_pulse', 'competitor_brief'];

    for (const reportType of reportTypes) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Report Type: ${reportType}`);
        console.log(`${'='.repeat(60)}\n`);

        const report = await orchestrator.processInquiry(
            'Analyze the competitive landscape of autonomous delivery drones in the US market.',
            {
                founderProfile,
                reportOptions: {
                    reportType,
                    audience: 'founder',
                    timeHorizon: '30_days'
                },
                sources: [{
                    title: 'CLI sample source',
                    summary: 'This is a local smoke-test source. Replace it with reviewed market notes for real analysis.'
                }]
            }
        );

        console.log(`Title: ${report.title}`);
        console.log(`Mode: ${report.mode}`);
        console.log(`Intelligence: ${report.intelligenceMode}`);
        console.log(`Section order: ${report.sectionOrder.join(', ')}`);
        console.log(`Sections present: ${Object.keys(report.sections).join(', ')}`);
        console.log(`Sources: ${report.sources.length}`);
        console.log(`Agent logs: ${report.agentLogs.length}`);
        console.log(`\n--- MARKDOWN PREVIEW (first 600 chars) ---\n`);
        console.log(report.markdown.slice(0, 600));
        console.log('...\n');
    }
}

if (require.main === module) {
    runTest();
}
