const test = require('node:test');
const assert = require('node:assert/strict');
const { validateAnalyzeRequest } = require('../lib/validation');

function validBody(overrides = {}) {
    return {
        query: 'Analyze fintech adoption in India',
        founderProfile: {
            founderType: 'solo',
            startupStage: 'idea',
            industry: 'fintech',
            geography: 'India',
            product: 'cashflow forecasting copilot',
            targetCustomer: 'small business owners',
            teamSize: 'solo',
            budget: 'bootstrapped',
            timeline: '30 days',
            currentGoal: 'validate buyer demand'
        },
        reportOptions: {
            reportType: 'idea_validation',
            audience: 'founder',
            timeHorizon: '30_days'
        },
        ...overrides
    };
}

test('validateAnalyzeRequest rejects missing query', () => {
    const result = validateAnalyzeRequest({});

    assert.equal(result.ok, false);
    assert.match(result.errors.join(' '), /Query is required/);
});

test('validateAnalyzeRequest rejects oversized query', () => {
    const result = validateAnalyzeRequest({ query: 'x'.repeat(501) });

    assert.equal(result.ok, false);
    assert.match(result.errors.join(' '), /500 characters/);
});

test('validateAnalyzeRequest normalizes valid query and sources', () => {
    const result = validateAnalyzeRequest({
        ...validBody({ query: '   Analyze   fintech adoption in India   ' }),
        sources: [{
            title: ' Market brief ',
            url: 'https://example.com/brief',
            summary: '  Reviewed notes   with spacing. '
        }]
    });

    assert.equal(result.ok, true);
    assert.equal(result.value.query, 'Analyze fintech adoption in India');
    assert.deepEqual(result.value.sources, [{
        title: 'Market brief',
        url: 'https://example.com/brief',
        summary: 'Reviewed notes with spacing.'
    }]);
});

test('validateAnalyzeRequest rejects malformed sources', () => {
    const result = validateAnalyzeRequest({
        ...validBody(),
        sources: [{ title: 'Bad URL', url: 'ftp://example.com', summary: 'Notes' }]
    });

    assert.equal(result.ok, false);
    assert.match(result.errors.join(' '), /URL must start/);
});

test('validateAnalyzeRequest requires founder context', () => {
    const result = validateAnalyzeRequest({
        query: 'Analyze fintech adoption in India',
        founderProfile: {},
        reportOptions: {}
    });

    assert.equal(result.ok, false);
    assert.match(result.errors.join(' '), /industry/);
});
