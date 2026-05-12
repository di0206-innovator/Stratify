const test = require('node:test');
const assert = require('node:assert/strict');
const { TavilySearchProvider } = require('../lib/intelligence/searchProvider');

test('TavilySearchProvider normalizes successful search results', async () => {
    const provider = new TavilySearchProvider({
        apiKey: 'token',
        fetchImpl: async () => ({
            ok: true,
            json: async () => ({
                answer: 'Market answer',
                results: [{
                    title: 'Source',
                    url: 'https://example.com',
                    content: 'Useful source content',
                    score: 0.7
                }]
            })
        })
    });

    const result = await provider.search('founder strategy');

    assert.equal(result.provider, 'tavily');
    assert.equal(result.answer, 'Market answer');
    assert.equal(result.results[0].title, 'Source');
});

test('TavilySearchProvider caches identical requests', async () => {
    let calls = 0;
    const provider = new TavilySearchProvider({
        apiKey: 'token',
        fetchImpl: async () => {
            calls += 1;
            return {
                ok: true,
                json: async () => ({ answer: 'Cached answer', results: [] })
            };
        }
    });

    await provider.search('same query', { maxResults: 1 });
    await provider.search('same query', { maxResults: 1 });

    assert.equal(calls, 1);
});

test('TavilySearchProvider retries transient failures', async () => {
    let calls = 0;
    const provider = new TavilySearchProvider({
        apiKey: 'token',
        retries: 1,
        fetchImpl: async () => {
            calls += 1;
            if (calls === 1) {
                return {
                    ok: false,
                    status: 500,
                    text: async () => 'temporary failure'
                };
            }
            return {
                ok: true,
                json: async () => ({ answer: 'Recovered', results: [] })
            };
        }
    });

    const result = await provider.search('retry query');

    assert.equal(calls, 2);
    assert.equal(result.answer, 'Recovered');
});
