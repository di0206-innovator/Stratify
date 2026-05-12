function createMetrics() {
    const startedAt = new Date();
    const counters = {
        requests: 0,
        reportsCreated: 0,
        reportFailures: 0,
        providerFailures: 0
    };
    const latencies = [];

    return {
        recordRequest() {
            counters.requests += 1;
        },
        recordReport(durationMs) {
            counters.reportsCreated += 1;
            latencies.push(durationMs);
            if (latencies.length > 200) latencies.shift();
        },
        recordFailure(kind = 'reportFailures') {
            counters[kind] = (counters[kind] || 0) + 1;
        },
        snapshot() {
            return {
                startedAt: startedAt.toISOString(),
                uptimeSeconds: Math.round((Date.now() - startedAt.getTime()) / 1000),
                counters: { ...counters },
                reportLatencyMs: summarize(latencies)
            };
        }
    };
}

function summarize(values) {
    if (!values.length) {
        return { count: 0, avg: 0, p95: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((total, value) => total + value, 0);
    const p95Index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));

    return {
        count: sorted.length,
        avg: Math.round(sum / sorted.length),
        p95: sorted[p95Index]
    };
}

module.exports = { createMetrics };
