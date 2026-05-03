const { GeminiBIOrchestrator } = require("./GEMINI_ORCHESTRATOR");

async function runTest() {
    const orchestrator = new GeminiBIOrchestrator();
    const testQuery = "Analyze the competitive landscape of autonomous delivery drones in the US market for 2024.";
    
    console.log("Input Query:", testQuery);
    const report = await orchestrator.processInquiry(testQuery);
    
    console.log("\n--- FINAL REPORT ---\n");
    console.log(report);
}

if (require.main === module) {
    runTest();
}
