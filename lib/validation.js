const MIN_QUERY_LENGTH = 8;
const MAX_QUERY_LENGTH = 500;
const MAX_SOURCES = 8;
const MAX_SOURCE_FIELD_LENGTH = 1200;
const { normalizeFounderProfile, normalizeReportOptions, validateFounderContext } = require('./founderProfile');

function normalizeQuery(value) {
    return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function validateAnalyzeRequest(body = {}) {
    const query = normalizeQuery(body.query);
    const errors = [];

    if (!query) {
        errors.push('Query is required.');
    } else if (query.length < MIN_QUERY_LENGTH) {
        errors.push(`Query must be at least ${MIN_QUERY_LENGTH} characters.`);
    } else if (query.length > MAX_QUERY_LENGTH) {
        errors.push(`Query must be ${MAX_QUERY_LENGTH} characters or fewer.`);
    }

    const sourcesResult = normalizeSources(body.sources);
    errors.push(...sourcesResult.errors);
    const founderProfile = normalizeFounderProfile(body.founderProfile);
    const reportOptions = normalizeReportOptions(body.reportOptions);
    errors.push(...validateFounderContext(founderProfile, reportOptions));

    return {
        ok: errors.length === 0,
        errors,
        value: {
            query,
            sources: sourcesResult.sources,
            founderProfile,
            reportOptions
        }
    };
}

function normalizeSources(value) {
    if (value == null || value === '') {
        return { sources: [], errors: [] };
    }

    if (!Array.isArray(value)) {
        return { sources: [], errors: ['Sources must be an array.'] };
    }

    if (value.length > MAX_SOURCES) {
        return { sources: [], errors: [`Provide at most ${MAX_SOURCES} sources.`] };
    }

    const sources = [];
    const errors = [];

    value.forEach((source, index) => {
        if (!source || typeof source !== 'object' || Array.isArray(source)) {
            errors.push(`Source ${index + 1} must be an object.`);
            return;
        }

        const title = cleanField(source.title || `Source ${index + 1}`);
        const url = cleanField(source.url || '');
        const summary = cleanField(source.summary || source.content || '');

        if (!summary) {
            errors.push(`Source ${index + 1} needs a summary or content field.`);
        }

        if (url && !isHttpUrl(url)) {
            errors.push(`Source ${index + 1} URL must start with http:// or https://.`);
        }

        if ([title, url, summary].some((field) => field.length > MAX_SOURCE_FIELD_LENGTH)) {
            errors.push(`Source ${index + 1} contains a field longer than ${MAX_SOURCE_FIELD_LENGTH} characters.`);
        }

        sources.push({ title, url, summary });
    });

    return { sources, errors };
}

function cleanField(value) {
    return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function isHttpUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

module.exports = {
    MIN_QUERY_LENGTH,
    MAX_QUERY_LENGTH,
    validateAnalyzeRequest,
    normalizeSources
};
