const DEFAULT_SOURCES = [
    {
        title: 'Internal Strategy Brief',
        url: '',
        summary: 'Use the user query as the business context. Clearly label unsupported claims as assumptions and avoid inventing exact market figures.'
    },
    {
        title: 'Prototype Grounding Policy',
        url: '',
        summary: 'This application does not browse live web data. Reports must distinguish sourced evidence, assumptions, risks, and recommended next research steps.'
    }
];

function resolveSources(query, userSources = []) {
    if (userSources.length > 0) {
        return userSources;
    }

    return DEFAULT_SOURCES.map((source) => ({
        ...source,
        summary: `${source.summary} Query under review: ${query}`
    }));
}

function formatSourcesForPrompt(sources) {
    return sources.map((source, index) => {
        const url = source.url ? ` (${source.url})` : '';
        return `${index + 1}. ${source.title}${url}: ${source.summary}`;
    }).join('\n');
}

module.exports = {
    resolveSources,
    formatSourcesForPrompt
};
