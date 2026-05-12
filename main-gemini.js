const { GeminiBIOrchestrator } = require("./GEMINI_ORCHESTRATOR");

async function runTest() {
    const orchestrator = new GeminiBIOrchestrator();
    const testQuery = "Analyze the competitive landscape of autonomous delivery drones in the US market for 2024.";
    
    console.log("Input Query:", testQuery);
    const report = await orchestrator.processInquiry(testQuery, {
        founderProfile: {
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
        },
        reportOptions: {
            reportType: 'idea_validation',
            audience: 'founder',
            timeHorizon: '30_days'
        },
        sources: [{
            title: "CLI sample source",
            summary: "This is a local smoke-test source. Replace it with reviewed market notes for real analysis."
        }]
    });
    
    console.log("\n--- FINAL REPORT ---\n");
    console.log(report);
}

if (require.main === module) {
    runTest();
}
