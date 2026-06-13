class TavilySearchProvider {
    constructor({ apiKey, fetchImpl = fetch, timeoutMs = 12_000, cacheTtlMs = 10 * 60_000, retries = 1 } = {}) {
        this.apiKey = apiKey;
        this.fetch = fetchImpl;
        this.timeoutMs = timeoutMs;
        this.cacheTtlMs = cacheTtlMs;
        this.retries = retries;
        this.cache = new Map();
        this.name = apiKey ? 'tavily' : 'demo';
    }

    get enabled() {
        return Boolean(this.apiKey);
    }

    async search(query, options = {}) {
        if (!this.enabled) {
            return createDemoSearchResult(query);
        }

        const cacheKey = JSON.stringify({ query, options });
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        const payload = await this.fetchWithRetry(query, options);
        const normalized = normalizeTavilyPayload(query, payload);
        this.cache.set(cacheKey, {
            expiresAt: Date.now() + this.cacheTtlMs,
            value: normalized
        });
        return normalized;
    }

    async fetchWithRetry(query, options) {
        let lastError;

        for (let attempt = 0; attempt <= this.retries; attempt += 1) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), this.timeoutMs);

            try {
                const response = await this.fetch('https://api.tavily.com/search', {
                    method: 'POST',
                    signal: controller.signal,
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        query,
                        topic: options.topic || 'general',
                        search_depth: options.searchDepth || 'basic',
                        time_range: options.timeRange || 'month',
                        include_answer: 'basic',
                        include_raw_content: false,
                        include_images: false,
                        include_favicon: true,
                        max_results: options.maxResults || 5
                    })
                });

                if (!response.ok) {
                    const text = await response.text();
                    const error = new Error(`Tavily search failed with ${response.status}: ${text.slice(0, 200)}`);
                    error.status = response.status;
                    throw error;
                }

                return response.json();
            } catch (error) {
                lastError = error;
                if (!shouldRetry(error) || attempt === this.retries) break;
            } finally {
                clearTimeout(timer);
            }
        }

        throw lastError;
    }

    getCached(cacheKey) {
        const cached = this.cache.get(cacheKey);
        if (!cached) return null;
        if (Date.now() > cached.expiresAt) {
            this.cache.delete(cacheKey);
            return null;
        }
        return cached.value;
    }

    async extract(url) {
        if (!this.enabled) {
            return createDemoExtractResult(url);
        }

        const cacheKey = JSON.stringify({ extract: url });
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), this.timeoutMs);

            const response = await this.fetch('https://api.tavily.com/extract', {
                method: 'POST',
                signal: controller.signal,
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    urls: [url]
                })
            });

            clearTimeout(timer);

            if (!response.ok) {
                throw new Error(`Tavily extract failed with status ${response.status}`);
            }

            const data = await response.json();
            const result = data.results && data.results[0];
            if (result && result.raw_content) {
                const text = result.raw_content.slice(0, 4000);
                this.cache.set(cacheKey, {
                    expiresAt: Date.now() + this.cacheTtlMs,
                    value: text
                });
                return text;
            }
            throw new Error('No content extracted by Tavily');
        } catch (error) {
            console.warn(`Tavily extract failed for ${url}, falling back to direct fetch:`, error.message);
            return fetchDirect(url, this.fetch, this.timeoutMs);
        }
    }
}

async function fetchDirect(url, fetchImpl = fetch, timeoutMs = 8000) {
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        const res = await fetchImpl(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
            }
        });

        clearTimeout(timer);

        if (!res.ok) {
            throw new Error(`Direct fetch status ${res.status}`);
        }

        const html = await res.text();
        return cleanHtml(html).slice(0, 4000);
    } catch (err) {
        console.warn(`Direct fetch failed for ${url}:`, err.message);
        return `Failed to fetch page content directly from ${url}. Reason: ${err.message}. Please rely on search snippets or general knowledge for this URL.`;
    }
}

function cleanHtml(html) {
    if (!html) return '';
    // Strip script, style, svg, noscript, and standard header/footer layout elements
    let text = html.replace(/<(script|style|svg|noscript|header|footer|nav)[^>]*>[\s\S]*?<\/\1>/gi, '');
    // Strip remaining HTML tags
    text = text.replace(/<[^>]+>/g, ' ');
    // Decode basic HTML entities
    text = text
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");
    // Collapse multiple whitespaces and newlines
    text = text.replace(/\s+/g, ' ').trim();
    return text;
}

function createDemoExtractResult(url) {
    try {
        const parsed = new URL(url);
        const domain = parsed.hostname || 'unknown';
        return `[Demo mode: Content of ${url}] This is a mocked page reading result for ${domain}. The company focuses on innovative solutions in the industry, offering customizable pricing plans, modern design tools, and integration capabilities. Please proceed with planning based on these assumed details.`;
    } catch (e) {
        return `[Demo mode: Content of ${url}] Mocked page content for external resource.`;
    }
}


function normalizeTavilyPayload(query, payload) {
    return {
        provider: 'tavily',
        query,
        answer: payload.answer || '',
        results: (payload.results || []).map((item) => ({
            title: item.title || 'Untitled source',
            url: item.url || '',
            summary: item.content || item.snippet || '',
            publishedAt: item.published_date || item.publishedAt || '',
            score: typeof item.score === 'number' ? item.score : 0,
            favicon: item.favicon || ''
        }))
    };
}

function shouldRetry(error) {
    if (error.name === 'AbortError') return true;
    if (!error.status) return true;
    return error.status === 429 || error.status >= 500;
}

function createDemoSearchResult(query) {
    return {
        provider: 'demo',
        query,
        answer: 'Demo mode uses founder context and supplied sources only. Add TAVILY_API_KEY for live web intelligence.',
        results: [{
            title: 'Demo intelligence mode',
            url: '',
            summary: `No live search provider is configured. Treat "${query}" as a planning brief and validate real-world claims before execution.`,
            publishedAt: '',
            score: 0.5,
            favicon: ''
        }]
    };
}

module.exports = { TavilySearchProvider, createDemoSearchResult, normalizeTavilyPayload, cleanHtml, createDemoExtractResult };
