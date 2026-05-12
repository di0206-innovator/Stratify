function rankAndDedupeSources(searchResults = [], userSources = []) {
    const seen = new Set();
    const sources = [];

    [...userSources.map(markUserSource), ...searchResults.flatMap((result) => result.results || [])]
        .filter((source) => source && (source.url || source.summary))
        .forEach((source) => {
            const key = source.url || `${source.title}:${source.summary}`.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            sources.push({
                title: source.title || 'Untitled source',
                url: source.url || '',
                summary: source.summary || '',
                publishedAt: source.publishedAt || '',
                score: scoreSource(source),
                provider: source.provider || 'web'
            });
        });

    return sources
        .sort((a, b) => b.score - a.score)
        .slice(0, 12);
}

function markUserSource(source) {
    return {
        ...source,
        score: 1,
        provider: 'founder_supplied'
    };
}

function scoreSource(source) {
    let score = typeof source.score === 'number' ? source.score : 0.4;
    if (source.url) score += 0.15;
    if (source.publishedAt) score += 0.15;
    if ((source.summary || '').length > 120) score += 0.1;
    if (source.provider === 'founder_supplied') score += 0.2;
    return Math.min(1, Number(score.toFixed(2)));
}

module.exports = { rankAndDedupeSources };
