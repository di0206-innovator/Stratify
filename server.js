const dns = require('dns');
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const crypto = require('crypto');
const { GeminiBIOrchestrator } = require('./lib/intelligence/orchestrator');
const { validateAnalyzeRequest } = require('./lib/validation');
const { normalizeFounderProfile } = require('./lib/founderProfile');
const { createRateLimiter } = require('./lib/rateLimit');
const { getConfig } = require('./lib/config');
const {
    createAuthMiddleware,
    createOptionalAuthMiddleware,
    setSessionCookie,
    clearSessionCookie,
    readCookie,
    SESSION_COOKIE
} = require('./lib/auth');
const { AuthService } = require('./lib/authService');
const { FileAuthStore } = require('./lib/authStore');
const { HttpError, errorResponse } = require('./lib/httpErrors');
const { createLogger } = require('./lib/logger');
const { createMetrics } = require('./lib/metrics');
const { FileReportStore } = require('./lib/reportStore');
const { FileSignalStore } = require('./lib/signalStore');
const { PgStartupStore, FileStartupStore, getMatchedSchemes } = require('./lib/startupStore');
const { getWritableDataDir, getWritableDataPath } = require('./lib/runtimePaths');

// ── Scalable backends (auto-selected when DATABASE_URL / REDIS_URL are set) ──
const USE_PG    = !!(process.env.DATABASE_URL || process.env.PGHOST);
const USE_REDIS = !!(process.env.REDIS_URL    || process.env.REDIS_HOST);

let PgAuthService, PgReportStore, PgSignalStore, getRedis, createRedisRateLimiter;
if (USE_PG) {
    ({ PgAuthService }   = require('./lib/db/pgAuthService'));
    ({ PgReportStore }   = require('./lib/db/pgReportStore'));
    ({ PgSignalStore }   = require('./lib/db/pgSignalStore'));
}
if (USE_REDIS) {
    ({ getRedis }                = require('./lib/cache/redis'));
    ({ createRedisRateLimiter }  = require('./lib/cache/redisRateLimit'));
}

const config = getConfig();

function normalizeText(value) {
    return String(value || '').toLowerCase().trim();
}

function tokenizeSearchQuery(value) {
    return normalizeText(value)
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(Boolean);
}

function getStartupSearchText(startup) {
    return [
        startup.name,
        startup.pitch,
        startup.problem,
        startup.solution,
        startup.industry,
        startup.geography,
        startup.stage,
        startup.teamStatus,
        startup.team_status,
        startup.traction,
        startup.needs,
        startup.techStack,
        startup.tech_stack
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
}

function scoreStartupSearch(startup, query) {
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) return 0;

    const tokens = tokenizeSearchQuery(query);
    const haystack = getStartupSearchText(startup);
    const name = normalizeText(startup.name);
    const pitch = normalizeText(startup.pitch);
    let score = 0;

    if (name === normalizedQuery) score += 160;
    if (name.startsWith(normalizedQuery)) score += 120;
    if (name.includes(normalizedQuery)) score += 90;
    if (pitch.includes(normalizedQuery)) score += 30;
    if (haystack.includes(normalizedQuery)) score += 24;

    for (const token of tokens) {
        if (name.includes(token)) score += 24;
        if (pitch.includes(token)) score += 10;
        if (haystack.includes(token)) score += 6;
    }

    return score;
}

function matchesStartupSearch(startup, query) {
    return scoreStartupSearch(startup, query) > 0;
}

function matchesStartupStage(startup, stage) {
    const normalizedFilter = normalizeText(stage);
    if (!normalizedFilter || normalizedFilter === 'all') return true;

    const normalizedStage = normalizeText(startup.stage);
    const stageAliases = {
        idea: ['idea', 'ideation', 'pre-seed'],
        seed: ['seed', 'pre-seed'],
        mvp: ['mvp', 'prototype', 'beta'],
        launched: ['launched', 'launch', 'live'],
        scaling: ['scaling', 'scale', 'series a', 'series b'],
        growth: ['growth', 'unicorn', 'late stage']
    };

    return (stageAliases[normalizedFilter] || [normalizedFilter]).some((alias) => normalizedStage.includes(alias));
}

function decodeHtmlEntities(value) {
    return String(value || '')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ');
}

function normalizeSearchResultUrl(rawUrl) {
    let decoded = decodeHtmlEntities(rawUrl);

    if (decoded.startsWith('//')) {
        decoded = `https:${decoded}`;
    }

    try {
        const parsed = new URL(decoded);
        if (parsed.hostname.includes('duckduckgo.com')) {
            const wrapped = parsed.searchParams.get('uddg');
            if (wrapped) return decodeURIComponent(wrapped);
        }
        return parsed.toString();
    } catch {
        return decoded;
    }
}

function stripTags(value) {
    return decodeHtmlEntities(String(value || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function extractStartupNameFromTitle(title, fallbackUrl = '') {
    const cleaned = stripTags(title)
        .replace(/\s+[|\-–—]\s+.*$/, '')
        .replace(/\s+\(.+?\)\s*$/, '')
        .trim();
    if (cleaned) return cleaned;

    try {
        const hostname = new URL(fallbackUrl).hostname.replace(/^www\./, '');
        return hostname.split('.')[0];
    } catch {
        return 'Startup Result';
    }
}

function inferIndustryFromText(text) {
    const normalized = normalizeText(text);
    const rules = [
        ['fintech', ['payments', 'banking', 'fintech', 'lending', 'card']],
        ['healthtech', ['health', 'biotech', 'hospital', 'clinical', 'medtech']],
        ['ai', ['ai', 'artificial intelligence', 'machine learning', 'llm']],
        ['saas', ['software', 'platform', 'saas', 'workflow']],
        ['climate', ['climate', 'carbon', 'energy', 'sustainability']],
        ['ecommerce', ['commerce', 'retail', 'marketplace', 'shopping']]
    ];

    for (const [industry, keywords] of rules) {
        if (keywords.some((keyword) => normalized.includes(keyword))) {
            return industry;
        }
    }

    return 'startup';
}

async function searchStartupCompaniesOnWeb(query, { limit = 8, fetchImpl = fetch } = {}) {
    const startupQuery = `${query} startup company`;
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(startupQuery)}`;
    const response = await fetchImpl(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
        }
    });

    if (!response.ok) {
        throw new Error(`DuckDuckGo startup search failed with ${response.status}`);
    }

    const html = await response.text();
    const results = [];
    const resultRegex = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?(?:<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>|<div[^>]*class="[^"]*result__snippet[^"]*"[^>]*>)([\s\S]*?)(?:<\/a>|<\/div>)/gi;
    let match;

    while ((match = resultRegex.exec(html)) && results.length < limit) {
        const rawUrl = normalizeSearchResultUrl(match[1]);
        const title = stripTags(match[2]);
        const summary = stripTags(match[3]);

        if (!rawUrl || !title) continue;
        if (/duckduckgo\.com/i.test(rawUrl)) continue;

        const startupName = extractStartupNameFromTitle(title, rawUrl);
        const searchableText = `${title} ${summary} ${rawUrl}`;
        const searchScore = scoreStartupSearch({
            name: startupName,
            pitch: summary,
            problem: summary,
            solution: summary,
            industry: inferIndustryFromText(searchableText),
            geography: '',
            stage: 'live'
        }, query);

        results.push({
            id: `web-${crypto.createHash('md5').update(rawUrl).digest('hex').slice(0, 12)}`,
            name: startupName,
            pitch: summary || title,
            problem: '',
            solution: '',
            stage: 'live',
            industry: inferIndustryFromText(searchableText),
            geography: 'Web',
            teamStatus: 'Live web result',
            traction: '',
            needs: '',
            techStack: '',
            websiteUrl: rawUrl,
            externalUrl: rawUrl,
            score: Math.max(45, searchScore),
            searchScore: Math.max(45, searchScore),
            sourceType: 'web_search'
        });
    }

    return results;
}

function createApp(options = {}) {
    const app = express();
    const appConfig = options.config || config;
    const logger = options.logger || createLogger({ env: appConfig.nodeEnv });

    // Automatically run database migrations on server startup (crucial for Vercel serverless entrypoint)
    if (USE_PG) {
        const { migrate } = require('./lib/db/migrate');
        migrate({ logger }).catch((err) => {
            logger.error('[Database] Idle migration check failed:', err.message);
        });
    }

    const metrics = options.metrics || createMetrics();
    const orchestrator = options.orchestrator || new GeminiBIOrchestrator({
        apiKey: appConfig.geminiApiKey,
        modelName: appConfig.geminiModel,
        tavilyApiKey: appConfig.tavilyApiKey
    });
    // Auto-select PostgreSQL or file-based stores based on environment
    const redis = (USE_REDIS && !options.redis) ? getRedis() : (options.redis || null);

    let reportStore, signalStore, authService;

    if (USE_PG && !options.reportStore) {
        reportStore = new PgReportStore({ maxReports: appConfig.maxStoredReports });
    } else {
        reportStore = options.reportStore || new FileReportStore({
            filePath: appConfig.reportStorePath || getWritableDataPath('reports.json'),
            maxReports: appConfig.maxStoredReports
        });
    }

    if (USE_PG && !options.signalStore) {
        signalStore = new PgSignalStore({ redis });
    } else {
        signalStore = options.signalStore || new FileSignalStore({
            filePath: appConfig.signalStorePath || getWritableDataPath('signals.json')
        });
    }

    const authStore = options.authStore || new FileAuthStore({
        filePath: appConfig.authStorePath || getWritableDataPath('auth.json')
    });

    if (USE_PG && !options.authService) {
        authService = new PgAuthService({ config: appConfig, logger, redis });
        logger.info('Using PostgreSQL auth service');
    } else {
        authService = options.authService || new AuthService({ store: authStore, config: appConfig, logger });
        logger.info('Using file-based auth service');
    }

    let startupStore = options.startupStore;
    if (!startupStore) {
        if (USE_PG) {
            startupStore = new PgStartupStore();
        } else {
            startupStore = new FileStartupStore(getWritableDataDir());
        }
    }
    const auth = createAuthMiddleware({ token: appConfig.apiAuthToken, authService });
    const optionalAuth = createOptionalAuthMiddleware({ token: appConfig.apiAuthToken, authService });

    const realtimeClients = new Set();

    function broadcastEvent(type, data, fromIpc = false) {
        const payload = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
        for (const client of realtimeClients) {
            try {
                client.res.write(`data: ${payload}\n\n`);
                if (typeof client.res.flush === 'function') {
                    client.res.flush();
                }
            } catch (e) {
                realtimeClients.delete(client);
            }
        }

        if (!fromIpc && process.send) {
            process.send({ type: 'cluster_broadcast', eventType: type, eventData: data });
        }
    }

    app.broadcastEvent = broadcastEvent;

    // Use Redis rate limiter (distributed, shared across workers) when available
    const buildLimiter = (windowMs, max) => {
        if (USE_REDIS && createRedisRateLimiter) {
            const redis = getRedis ? getRedis() : null;
            if (redis) return createRedisRateLimiter({ windowMs, max, redis });
        }
        return createRateLimiter({ windowMs, max });
    };

    const analyzeLimiter = buildLimiter(appConfig.rateLimitWindowMs, appConfig.rateLimitMax);
    const loginLimiter   = buildLimiter(appConfig.loginRateLimitWindowMs, appConfig.loginRateLimitMax);

    app.disable('x-powered-by');
    app.set('trust proxy', true);
    app.use(compression());
    app.use(helmet({
        crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
        hsts: appConfig.nodeEnv === 'production' ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        } : false,
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                baseUri: ["'self'"],
                objectSrc: ["'none'"],
                formAction: ["'self'"],
                frameAncestors: ["'self'"],
                scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://apis.google.com", "https://*.firebaseapp.com", "'unsafe-inline'"],
                styleSrc: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
                fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'", "https://identitytoolkit.googleapis.com", "https://securetoken.googleapis.com", "https://*.googleapis.com", "https://*.firebaseapp.com"],
                frameSrc: ["'self'", "https://*.firebaseapp.com", "https://*.google.com"]
            }
        }
    }));

    app.use((req, res, next) => {
        req.id = crypto.randomUUID();
        req.startedAt = Date.now();
        res.setHeader('X-Request-Id', req.id);
        metrics.recordRequest();
        next();
    });

    app.use(cors((req, callback) => {
        const origin = req.get('origin');
        const host = req.get('host');
        const forwardedHost = req.get('x-forwarded-host');
        const isSameOrigin = origin && (
            origin === `https://${host}` || 
            origin === `http://${host}` ||
            (forwardedHost && (origin === `https://${forwardedHost}` || origin === `http://${forwardedHost}`))
        );

        if (!origin || isSameOrigin || appConfig.corsOrigins.includes(origin) || isAllowedDevOrigin(origin, appConfig)) {
            callback(null, { origin: true });
        } else {
            callback(new HttpError(403, 'CORS_ORIGIN_DENIED', 'Origin is not allowed by CORS.'));
        }
    }));

    app.use(express.json({ limit: appConfig.jsonBodyLimit }));
    app.use(express.static(path.join(__dirname, 'dist'), {
        extensions: ['html'],
        maxAge: appConfig.nodeEnv === 'production' ? '1h' : 0,
        setHeaders: (res, filePath) => {
            if (/\.(js|css|png|jpg|jpeg|svg|webp|ico|woff2?)$/i.test(filePath)) {
                res.setHeader('Cache-Control', appConfig.nodeEnv === 'production'
                    ? 'public, max-age=31536000, immutable'
                    : 'no-store');
            }
        }
    }));

    app.get('/api/health', (req, res) => {
        res.json({
            ok: true,
            service: 'stratify-api',
            requestId: req.id,
            workerId: process.pid,
            mode: orchestrator.mode,
            model: orchestrator.modelName || 'demo',
            intelligenceMode: getIntelligenceMode(orchestrator),
            backend: USE_PG ? 'postgresql' : 'file',
            cache: USE_REDIS ? 'redis' : 'memory'
        });
    });

    app.get('/api/ready', async (req, res, next) => {
        try {
            const checks = {};

            if (USE_PG) {
                const { testConnection } = require('./lib/db/pool');
                checks.database = (await testConnection()) ? 'ready' : 'unavailable';
            } else {
                await authStore.init();
                await reportStore.init();
                await signalStore.init();
                await startupStore.init();
                checks.database = 'file (ready)';
            }

            if (USE_REDIS) {
                const { testRedisConnection } = require('./lib/cache/redis');
                checks.cache = (await testRedisConnection()) ? 'ready' : 'unavailable';
            } else {
                checks.cache = 'memory (ready)';
            }

            const allHealthy = Object.values(checks).every(v => v.includes('ready'));
            if (!allHealthy) {
                return next(new HttpError(503, 'NOT_READY', 'Some dependencies are not ready.', checks));
            }

            res.json({
                ok: true,
                requestId: req.id,
                dependencies: {
                    ...checks,
                    gemini: orchestrator.mode === 'live' ? 'configured' : 'demo',
                    intelligence: getIntelligenceMode(orchestrator)
                }
            });
        } catch (error) {
            next(new HttpError(503, 'NOT_READY', 'Service dependencies are not ready.', { cause: error.message }));
        }
    });

    app.get('/api/realtime/stream', optionalAuth, (req, res) => {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();

        const client = { res, userId: req.user?.id || null };
        realtimeClients.add(client);

        res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Stratify Realtime stream activated.' })}\n\n`);
        if (typeof res.flush === 'function') {
            res.flush();
        }

        const pingInterval = setInterval(() => {
            try {
                res.write(`data: ${JSON.stringify({ type: 'ping' })}\n\n`);
                if (typeof res.flush === 'function') {
                    res.flush();
                }
            } catch (err) {
                clearInterval(pingInterval);
                realtimeClients.delete(client);
            }
        }, 15000);

        req.on('close', () => {
            clearInterval(pingInterval);
            realtimeClients.delete(client);
        });
    });

    app.post('/api/auth/register', async (req, res, next) => {
        try {
            const user = await authService.register(req.body || {});
            res.status(201).json({
                requestId: req.id,
                user,
                emailVerificationRequired: true
            });
        } catch (error) {
            next(error);
        }
    });

    app.post('/api/auth/verify-email', async (req, res, next) => {
        try {
            const user = await authService.verifyEmail(req.body && req.body.token);
            res.json({ requestId: req.id, user });
        } catch (error) {
            next(error);
        }
    });

    app.post('/api/auth/login', loginLimiter, async (req, res, next) => {
        try {
            const result = await authService.login({
                email: req.body && req.body.email,
                password: req.body && req.body.password,
                userAgent: req.get('user-agent'),
                ip: req.ip
            });
            setSessionCookie(res, result.sessionToken, result.session.expiresAt, appConfig);
            res.json({
                requestId: req.id,
                user: result.user,
                session: result.session
            });
        } catch (error) {
            next(error);
        }
    });

    app.post('/api/auth/logout', async (req, res, next) => {
        try {
            await authService.logout(readCookie(req, SESSION_COOKIE));
            clearSessionCookie(res, appConfig);
            res.status(204).end();
        } catch (error) {
            next(error);
        }
    });

    app.get('/api/auth/me', auth, (req, res) => {
        res.json({
            requestId: req.id,
            user: req.user,
            session: req.session || null
        });
    });

    app.get('/api/users/profile', auth, async (req, res, next) => {
        try {
            res.json({
                requestId: req.id,
                role: req.user.role,
                workspaceProfile: req.user.workspaceProfile || null
            });
        } catch (error) {
            next(error);
        }
    });

    app.post('/api/users/profile', auth, async (req, res, next) => {
        try {
            const profile = req.body || {};
            await authService.updateWorkspaceProfile(req.user.id, profile);
            res.json({
                requestId: req.id,
                message: 'Workspace profile updated successfully.'
            });
        } catch (error) {
            next(error);
        }
    });

    app.post('/api/auth/request-password-reset', loginLimiter, async (req, res, next) => {
        try {
            await authService.requestPasswordReset(req.body && req.body.email);
            res.status(202).json({
                requestId: req.id,
                message: 'If that email exists, a password reset email has been queued.'
            });
        } catch (error) {
            next(error);
        }
    });

    app.post('/api/auth/reset-password', async (req, res, next) => {
        try {
            const user = await authService.resetPassword({
                token: req.body && req.body.token,
                password: req.body && req.body.password
            });
            clearSessionCookie(res, appConfig);
            res.json({ requestId: req.id, user });
        } catch (error) {
            next(error);
        }
    });

    app.get('/api/metrics', auth, (req, res) => {
        res.json({
            requestId: req.id,
            ...metrics.snapshot()
        });
    });

    app.get('/api/reports', auth, async (req, res, next) => {
        try {
            const limit = clampInt(req.query.limit, 1, 100, 25);
            const reports = await reportStore.list({ limit, userId: req.user && req.user.id });
            res.json({ requestId: req.id, reports });
        } catch (error) {
            next(error);
        }
    });

    app.get('/api/reports/:id', auth, async (req, res, next) => {
        try {
            const report = await reportStore.get(req.params.id, { userId: req.user && req.user.id });
            if (!report) {
                throw new HttpError(404, 'REPORT_NOT_FOUND', 'Report not found.');
            }
            res.json({ requestId: req.id, report });
        } catch (error) {
            next(error);
        }
    });

    app.delete('/api/reports/:id', auth, async (req, res, next) => {
        try {
            const deleted = await reportStore.delete(req.params.id, { userId: req.user && req.user.id });
            if (!deleted) {
                throw new HttpError(404, 'REPORT_NOT_FOUND', 'Report not found.');
            }
            res.status(204).end();
        } catch (error) {
            next(error);
        }
    });

    app.patch('/api/reports/:id', auth, async (req, res, next) => {
        try {
            const report = await reportStore.get(req.params.id, { userId: req.user && req.user.id });
            if (!report) {
                throw new HttpError(404, 'REPORT_NOT_FOUND', 'Report not found.');
            }

            // Assign ownership to the authenticated user if it was anonymous/unowned
            if (!report.ownerId && req.user && req.user.id && req.user.id !== 'api-token') {
                report.ownerId = req.user.id;
            }

            if (req.body && req.body.sections) {
                if (req.body.sections.actionPlan) {
                    report.sections.actionPlan = req.body.sections.actionPlan;
                    
                    const { toMarkdown } = require('./lib/intelligence/orchestrator');
                    report.markdown = toMarkdown(
                        report.title,
                        report.generatedAt,
                        report.sections,
                        report.sectionOrder,
                        report.sources
                    );
                }
            }

            await reportStore.save(report);
            res.json({ requestId: req.id, report });
        } catch (error) {
            next(error);
        }
    });

    function requireAdmin(req, res, next) {
        if (!req.user) {
            return next(new HttpError(401, 'UNAUTHORIZED', 'Authentication is required.'));
        }
        const email = req.user.email ? req.user.email.toLowerCase() : '';
        const adminEmails = appConfig.adminEmails || [];
        const isAdmin = req.user.role === 'admin' || adminEmails.includes(email);
        if (!isAdmin) {
            return next(new HttpError(403, 'FORBIDDEN', 'Admin access is required.'));
        }
        next();
    }

    app.get('/api/admin/stats', auth, requireAdmin, async (req, res, next) => {
        try {
            const usersState = await authStore.readState();
            const totalUsers = usersState.users.length;
            const reports = await reportStore.readAll();
            const totalReports = reports.length;
            const activeSessions = usersState.sessions.length;
            const emailOutboxCount = usersState.emailOutbox.length;

            let totalCachedSignals = 0;
            if (typeof signalStore.readAll === 'function') {
                const signalsState = await signalStore.readAll();
                totalCachedSignals = Array.isArray(signalsState) ? signalsState.length : 0;
            }

            res.json({
                requestId: req.id,
                stats: {
                    totalUsers,
                    totalReports,
                    activeSessions,
                    emailOutboxCount,
                    totalCachedSignals,
                    apiMetrics: metrics.snapshot()
                }
            });
        } catch (error) {
            next(error);
        }
    });

    app.get('/api/admin/users', auth, requireAdmin, async (req, res, next) => {
        try {
            const usersState = await authStore.readState();
            const users = usersState.users.map((u) => ({
                id: u.id,
                email: u.email,
                name: u.name,
                emailVerified: u.emailVerified,
                createdAt: u.createdAt,
                isExternal: !!u.isExternal
            }));
            res.json({ requestId: req.id, users });
        } catch (error) {
            next(error);
        }
    });

    app.delete('/api/admin/users/:id', auth, requireAdmin, async (req, res, next) => {
        try {
            const userId = req.params.id;
            if (req.user.id === userId) {
                throw new HttpError(400, 'SELF_DELETION_PROHIBITED', 'You cannot delete your own admin user account.');
            }
            await authStore.update((state) => {
                state.users = state.users.filter((u) => u.id !== userId);
                state.sessions = state.sessions.filter((s) => s.userId !== userId);
                state.tokens = state.tokens.filter((t) => t.userId !== userId);
            });
            res.status(204).end();
        } catch (error) {
            next(error);
        }
    });

    app.get('/api/admin/reports', auth, requireAdmin, async (req, res, next) => {
        try {
            const reports = await reportStore.readAll();
            res.json({ requestId: req.id, reports });
        } catch (error) {
            next(error);
        }
    });

    app.delete('/api/admin/reports/:id', auth, requireAdmin, async (req, res, next) => {
        try {
            const reportId = req.params.id;
            const deleted = await reportStore.delete(reportId, { userId: 'api-token' });
            if (!deleted) {
                throw new HttpError(404, 'REPORT_NOT_FOUND', 'Report not found.');
            }
            res.status(204).end();
        } catch (error) {
            next(error);
        }
    });

    app.post('/api/reports', auth, analyzeLimiter, (req, res, next) => {
        createReport(req, res, next, { orchestrator, reportStore, startupStore, appConfig, logger, metrics });
    });

    app.post('/api/analyze', optionalAuth, analyzeLimiter, (req, res, next) => {
        if (appConfig.requireAuthForAnalyze && !req.user) {
            return next(new HttpError(401, 'UNAUTHORIZED', 'Authentication is required.'));
        }
        createReport(req, res, next, { orchestrator, reportStore, startupStore, appConfig, logger, metrics });
    });

    app.post('/api/analyze/stream', optionalAuth, analyzeLimiter, (req, res, next) => {
        if (appConfig.requireAuthForAnalyze && !req.user) {
            return next(new HttpError(401, 'UNAUTHORIZED', 'Authentication is required.'));
        }
        createReportStream(req, res, next, { orchestrator, reportStore, startupStore, appConfig, logger, metrics });
    });

    app.post('/api/signals', optionalAuth, async (req, res, next) => {
        try {
            const profile = normalizeFounderProfile(req.body && req.body.founderProfile);
            if (!profile.industry || !profile.geography) {
                throw new HttpError(400, 'INVALID_PROFILE', 'Industry and geography are required for market signals.');
            }

            let signals;
            let mode;
            const cached = await signalStore.getSignals(profile.industry, profile.geography);
            if (cached) {
                signals = cached.signals;
                mode = cached.mode;
            } else {
                const result = await orchestrator.processSignals(profile);
                await signalStore.saveSignals(profile.industry, profile.geography, result.signals, result.mode);
                signals = result.signals;
                mode = result.mode;
            }

            // Save to startup specific history and write timeline event if authenticated founder
            if (req.user && req.user.id && req.user.id !== 'api-token' && startupStore) {
                const startup = await startupStore.getStartupByOwner(req.user.id);
                if (startup) {
                    // Save signals to history
                    for (const sig of (signals || [])) {
                        await startupStore.saveSignalHistory({
                            id: 'sig-' + crypto.randomUUID(),
                            startupId: startup.id,
                            signalData: sig,
                            relevance: sig.impact?.toLowerCase() || 'medium'
                        });
                    }

                    // Create timeline event
                    await startupStore.createTimelineEvent({
                        id: crypto.randomUUID(),
                        startupId: startup.id,
                        actorId: req.user.id,
                        eventType: 'signals',
                        title: 'Ecosystem Signals Swept',
                        description: `Grounded ${signals.length} market signals for ${profile.industry} in ${profile.geography}.`,
                        metadata: { count: signals.length, mode }
                    });
                }
            }

            res.json({
                requestId: req.id,
                signals,
                mode
            });
        } catch (error) {
            next(error);
        }
    });

    if (appConfig.nodeEnv !== 'production') {
        app.get('/api/dev/emails', async (req, res, next) => {
            try {
                const state = await authStore.readState();
                res.json({
                    requestId: req.id,
                    emails: state.emailOutbox || []
                });
            } catch (error) {
                next(error);
            }
        });
    }

    // ── Stratify Startup Economy API Endpoints ──

    // Save Startup Profile
    app.post('/api/startups', auth, async (req, res, next) => {
        try {
            const body = req.body || {};
            if (!body.name) {
                throw new HttpError(400, 'MISSING_FIELD', 'Startup name is required.');
            }

            // Calculate progress-based Startup Score
            let score = 10; // base score for registering name
            if (body.pitch) score += 10;
            if (body.problem) score += 10;
            if (body.solution) score += 10;
            if (body.teamStatus) score += 10;
            if (body.traction) score += 10;
            if (body.needs) score += 10;
            if (body.techStack) score += 10;
            if (body.stage === 'mvp') score += 10;
            if (body.stage === 'growth') score += 20;

            const existing = await startupStore.getStartupByOwner(req.user.id);
            const startup = {
                id: existing ? existing.id : crypto.randomUUID(),
                ownerId: req.user.id,
                name: body.name,
                logoUrl: body.logoUrl || null,
                pitch: body.pitch || '',
                problem: body.problem || '',
                solution: body.solution || '',
                stage: body.stage || 'idea',
                industry: body.industry || '',
                geography: body.geography || '',
                teamStatus: body.teamStatus || '',
                traction: body.traction || '',
                needs: body.needs || '',
                techStack: body.techStack || '',
                score
            };

            const saved = await startupStore.saveStartup(startup);
            res.status(201).json({ requestId: req.id, startup: saved });
        } catch (error) {
            next(error);
        }
    });

    // Get my Startup Profile
    app.get('/api/startups/my', auth, async (req, res, next) => {
        try {
            const startup = await startupStore.getStartupByOwner(req.user.id);
            res.json({ requestId: req.id, startup });
        } catch (error) {
            next(error);
        }
    });

    // Update my Startup Profile
    app.put('/api/startups/my', auth, async (req, res, next) => {
        try {
            const startup = await startupStore.getStartupByOwner(req.user.id);
            if (!startup) {
                throw new HttpError(404, 'NOT_FOUND', 'No startup found for this user.');
            }
            const body = req.body || {};
            const allowedFields = ['name', 'pitch', 'problem', 'solution', 'stage', 'industry', 'geography',
                'teamStatus', 'traction', 'needs', 'techStack', 'deckUrl', 'websiteUrl', 'revenue', 'fundingRaised', 'logoUrl'];
            const updates = {};
            for (const field of allowedFields) {
                if (body[field] !== undefined) updates[field] = body[field];
            }
            // Recalculate score
            const merged = { ...startup, ...updates };
            let score = 10;
            if (merged.pitch) score += 10;
            if (merged.problem) score += 10;
            if (merged.solution) score += 10;
            if (merged.team_status || merged.teamStatus) score += 10;
            if (merged.traction && merged.traction !== 'Ideation') score += 10;
            if (merged.needs) score += 10;
            if (merged.tech_stack || merged.techStack) score += 10;
            if (merged.deck_url || merged.deckUrl) score += 5;
            if (merged.website_url || merged.websiteUrl) score += 5;
            if (merged.stage === 'mvp') score += 10;
            if (merged.stage === 'launched') score += 15;
            if (merged.stage === 'growth' || merged.stage === 'scaling') score += 20;
            updates.score = score;

            const updated = await startupStore.updateStartup(startup.id, updates);

            // Emit timeline event for profile update
            await startupStore.createTimelineEvent({
                id: crypto.randomUUID(),
                startupId: startup.id,
                actorId: req.user.id,
                eventType: 'profile_update',
                title: 'Startup profile updated',
                description: `Updated fields: ${Object.keys(updates).filter(k => k !== 'score').join(', ')}`,
                metadata: { updatedFields: Object.keys(updates) }
            });

            res.json({ requestId: req.id, startup: updated });
        } catch (error) {
            next(error);
        }
    });

    // Get trending startups list — MUST be registered BEFORE /:id to avoid shadowing
    app.get('/api/startups/trending', optionalAuth, async (req, res, next) => {
        try {
            const limit = Number(req.query.limit || 15);
            let startups = await startupStore.getTrendingStartups({ limit });
            
            // Add matchReason heuristic for discovery
            startups = startups.map(s => {
                let matchReason = '';
                if (s.score > 80) matchReason = 'High velocity growth signal';
                else if (s.score > 50) matchReason = 'Consistent product execution';
                else matchReason = 'Emerging startup';
                return { ...s, matchReason };
            });

            res.json({ requestId: req.id, startups });
        } catch (error) {
            next(error);
        }
    });

    // Get public startup profile by ID
    app.get('/api/startups/:id', optionalAuth, async (req, res, next) => {
        try {
            const startup = await startupStore.getStartup(req.params.id);
            if (!startup) {
                throw new HttpError(404, 'NOT_FOUND', 'Startup not found.');
            }
            const timeline = await startupStore.listTimeline(startup.id, { limit: 20 });
            const decisions = await startupStore.listDecisions(startup.id, { limit: 10 });
            const briefs = await startupStore.listBriefs(startup.id);
            const signals = await startupStore.listSignalHistory(startup.id, { limit: 10 });
            const opportunities = await startupStore.listOpportunities({ limit: 5 });
            res.json({ requestId: req.id, startup, timeline, decisions, briefs, signals, opportunities });
        } catch (error) {
            next(error);
        }
    });

function getFallbackJourneyText(startup) {
    return `### The Journey of ${startup.name}

${startup.name} is a pioneering force in the **${startup.industry || 'technology'}** sector, driven by a mission to address critical market inefficiencies. The company was founded on the vision of bridging gaps and delivering state-of-the-art solutions to modern operational challenges.

#### Solving the Core Challenge
The genesis of ${startup.name} stems from a clear problem statement: *"${startup.pitch || 'innovating in the space'}"*. Rather than relying on standard solutions, the team developed an advanced approach to streamline workflows and optimize efficiency for their users.

#### Scaling and Future Outlook
As ${startup.name} continues to expand its reach, the future holds immense potential. The roadmap focuses on expanding product capabilities, driving user adoption, and refining the underlying platform architecture. By maintaining a relentless focus on value creation, ${startup.name} is poised to establish a lasting impact in the industry.

For more information, visit their website: [${startup.websiteUrl || 'Official Website'}](${startup.websiteUrl || '#'})`;
}

    // Generate dynamic journey article
    app.post('/api/startups/:id/journey', optionalAuth, async (req, res, next) => {
        try {
            const startup = await startupStore.getStartup(req.params.id);
            if (!startup) {
                throw new HttpError(404, 'NOT_FOUND', 'Startup not found.');
            }
            const prompt = `Write a compelling, journalistic article (in markdown) detailing the journey of the startup "${startup.name}". Industry: ${startup.industry}. Pitch: ${startup.pitch}. Focus on their founding story, growth, and future potential. Keep it engaging, around 400 words. Do not include placeholders, invent plausible narrative based on typical tech startup growth in their sector if details are sparse. End the article with a clear call-to-action containing their website link: ${startup.websiteUrl || 'Not available'}`;
            
            let journeyText;
            if (orchestrator.model) {
                try {
                    const response = await orchestrator.model.generateContent(prompt);
                    journeyText = response.response.text();
                } catch (err) {
                    console.warn('Failed to generate journey using Gemini, falling back:', err.message);
                    journeyText = getFallbackJourneyText(startup);
                }
            } else {
                journeyText = getFallbackJourneyText(startup);
            }
            res.json({ requestId: req.id, journey: journeyText });
        } catch (error) {
            next(error);
        }
    });

    // ── Decisions (Founder Memory) ──
    app.post('/api/decisions', auth, async (req, res, next) => {
        try {
            let startup = await startupStore.getStartupByOwner(req.user.id);
            // Auto-create a stub startup if none exists so Memory works standalone
            if (!startup) {
                const userName = req.user.name || req.user.username || req.user.email?.split('@')[0] || 'Founder';
                startup = {
                    id: crypto.randomUUID(),
                    ownerId: req.user.id,
                    name: `${userName}'s Startup`,
                    pitch: '', problem: '', solution: '',
                    stage: 'idea', industry: '', geography: '',
                    teamStatus: 'solo', traction: '', needs: '',
                    techStack: '', score: 10,
                    deckUrl: '', websiteUrl: '', revenue: '', fundingRaised: ''
                };
                await startupStore.saveStartup(startup);
            }
            const body = req.body || {};
            if (!body.title) {
                throw new HttpError(400, 'MISSING_FIELD', 'Decision title is required.');
            }
            const decision = {
                id: crypto.randomUUID(),
                startupId: startup.id,
                authorId: req.user.id,
                title: body.title,
                context: body.context || '',
                outcome: body.outcome || '',
                status: body.status || 'active'
            };
            const saved = await startupStore.createDecision(decision);

            // Increment startup score
            startup.score = (startup.score || 10) + 5;
            await startupStore.updateStartup(startup.id, { score: startup.score });

            // Emit timeline event
            await startupStore.createTimelineEvent({
                id: crypto.randomUUID(),
                startupId: startup.id,
                actorId: req.user.id,
                eventType: 'decision',
                title: `Decision: ${decision.title}`,
                description: decision.context,
                metadata: { decisionId: decision.id }
            });

            res.status(201).json({ requestId: req.id, decision: saved });
        } catch (error) {
            next(error);
        }
    });

    app.get('/api/decisions', auth, async (req, res, next) => {
        try {
            const startup = await startupStore.getStartupByOwner(req.user.id);
            if (!startup) {
                return res.json({ requestId: req.id, decisions: [] });
            }
            const decisions = await startupStore.listDecisions(startup.id);
            res.json({ requestId: req.id, decisions });
        } catch (error) {
            next(error);
        }
    });

    // ── Timeline ──
    app.get('/api/timeline', auth, async (req, res, next) => {
        try {
            const startup = await startupStore.getStartupByOwner(req.user.id);
            if (!startup) {
                return res.json({ requestId: req.id, events: [] });
            }
            const eventType = req.query.type || null;
            const events = await startupStore.listTimeline(startup.id, { eventType });
            res.json({ requestId: req.id, events });
        } catch (error) {
            next(error);
        }
    });

    // ── Opportunities ──
    app.get('/api/opportunities', optionalAuth, async (req, res, next) => {
        try {
            const { geography, industry, stage, type } = req.query;
            const opportunities = await startupStore.listOpportunities({ geography, industry, stage, type });
            
            // Add match reasoning based on context
            const enriched = opportunities.map(opp => {
                let matchReason = null;
                if (industry && opp.industries?.toLowerCase().includes(industry.toLowerCase())) {
                    matchReason = `Highly relevant to your sector (${industry})`;
                } else if (geography && opp.geography?.toLowerCase().includes(geography.toLowerCase())) {
                    matchReason = `Local opportunity in ${geography}`;
                }
                return { ...opp, matchReason };
            });
            
            res.json({ requestId: req.id, opportunities: enriched });
        } catch (error) {
            next(error);
        }
    });

    app.post('/api/opportunities', auth, async (req, res, next) => {
        try {
            const body = req.body || {};
            if (!body.title) {
                throw new HttpError(400, 'MISSING_FIELD', 'Opportunity title is required.');
            }
            const opp = {
                id: crypto.randomUUID(),
                title: body.title,
                type: body.type || 'grant',
                organization: body.organization || '',
                description: body.description || '',
                geography: body.geography || 'Global',
                industries: body.industries || 'Any',
                stages: body.stages || '',
                deadline: body.deadline || null,
                link: body.link || null
            };
            const saved = await startupStore.createOpportunity(opp);
            res.status(201).json({ requestId: req.id, opportunity: saved });
        } catch (error) {
            next(error);
        }
    });

    // ── Signal History ──
    app.get('/api/signals/history', auth, async (req, res, next) => {
        try {
            const startup = await startupStore.getStartupByOwner(req.user.id);
            if (!startup) {
                return res.json({ requestId: req.id, history: [] });
            }
            const history = await startupStore.listSignalHistory(startup.id);
            const mappedHistory = (history || []).map(item => {
                let data = item.signalData || item.signal_data || {};
                if (typeof data === 'string') {
                    try { data = JSON.parse(data); } catch (e) {}
                }
                return {
                    id: item.id,
                    createdAt: item.createdAt || item.created_at,
                    relevance: item.relevance,
                    isRead: item.isRead || item.is_read,
                    ...data
                };
            });
            res.json({ requestId: req.id, history: mappedHistory });
        } catch (error) {
            next(error);
        }
    });

    // ── Explore / Discovery ──
    async function fetchAndSeedStartupFromWeb(searchName, orchestrator, startupStore, logger) {
        logger.info(`[Realtime Explorer] Performing real-time intelligence search for: "${searchName}"`);
        let searchData = null;

        // 1. Fetch info from web using searchProvider if enabled
        if (orchestrator.searchProvider && orchestrator.searchProvider.enabled) {
            try {
                searchData = await orchestrator.searchProvider.search(`${searchName} startup company overview details funding`);
            } catch (e) {
                logger.warn(`[Realtime Explorer] Web search failed for ${searchName}:`, e.message);
            }
        }

        // 2. Synthesize startup profile using Gemini
        let startupJsonStr = null;
        if (orchestrator.model) {
            try {
                const context = searchData
                    ? JSON.stringify(searchData.results.map(r => ({ title: r.title, summary: r.summary, url: r.url })))
                    : "";

                const prompt = `You are a high-fidelity startup intelligence parser. Synthesize a professional startup profile for "${searchName}".
${context ? `Use the following search results as reference context:\n${context}` : 'No search results are available. Rely on your pre-trained general knowledge of the startup ecosystem to fill in accurate details.'}

Return EXACTLY a valid JSON object matching the following structure and no other text:
{
  "name": "Startup Name (proper capitalization)",
  "pitch": "A short, professional 1-2 sentence pitch highlighting value proposition",
  "problem": "The key customer problem they address",
  "solution": "Their technical or product solution",
  "stage": "ideation" | "mvp" | "launched" | "scaling",
  "industry": "Primary industry category (e.g. AI, Fintech, SaaS, HealthTech, ClimateTech)",
  "geography": "Primary HQ country or city (e.g. India, USA, UK, Global)",
  "teamStatus": "Brief summary of founder/team size or status",
  "traction": "Key traction data like users, revenue range, or growth milestones if known",
  "needs": "Standard capital, hiring, or partnership needs",
  "techStack": "Primary programming language, cloud platform, or framework if known",
  "websiteUrl": "Official website URL",
  "revenue": "Annual revenue range/estimate (e.g., $1M-$5M)",
  "fundingRaised": "Total funding raised (e.g., $10M Series A)"
}`;

                const response = await orchestrator.model.generateContent(prompt);
                startupJsonStr = response.response.text();
            } catch (e) {
                logger.warn(`[Realtime Explorer] Gemini synthesis failed for ${searchName}:`, e.message);
            }
        }

        // 3. Fallback to generating simulated/mock data if offline
        if (!startupJsonStr) {
            startupJsonStr = JSON.stringify({
                name: searchName.charAt(0).toUpperCase() + searchName.slice(1),
                pitch: `Real-time search simulated: ${searchName} is an emerging innovator addressing market inefficiencies with modern digital infrastructure.`,
                problem: `High operational complexity and fragmented legacy workflows.`,
                solution: `An integrated, AI-driven automation platform providing seamless operations.`,
                stage: `launched`,
                industry: `SaaS`,
                geography: `Global`,
                teamStatus: `Growing engineering and product teams.`,
                traction: `Beta testing completed successfully with strong user feedback.`,
                needs: `Hiring lead developers and seeking seed funding.`,
                techStack: `React, Node.js, PostgreSQL`,
                websiteUrl: `https://www.google.com/search?q=${encodeURIComponent(searchName)}`,
                revenue: `Pre-revenue`,
                fundingRaised: `Bootstrapped`
            });
        }

        // 4. Clean and parse JSON
        try {
            let cleanJson = startupJsonStr.trim();
            if (cleanJson.startsWith('```')) {
                cleanJson = cleanJson.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
            }
            const parsed = JSON.parse(cleanJson);

            if (!parsed.name) parsed.name = searchName;

            let logoUrl = null;
            if (parsed.websiteUrl) {
                try {
                    let urlStr = parsed.websiteUrl.trim();
                    if (!/^https?:\/\//i.test(urlStr)) {
                        urlStr = 'https://' + urlStr;
                    }
                    const host = new URL(urlStr).hostname;
                    logoUrl = `https://logo.clearbit.com/${host}`;
                } catch (e) {
                    // Ignore url parse errors
                }
            }

            // Ensure system-seeded user exists in PostgreSQL to avoid FK violation
            if (USE_PG) {
                const { query } = require('./lib/db/pool');
                await query(`
                    INSERT INTO users (id, email, name, role)
                    VALUES ('system-seeded', 'system-seeded@stratify.com', 'System Radar', 'admin')
                    ON CONFLICT (id) DO NOTHING
                `);
            }

            const startup = {
                id: `startup-${crypto.randomBytes(6).toString('hex')}`,
                ownerId: `system-seeded`,
                name: parsed.name,
                logoUrl,
                pitch: parsed.pitch || '',
                problem: parsed.problem || '',
                solution: parsed.solution || '',
                stage: parsed.stage || 'launched',
                industry: parsed.industry || 'Tech',
                geography: parsed.geography || 'Global',
                teamStatus: parsed.teamStatus || 'Founding team',
                traction: parsed.traction || '',
                needs: parsed.needs || '',
                techStack: parsed.techStack || '',
                websiteUrl: parsed.websiteUrl || '',
                revenue: parsed.revenue || '',
                fundingRaised: parsed.fundingRaised || '',
            };

            const saved = await startupStore.saveStartup(startup);
            logger.info(`[Realtime Explorer] Dynamically seeded real-time startup details for: "${saved.name}"`);
            return saved;
        } catch (e) {
            logger.error(`[Realtime Explorer] Failed to parse/save real-time startup JSON:`, e.message, startupJsonStr);
            return null;
        }
    }

    // ── Explore / Discovery ──
    app.get('/api/explore/startups', optionalAuth, async (req, res, next) => {
        try {
            const { industry, stage, geography, search } = req.query;
            const limit = Number(req.query.limit || 30);
            const trimmedSearch = String(search || '').trim();

            // Get local list
            let startups = await startupStore.listStartups({ limit: 100 });

            // Check if there is any local match by search query (ignoring stage/industry filters)
            let hasLocalMatch = false;
            let localMatches = [];
            if (trimmedSearch) {
                localMatches = startups
                    .map((startup) => ({ startup, searchScore: scoreStartupSearch(startup, trimmedSearch) }))
                    .filter((entry) => entry.searchScore > 0)
                    .sort((a, b) => b.searchScore - a.searchScore || (b.startup.score || 0) - (a.startup.score || 0));
                hasLocalMatch = localMatches.length > 0;
            }

            // Real-time lookup fallback: if search is provided and local results are weak, synthesize a live startup profile.
            if (trimmedSearch.length >= 3 && localMatches.length < Math.min(limit, 6)) {
                try {
                    const seededStartup = await fetchAndSeedStartupFromWeb(trimmedSearch, orchestrator, startupStore, logger);
                    if (seededStartup) {
                        const alreadyPresent = startups.some((startup) => normalizeText(startup.name) === normalizeText(seededStartup.name));
                        if (!alreadyPresent) {
                            startups.push(seededStartup);
                        }

                        // Broadcast real-time discovery notification to all connected clients
                        broadcastEvent('post_created', {
                            id: crypto.randomUUID(),
                            startupId: seededStartup.id,
                            authorId: 'system-radar',
                            content: `Ecosystem Radar: "${seededStartup.name}" (${seededStartup.industry}) has been dynamically analyzed and mapped to our real-time watchlists.`,
                            type: 'milestone',
                            metadata: { isSystemNews: true },
                            startupName: seededStartup.name,
                            authorName: 'Ecosystem Radar'
                        });
                    }
                } catch (err) {
                    logger.warn(`[Realtime Explorer] Failed to dynamically seed startup for query "${trimmedSearch}":`, err.message);
                }
            }

            if (trimmedSearch.length >= 2 && appConfig.nodeEnv !== 'test') {
                try {
                    const webResults = await searchStartupCompaniesOnWeb(trimmedSearch, { limit: Math.min(limit, 8) });
                    for (const webStartup of webResults) {
                        const duplicate = startups.some((startup) => {
                            return normalizeText(startup.name) === normalizeText(webStartup.name)
                                || normalizeText(startup.websiteUrl) === normalizeText(webStartup.websiteUrl);
                        });
                        if (!duplicate) {
                            startups.push(webStartup);
                        }
                    }
                } catch (err) {
                    logger.warn(`[Realtime Explorer] Public startup search failed for "${trimmedSearch}":`, err.message);
                }
            }

            // Now apply filters (search, stage, industry, geography)
            const filtered = startups.filter((startup) => {
                if (trimmedSearch && !matchesStartupSearch(startup, trimmedSearch)) return false;
                if (industry && !(startup.industry || '').toLowerCase().includes(industry.toLowerCase())) return false;
                if (stage && !matchesStartupStage(startup, stage)) return false;
                if (geography && !(startup.geography || '').toLowerCase().includes(geography.toLowerCase())) return false;
                return true;
            });

            startups = filtered
                .map((startup) => ({
                    ...startup,
                    searchScore: trimmedSearch ? scoreStartupSearch(startup, trimmedSearch) : 0
                }))
                .sort((a, b) => {
                    if (trimmedSearch) {
                        return b.searchScore - a.searchScore || (b.score || 0) - (a.score || 0);
                    }
                    return (b.score || 0) - (a.score || 0);
                });

            const enriched = startups.map(s => {
                let matchReason = null;
                if (req.user) {
                    const prof = req.user.workspaceProfile || {};
                    let score = 70;
                    if (req.user.role === 'vc') {
                        const sectorsMatch = prof.industry && prof.industry.toLowerCase().split(',').some(sec => (s.industry || '').toLowerCase().includes(sec.trim()));
                        const stageMatch = prof.investmentStage && (s.stage || '').toLowerCase() === prof.investmentStage.toLowerCase();
                        const geoMatch = prof.geography && (s.geography || '').toLowerCase() === prof.geography.toLowerCase();
                        if (sectorsMatch) score += 15;
                        if (stageMatch) score += 10;
                        if (geoMatch) score += 5;
                        matchReason = `${score}% thesis fit with your VC fund`;
                    } else if (req.user.role === 'government') {
                        const sectorsMatch = prof.industry && prof.industry.toLowerCase().split(',').some(sec => (s.industry || '').toLowerCase().includes(sec.trim()));
                        const geoMatch = prof.geography && (s.geography || '').toLowerCase() === prof.geography.toLowerCase();
                        if (sectorsMatch) score += 15;
                        if (geoMatch) score += 15;
                        matchReason = `${score}% eligibility alignment for your sovereign program`;
                    } else {
                        // Founder matching with other startups
                        matchReason = `Shares similar sector focus`;
                    }
                }
                return { ...s, matchReason };
            });

            res.json({
                requestId: req.id,
                startups: enriched.slice(0, limit),
                meta: {
                    mode: trimmedSearch ? 'startup_search' : 'directory',
                    query: trimmedSearch || null,
                    localMatches: hasLocalMatch
                }
            });
        } catch (error) {
            next(error);
        }
    });

    app.get('/api/live/ticker', optionalAuth, async (req, res, next) => {
        try {
            const limit = Math.max(3, Math.min(20, Number(req.query.limit || 10)));
            const [posts, startups, opportunities] = await Promise.all([
                startupStore.listPosts({ limit: 8 }),
                startupStore.getTrendingStartups({ limit: 6 }),
                startupStore.listOpportunities({ limit: 4 })
            ]);

            const items = [
                ...posts.map((post) => ({
                    id: `post-${post.id}`,
                    type: post.metadata?.isSystemNews ? 'news' : (post.type === 'milestone' || post.type === 'launch' ? 'milestone' : 'post'),
                    text: post.metadata?.isSystemNews
                        ? post.content
                        : `${post.startupName || post.authorName || 'Founder'}: ${String(post.content || '').slice(0, 120)}`,
                    createdAt: post.createdAt || post.created_at || new Date().toISOString()
                })),
                ...startups.map((startup) => ({
                    id: `startup-${startup.id}`,
                    type: 'funding',
                    text: `${startup.name} is trending in ${startup.industry || 'the ecosystem'} at the ${startup.stage || 'active'} stage.`,
                    createdAt: startup.updated_at || startup.created_at || new Date().toISOString()
                })),
                ...opportunities.map((opp) => ({
                    id: `opp-${opp.id}`,
                    type: 'bounty',
                    text: `${opp.organization || 'Ecosystem Program'}: ${opp.title} now open for ${opp.stages || 'active'} startups.`,
                    createdAt: opp.created_at || new Date().toISOString()
                }))
            ]
                .filter((item) => item.text)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            res.json({ requestId: req.id, items: items.slice(0, limit) });
        } catch (error) {
            next(error);
        }
    });

    app.get('/api/explore/people', auth, async (req, res, next) => {
        try {
            const { role } = req.query;
            const usersState = await authStore.readState();
            let people = usersState.users
                .filter(u => u.id !== req.user.id)
                .map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }));
            if (role) people = people.filter(p => p.role === role);
            res.json({ requestId: req.id, people });
        } catch (error) {
            next(error);
        }
    });

    // Post to execution feed (with timeline event emission)
    app.post('/api/posts', auth, async (req, res, next) => {
        try {
            const body = req.body || {};
            if (!body.content) {
                throw new HttpError(400, 'MISSING_FIELD', 'Content is required.');
            }

            let startup = await startupStore.getStartupByOwner(req.user.id);
            // Auto-create stub startup so posts always sync to memory
            if (!startup) {
                const userName = req.user.name || req.user.username || req.user.email?.split('@')[0] || 'Founder';
                startup = {
                    id: crypto.randomUUID(),
                    ownerId: req.user.id,
                    name: `${userName}'s Startup`,
                    pitch: '', problem: '', solution: '',
                    stage: 'idea', industry: '', geography: '',
                    teamStatus: 'solo', traction: '', needs: '',
                    techStack: '', score: 10,
                    deckUrl: '', websiteUrl: '', revenue: '', fundingRaised: ''
                };
                await startupStore.saveStartup(startup);
            }

            const post = {
                id: crypto.randomUUID(),
                startupId: startup ? startup.id : null,
                authorId: req.user.id,
                content: body.content,
                type: body.type || 'post',
                metadata: body.metadata || {},
                authorName: req.user.name || req.user.username || 'Founder'
            };

            // If it's a major milestone, boost the startup score
            if (startup && (body.type === 'milestone' || body.type === 'launch')) {
                const scoreBoost = body.type === 'launch' ? 25 : 15;
                startup.score = (startup.score || 0) + scoreBoost;
                await startupStore.saveStartup(startup);

                // Emit score change timeline event
                await startupStore.createTimelineEvent({
                    id: crypto.randomUUID(),
                    startupId: startup.id,
                    actorId: req.user.id,
                    eventType: 'score_change',
                    title: `Score +${scoreBoost} (${body.type})`,
                    description: `Score increased to ${startup.score} from ${body.type} post.`,
                    metadata: { delta: scoreBoost, newScore: startup.score }
                });
            }

            const saved = await startupStore.createPost(post);

            // Emit timeline event for the post
            if (startup) {
                await startupStore.createTimelineEvent({
                    id: crypto.randomUUID(),
                    startupId: startup.id,
                    actorId: req.user.id,
                    eventType: body.type === 'milestone' ? 'milestone' : body.type === 'launch' ? 'launch' : 'post',
                    title: body.type === 'milestone' ? 'Milestone achieved' : body.type === 'launch' ? 'Product launched' : 'Update posted',
                    description: body.content.slice(0, 200),
                    metadata: { postId: post.id, powUrl: body.metadata?.powUrl || null }
                });

                // ── AUTO-SYNC to Founder Memory (Intel & Memory) ──
                // Every founder post is also recorded as a decision/log entry
                const decisionTitle = body.type === 'milestone' ? `🏆 Milestone: ${body.content.slice(0, 80)}` :
                                      body.type === 'launch'    ? `🚀 Launch: ${body.content.slice(0, 80)}` :
                                      body.type === 'update'    ? `📝 Update: ${body.content.slice(0, 80)}` :
                                                                  `💬 Feed Post: ${body.content.slice(0, 80)}`;
                await startupStore.createDecision({
                    id: crypto.randomUUID(),
                    startupId: startup.id,
                    authorId: req.user.id,
                    title: decisionTitle,
                    context: body.content,
                    outcome: body.metadata?.powUrl ? `Proof of Work: ${body.metadata.powUrl}` : '',
                    status: (body.type === 'milestone' || body.type === 'launch') ? 'validated' : 'active'
                });
            }

            const postWithAuthor = {
                ...saved,
                startupName: startup ? startup.name : 'Independent Founder',
                startupLogo: startup ? startup.logoUrl || startup.logo_url : null,
                authorName: req.user.name || req.user.username || 'Founder'
            };

            broadcastEvent('post_created', postWithAuthor);

            res.status(201).json({ requestId: req.id, post: saved });
        } catch (error) {
            next(error);
        }
    });

    // POST /api/posts/:id/clap
    app.post('/api/posts/:id/clap', auth, async (req, res, next) => {
        try {
            const postId = req.params.id;
            const post = await startupStore.getPost(postId);
            if (!post) {
                throw new HttpError(404, 'NOT_FOUND', 'Post not found.');
            }
            
            const metadata = post.metadata || {};
            const claps = (metadata.claps || 0) + 1;
            
            const updated = await startupStore.updatePost(postId, {
                metadata: { claps }
            });
            
            broadcastEvent('post_clapped', { postId, claps });
            
            res.json({ requestId: req.id, post: updated });
        } catch (e) {
            next(e);
        }
    });

    // List execution feed posts
    app.get('/api/posts', optionalAuth, async (req, res, next) => {
        try {
            const limit = Number(req.query.limit || 50);
            const posts = await startupStore.listPosts({ limit });
            res.json({ requestId: req.id, posts });
        } catch (error) {
            next(error);
        }
    });

    // Runway AI Scenario Simulator (optionalAuth — simulation is a stateless calculation, no user data exposed)
    app.post('/api/runway/simulate', optionalAuth, async (req, res, next) => {
        try {
            const { scenarioText } = req.body || {};
            const cash = Number(req.body?.cash || 0);
            const burn = Number(req.body?.burn || 0);
            const revenue = Number(req.body?.revenue || 0);
            const growth = Number(req.body?.growth || 0);
            if (!scenarioText) {
                throw new HttpError(400, 'MISSING_FIELD', 'Scenario text is required.');
            }

            const apiKey = process.env.GEMINI_API_KEY;
            let result;

            if (apiKey) {
                try {
                    const genAI = new GoogleGenerativeAI(apiKey);
                    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                    const prompt = `You are an expert startup finance agent.
Analyze the following natural language business decision scenario: "${scenarioText}".
Based on this, output the financial impacts on:
1. cashDelta (immediate change in cash, positive or negative number)
2. burnDelta (monthly change in cost, positive or negative number)
3. growthDelta (monthly change in growth rate percentage, positive or negative number)
4. explanation (a 1-2 sentence explanation of the reasoning)

Current status:
Cash: $${cash}
Monthly Burn: $${burn}
Monthly Revenue: $${revenue}
Growth Rate: ${growth}%

Respond ONLY with a valid JSON object matching this schema (do not wrap in markdown blocks):
{
  "cashDelta": number,
  "burnDelta": number,
  "growthDelta": number,
  "explanation": string
}`;
                    const genResult = await model.generateContent(prompt);
                    const text = genResult.response.text().trim();
                    const jsonStr = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
                    result = JSON.parse(jsonStr);
                } catch (err) {
                    console.warn('Gemini simulation failed, falling back to rule-based analysis:', err);
                    result = fallbackSimulate(scenarioText, cash, burn, revenue, growth);
                }
            } else {
                result = fallbackSimulate(scenarioText, cash, burn, revenue, growth);
            }

            // Log to timeline (only if user is authenticated)
            if (req.user) {
            try {
                const startup = await startupStore.getStartupByOwner(req.user.id);
                if (startup) {
                    await startupStore.createTimelineEvent({
                        id: 'evt-' + crypto.randomUUID(),
                        startupId: startup.id,
                        actorId: req.user.id,
                        eventType: 'runway',
                        title: 'Runway Simulation Executed',
                        description: `Simulated financial scenario: "${scenarioText.length > 50 ? scenarioText.slice(0, 50) + '...' : scenarioText}"`,
                        metadata: { cashDelta: result.cashDelta, burnDelta: result.burnDelta, growthDelta: result.growthDelta }
                    });
                }
            } catch (err) {
                console.warn('Failed to log runway simulation timeline event:', err.message);
            }
            }

            res.json({ requestId: req.id, simulation: result });
        } catch (error) {
            next(error);
        }
    });

    // Get briefs owned by current user's startup
    app.get('/api/briefs', auth, async (req, res, next) => {
        try {
            const startup = await startupStore.getStartupByOwner(req.user.id);
            if (!startup) {
                return res.json({ requestId: req.id, briefs: [] });
            }
            const briefs = await startupStore.listBriefs(startup.id);
            const userBriefs = briefs.map(b => {
                let parsed = {};
                try { parsed = JSON.parse(b.content); } catch (e) {}
                return {
                    id: b.id,
                    startupId: b.startupId || b.startup_id,
                    title: b.title,
                    ...parsed,
                    createdAt: b.createdAt || b.created_at
                };
            });
            res.json({ requestId: req.id, briefs: userBriefs });
        } catch (error) {
            next(error);
        }
    });

    // Create or Update a brief
    app.post('/api/briefs', auth, async (req, res, next) => {
        try {
            const body = req.body || {};
            let startup = await startupStore.getStartupByOwner(req.user.id);
            // Auto-create stub startup if missing so briefs can be saved standalone
            if (!startup) {
                const userName = req.user.name || req.user.username || req.user.email?.split('@')[0] || 'Founder';
                startup = {
                    id: crypto.randomUUID(),
                    ownerId: req.user.id,
                    name: body.name || `${userName}'s Startup`,
                    pitch: body.pitch || '', problem: body.problem || '', solution: body.solution || '',
                    stage: 'idea', industry: '', geography: '',
                    teamStatus: 'solo', traction: '', needs: '',
                    techStack: '', score: 10,
                    deckUrl: body.deckUrl || '', websiteUrl: '', revenue: '', fundingRaised: ''
                };
                await startupStore.saveStartup(startup);
            }
            
            const existingBriefs = await startupStore.listBriefs(startup.id);
            const existing = existingBriefs.length > 0 ? existingBriefs[0] : null;

            const briefData = {
                name: startup.name || (body.name || 'Stealth Startup'),
                pitch: body.pitch || startup.pitch || '',
                problem: body.problem || startup.problem || '',
                solution: body.solution || startup.solution || '',
                isPublic: body.isPublic !== undefined ? body.isPublic : true,
                whitelist: Array.isArray(body.whitelist) ? body.whitelist.map(w => w.toLowerCase()) : [],
                deckUrl: body.deckUrl || '',
                showRunway: body.showRunway !== undefined ? body.showRunway : true,
            };
            
            // Re-save. Need a saveBrief method or just use createBrief
            // Actually, if we're migrating, let's just make it create multiple versions over time,
            // or we'll just implement `saveBrief` to UPSERT if we can. 
            // In FileStartupStore we only have createBrief and listBriefs right now.
            // Let's just create a new brief if none exists, else if we don't have update we can just create a new row/item.
            // Wait, we need it to update. Since `createBrief` in FileStartupStore unshifts, listBriefs will return it first.
            // That's fine for now, we just act as if it's versioned.
            
            const brief = await startupStore.createBrief({
                id: existing ? existing.id : crypto.randomUUID(),
                startupId: startup.id,
                title: briefData.name + ' Pitch Brief',
                content: JSON.stringify(briefData)
            });

            // Log to timeline
            await startupStore.createTimelineEvent({
                id: 'evt-' + crypto.randomUUID(),
                startupId: startup.id,
                actorId: req.user.id,
                eventType: 'brief',
                title: 'Pitch Brief Updated',
                description: `Updated pitch brief configuration for "${briefData.name}".`,
                metadata: { briefId: brief.id }
            });

            res.status(201).json({ requestId: req.id, brief: { ...brief, ...briefData } });
        } catch (error) {
            next(error);
        }
    });

    // Get specific brief (with whitelist validation)
    app.get('/api/briefs/:id', optionalAuth, async (req, res, next) => {
        try {
            const briefs = await readBriefs();
            const brief = briefs.find(b => b.id === req.params.id);
            if (!brief) {
                throw new HttpError(404, 'NOT_FOUND', 'Strategic brief not found.');
            }

            // Authorization check
            if (!brief.isPublic) {
                if (!req.user) {
                    throw new HttpError(403, 'UNAUTHORIZED_DATA_ROOM', 'This pitch brief is restricted. Please sign in.');
                }
                if (req.user.id !== brief.ownerId) {
                    const userEmail = req.user.email ? req.user.email.toLowerCase() : '';
                    const domain = userEmail.split('@')[1] || '';
                    const isWhitelisted = brief.whitelist.some(item => 
                        item === userEmail || item === domain
                    );
                    if (!isWhitelisted) {
                        throw new HttpError(403, 'UNAUTHORIZED_DATA_ROOM', 'Access denied. You are not on the investor whitelist for this data room.');
                    }
                }
            }

            // Get the live startup score if available
            let score = 10;
            if (brief.startupId) {
                const liveStartup = await startupStore.getStartup(brief.startupId);
                if (liveStartup) {
                    score = liveStartup.score;
                }
            }

            res.json({ requestId: req.id, brief: { ...brief, score } });
        } catch (error) {
            next(error);
        }
    });

    // Equity Planner (Cap Tables)
    app.get('/api/equity', auth, async (req, res, next) => {
        try {
            const startup = await startupStore.getStartupByOwner(req.user.id);
            if (!startup) {
                return res.json({ requestId: req.id, capTable: null });
            }
            const capTable = await startupStore.getCapTable(startup.id);
            if (capTable) {
                // Parse state if it's stringified
                let parsedState = capTable.state || {};
                if (typeof parsedState === 'string') {
                    try { parsedState = JSON.parse(parsedState); } catch(e) {}
                }
                res.json({ requestId: req.id, capTable: { ...capTable, state: parsedState } });
            } else {
                res.json({ requestId: req.id, capTable: null });
            }
        } catch (error) {
            next(error);
        }
    });

    app.post('/api/equity', auth, async (req, res, next) => {
        try {
            const startup = await startupStore.getStartupByOwner(req.user.id);
            if (!startup) {
                throw new HttpError(400, 'BAD_REQUEST', 'You must have a startup to manage equity.');
            }
            const { state, versionName } = req.body;
            let existing = await startupStore.getCapTable(startup.id);
            const capTableData = {
                id: existing ? existing.id : crypto.randomUUID(),
                startupId: startup.id,
                versionName: versionName || (existing ? existing.versionName : 'Current'),
                state: state || {}
            };
            const saved = await startupStore.saveCapTable(capTableData);
            
            // Log to timeline
            await startupStore.createTimelineEvent({
                id: 'evt-' + crypto.randomUUID(),
                startupId: startup.id,
                actorId: req.user.id,
                eventType: 'cap_table',
                title: 'Cap Table Updated: ' + capTableData.versionName,
                description: `Updated equity distribution model for version "${capTableData.versionName}".`,
                metadata: { capTableId: saved.id }
            });

            let parsedState = saved.state || {};
            if (typeof parsedState === 'string') {
                try { parsedState = JSON.parse(parsedState); } catch(e) {}
            }
            res.json({ requestId: req.id, capTable: { ...saved, state: parsedState } });
        } catch (error) {
            next(error);
        }
    });

    // Matched government schemes
    app.get('/api/gov-schemes', auth, async (req, res, next) => {
        try {
            const startup = await startupStore.getStartupByOwner(req.user.id);
            if (!startup) {
                return res.json({ requestId: req.id, schemes: [] });
            }
            const schemes = getMatchedSchemes(startup.geography, startup.industry);
            res.json({ requestId: req.id, schemes });
        } catch (error) {
            next(error);
        }
    });

    // GET /api/bounties
    app.get('/api/bounties', auth, async (req, res, next) => {
        try {
            const { startupId, status } = req.query;
            const list = await startupStore.listBounties({ startupId, status });
            res.json({ requestId: req.id, bounties: list });
        } catch (e) {
            next(e);
        }
    });

    // POST /api/bounties
    app.post('/api/bounties', auth, async (req, res, next) => {
        try {
            const { title, description, points, reward, startupId } = req.body;
            if (!title || !description || !startupId) {
                throw new HttpError(400, 'BAD_REQUEST', 'Title, description, and startupId are required.');
            }
            const newItem = await startupStore.createBounty({
                id: 'bounty-' + crypto.randomUUID(),
                startupId,
                title,
                description,
                points: Number(points) || 10,
                reward: reward || '$100',
                status: 'open',
                submissions: []
            });
            broadcastEvent('bounty_created', newItem);
            res.json({ requestId: req.id, bounty: newItem });
        } catch (e) {
            next(e);
        }
    });

    // POST /api/bounties/:id/submit
    app.post('/api/bounties/:id/submit', auth, async (req, res, next) => {
        try {
            const { prLink, builderName } = req.body;
            if (!prLink) {
                throw new HttpError(400, 'BAD_REQUEST', 'PR or deployment URL is required.');
            }
            const list = await startupStore.listBounties();
            const bounty = list.find(b => b.id === req.params.id);
            if (!bounty) {
                throw new HttpError(404, 'NOT_FOUND', 'Bounty not found.');
            }
            bounty.status = 'completed';
            const submission = {
                id: 'sub-' + crypto.randomUUID(),
                prLink,
                builderName: builderName || req.user?.username || req.user?.email || 'Anonymous',
                submittedAt: new Date().toISOString()
            };
            
            // Re-save. Need a saveBounty or updateBounty method, but we can just use createBounty to upsert or add updateBounty.
            // Oh wait, createBounty in PgStartupStore uses INSERT without ON CONFLICT DO UPDATE.
            // Let's implement updateBounty or just use query directly for now if it's too complex.
            // Let's assume we can add updateBounty to startupStore next.
            // For now, let's just write this to be clean, and we will add updateBounty to startupStore.
            const updated = await startupStore.updateBounty(bounty.id, { status: bounty.status, submissions: [...(bounty.submissions || []), submission] });
            broadcastEvent('bounty_submitted', updated);
            res.json({ requestId: req.id, bounty: updated });
        } catch (e) {
            next(e);
        }
    });

    // POST /api/startups/:id/vouch
    app.post('/api/startups/:id/vouch', auth, async (req, res, next) => {
        try {
            const role = req.user.role || 'founder';
            if (role !== 'angel' && role !== 'vc') {
                throw new HttpError(403, 'UNAUTHORIZED', 'Only mentors and advisors can vouch for startups.');
            }
            const startupId = req.params.id;
            const startup = await startupStore.getStartup(startupId);
            if (!startup) {
                throw new HttpError(404, 'NOT_FOUND', 'Startup not found.');
            }
            startup.score = (startup.score || 10) + 25;
            await startupStore.updateStartup(startupId, startup);
            res.json({ requestId: req.id, startup });
        } catch (e) {
            next(e);
        }
    });

    // Get matching connection partners (Founders matching VCs/Angels, VCs matching Startups)
    app.get('/api/matching/partners', auth, async (req, res, next) => {
        try {
            const currentUserRole = req.user.role || 'founder';
            const usersState = await authStore.readState();
            let partners = [];

            // If user is founder, recommend VCs and Government institutions
            // If user is VC or Government, recommend Founders with active startups
            if (currentUserRole === 'founder') {
                const startups = await startupStore.listStartups({ limit: 100 });
                const myStartup = startups.find(s => s.ownerId === req.user.id || s.owner_id === req.user.id);

                partners = usersState.users
                    .filter(u => u.id !== req.user.id && (u.role === 'vc' || u.role === 'government'))
                    .map(u => {
                        const prof = u.workspaceProfile || {};
                        let score = 70;
                        let matchReason = '';

                        if (u.role === 'vc') {
                            const sectorsMatch = myStartup && prof.industry && prof.industry.toLowerCase().split(',').some(sec => myStartup.industry.toLowerCase().includes(sec.trim()));
                            const stageMatch = myStartup && prof.investmentStage && myStartup.stage.toLowerCase() === prof.investmentStage.toLowerCase();
                            const geoMatch = myStartup && prof.geography && prof.geography.toLowerCase() === myStartup.geography.toLowerCase();

                            if (sectorsMatch) score += 15;
                            if (stageMatch) score += 10;
                            if (geoMatch) score += 5;

                            matchReason = `${score}% alignment: Fits VC focus on ${prof.industry || 'Tech'} at ${prof.investmentStage || 'Early'} stage in ${prof.geography || 'Global'}.`;
                        } else {
                            // Government/Institution
                            const sectorsMatch = myStartup && prof.industry && prof.industry.toLowerCase().split(',').some(sec => myStartup.industry.toLowerCase().includes(sec.trim()));
                            const geoMatch = myStartup && prof.geography && prof.geography.toLowerCase() === myStartup.geography.toLowerCase();

                            if (sectorsMatch) score += 15;
                            if (geoMatch) score += 15;

                            matchReason = `${score}% alignment: Matches regional support program for ${prof.industry || 'Innovation'} in ${prof.geography || 'your region'}.`;
                        }

                        return {
                            id: u.id,
                            name: u.name,
                            email: u.email,
                            role: u.role,
                            matchReason
                        };
                    });
            } else {
                const startups = await startupStore.listStartups({ limit: 100 });
                const myProfile = req.user.workspaceProfile || {};

                partners = usersState.users
                    .filter(u => u.id !== req.user.id && u.role === 'founder')
                    .map(u => {
                        const startup = startups.find(s => s.ownerId === u.id || s.owner_id === u.id);
                        if (!startup) return null;

                        let score = 70;
                        let matchReason = '';

                        if (req.user.role === 'vc') {
                            const sectorsMatch = myProfile.industry && myProfile.industry.toLowerCase().split(',').some(sec => startup.industry.toLowerCase().includes(sec.trim()));
                            const stageMatch = myProfile.investmentStage && startup.stage.toLowerCase() === myProfile.investmentStage.toLowerCase();
                            const geoMatch = myProfile.geography && myProfile.geography.toLowerCase() === startup.geography.toLowerCase();

                            if (sectorsMatch) score += 15;
                            if (stageMatch) score += 10;
                            if (geoMatch) score += 5;

                            matchReason = `${score}% alignment: Fits your VC thesis in ${startup.industry} (${startup.stage}) located in ${startup.geography}.`;
                        } else {
                            // Government
                            const sectorsMatch = myProfile.industry && myProfile.industry.toLowerCase().split(',').some(sec => startup.industry.toLowerCase().includes(sec.trim()));
                            const geoMatch = myProfile.geography && myProfile.geography.toLowerCase() === startup.geography.toLowerCase();

                            if (sectorsMatch) score += 15;
                            if (geoMatch) score += 15;

                            matchReason = `${score}% alignment: Eligible for your sovereign program focusing on ${startup.industry} in ${startup.geography}.`;
                        }

                        return {
                            id: u.id,
                            name: u.name,
                            email: u.email,
                            role: u.role,
                            startup,
                            matchReason
                        };
                    })
                    .filter(p => p !== null);
            }

            res.json({ requestId: req.id, partners });
        } catch (error) {
            next(error);
        }
    });

    // Create match connection
    app.post('/api/matches', auth, async (req, res, next) => {
        try {
            const body = req.body || {};
            if (!body.receiverId) {
                throw new HttpError(400, 'MISSING_FIELD', 'Receiver ID is required.');
            }

            const match = {
                id: crypto.randomUUID(),
                senderId: req.user.id,
                receiverId: body.receiverId,
                status: body.status || 'pending'
            };

            const saved = await startupStore.createMatch(match);
            res.status(201).json({ requestId: req.id, match: saved });
        } catch (error) {
            next(error);
        }
    });

    // List matches
    app.get('/api/matches', auth, async (req, res, next) => {
        try {
            const matches = await startupStore.listMatches(req.user.id);
            res.json({ requestId: req.id, matches });
        } catch (error) {
            next(error);
        }
    });

    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });

    app.use((req, res, next) => {
        next(new HttpError(404, 'ROUTE_NOT_FOUND', 'Route not found.'));
    });

    app.use((err, req, res, next) => {
        if (err && err.type === 'entity.too.large') {
            err = new HttpError(413, 'REQUEST_TOO_LARGE', 'Request body is too large.');
        }

        const response = errorResponse(err, req.id);
        if (response.status >= 500) {
            logger.error(err.message || 'Unhandled error', {
                requestId: req.id,
                status: response.status,
                code: response.body.error.code,
                stack: err.stack
            });
        } else {
            logger.warn(err.message || 'Client request issue', {
                requestId: req.id,
                status: response.status,
                code: response.body.error.code
            });
        }
        res.status(response.status).json(response.body);
    });

    if (!options.disableBackgroundMonitor) {
        app.signalMonitor = startBackgroundSignalMonitor({
            authStore,
            reportStore,
            orchestrator,
            signalStore,
            logger,
            config: appConfig
        });
    } else {
        app.signalMonitor = {
            stop() {},
            runSweep: async () => {}
        };
    }

    if (!options.disableBackgroundMonitor) {
        app.realtimeSimulator = startBackgroundActivitySimulator({
            startupStore,
            signalStore,
            orchestrator,
            logger,
            broadcastEvent
        });
    } else {
        app.realtimeSimulator = {
            stop() {}
        };
    }

    return app;
}

async function createReport(req, res, next, services) {
    const { orchestrator, reportStore, startupStore, appConfig, logger, metrics } = services;
    const validation = validateAnalyzeRequest(req.body);

    if (!validation.ok) {
        return next(new HttpError(400, 'INVALID_ANALYSIS_REQUEST', 'Invalid analysis request.', validation.errors));
    }

    if (req.user && req.user.id && req.user.id !== 'api-token' && startupStore) {
        try {
            const startup = await startupStore.getStartupByOwner(req.user.id);
            if (startup) {
                const timeline = await startupStore.listTimeline(startup.id, { limit: 20 });
                const decisions = await startupStore.listDecisions(startup.id, { limit: 20 });
                validation.value.founderProfile.history = { timeline, decisions };
            }
        } catch (err) {
            logger.warn('Failed to fetch history for intelligence context', { error: err.message });
        }
    }

    try {
        const report = await withTimeout(
            orchestrator.processInquiry(validation.value.query, {
                sources: validation.value.sources,
                founderProfile: validation.value.founderProfile,
                reportOptions: validation.value.reportOptions
            }),
            appConfig.requestTimeoutMs
        );

        if (req.user && req.user.id && req.user.id !== 'api-token') {
            report.ownerId = req.user.id;
            if (startupStore && report.rawStrategy) {
                const startup = await startupStore.getStartupByOwner(req.user.id);
                if (startup) {
                    let updated = false;
                    if (typeof report.rawStrategy.validationScore === 'number') {
                        startup.validation_score = report.rawStrategy.validationScore;
                        updated = true;
                    }
                    if (typeof report.rawStrategy.riskScore === 'number') {
                        startup.score = 100 - report.rawStrategy.riskScore; // Inverting risk to get a general score
                        updated = true;
                    }
                    if (typeof report.rawStrategy.founderMarketFit === 'number') {
                        startup.founder_market_fit = report.rawStrategy.founderMarketFit;
                        updated = true;
                    }
                    if (report.rawExecution && typeof report.rawExecution.executionReadiness === 'number') {
                        startup.execution_readiness = report.rawExecution.executionReadiness;
                        updated = true;
                    }
                    if (report.rawExecution && typeof report.rawExecution.fundraisingReadiness === 'number') {
                        startup.fundraising_readiness = report.rawExecution.fundraisingReadiness;
                        updated = true;
                    }
                    if (updated) {
                        await startupStore.updateStartup(startup.id, startup);
                    }
                    
                    // Log to startup timeline
                    await startupStore.createTimelineEvent({
                        id: 'evt-' + crypto.randomUUID(),
                        startupId: startup.id,
                        actorId: req.user.id,
                        eventType: 'report',
                        title: 'Intelligence Report Generated',
                        description: `Generated AI report: "${report.title || 'Market Opportunity Brief'}".`,
                        metadata: { reportId: report.id, validationScore: report.rawStrategy?.validationScore }
                    });
                }
            }
        }

        await reportStore.save(report);
        metrics.recordReport(Date.now() - req.startedAt);
        logger.info('Report generated', {
            requestId: req.id,
            reportId: report.id,
            mode: report.mode,
            intelligenceMode: report.intelligenceMode,
            sourceCount: report.sources.length,
            durationMs: Date.now() - req.startedAt
        });

        return res.status(201).json({ requestId: req.id, report });
    } catch (error) {
        const timedOut = error && error.code === 'REQUEST_TIMEOUT';
        metrics.recordFailure(timedOut ? 'reportFailures' : 'reportFailures');

        if (timedOut) {
            return next(new HttpError(504, 'ANALYSIS_TIMEOUT', 'Analysis timed out. Try a narrower question or fewer sources.'));
        }

        return next(error);
    }
}

async function createReportStream(req, res, next, services) {
    const { orchestrator, reportStore, startupStore, appConfig, logger, metrics } = services;
    const validation = validateAnalyzeRequest(req.body);

    if (!validation.ok) {
        return next(new HttpError(400, 'INVALID_ANALYSIS_REQUEST', 'Invalid analysis request.', validation.errors));
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const sendSSE = (event, data) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    if (req.user && req.user.id && req.user.id !== 'api-token' && startupStore) {
        try {
            const startup = await startupStore.getStartupByOwner(req.user.id);
            if (startup) {
                const timeline = await startupStore.listTimeline(startup.id, { limit: 20 });
                const decisions = await startupStore.listDecisions(startup.id, { limit: 20 });
                validation.value.founderProfile.history = { timeline, decisions };
            }
        } catch (err) {
            logger.warn('Failed to fetch history for intelligence context', { error: err.message });
        }
    }

    try {
        const report = await withTimeout(
            orchestrator.processInquiryStream(validation.value.query, {
                sources: validation.value.sources,
                founderProfile: validation.value.founderProfile,
                reportOptions: validation.value.reportOptions
            }, (update) => {
                sendSSE(update.event, update.data);
            }),
            appConfig.requestTimeoutMs
        );

        if (req.user && req.user.id && req.user.id !== 'api-token') {
            report.ownerId = req.user.id;
            if (startupStore && report.rawStrategy) {
                const startup = await startupStore.getStartupByOwner(req.user.id);
                if (startup) {
                    let updated = false;
                    if (typeof report.rawStrategy.validationScore === 'number') {
                        startup.validation_score = report.rawStrategy.validationScore;
                        updated = true;
                    }
                    if (typeof report.rawStrategy.riskScore === 'number') {
                        startup.score = 100 - report.rawStrategy.riskScore; // Inverting risk to get a general score
                        updated = true;
                    }
                    if (typeof report.rawStrategy.founderMarketFit === 'number') {
                        startup.founder_market_fit = report.rawStrategy.founderMarketFit;
                        updated = true;
                    }
                    if (report.rawExecution && typeof report.rawExecution.executionReadiness === 'number') {
                        startup.execution_readiness = report.rawExecution.executionReadiness;
                        updated = true;
                    }
                    if (report.rawExecution && typeof report.rawExecution.fundraisingReadiness === 'number') {
                        startup.fundraising_readiness = report.rawExecution.fundraisingReadiness;
                        updated = true;
                    }
                    if (updated) {
                        await startupStore.updateStartup(startup.id, startup);
                    }

                    // Log to startup timeline
                    await startupStore.createTimelineEvent({
                        id: 'evt-' + crypto.randomUUID(),
                        startupId: startup.id,
                        actorId: req.user.id,
                        eventType: 'report',
                        title: 'Intelligence Report Generated',
                        description: `Generated AI report: "${report.title || 'Market Opportunity Brief'}".`,
                        metadata: { reportId: report.id, validationScore: report.rawStrategy?.validationScore }
                    });
                }
            }
        }

        await reportStore.save(report);
        metrics.recordReport(Date.now() - req.startedAt);
        logger.info('Report generated via stream', {
            requestId: req.id,
            reportId: report.id,
            mode: report.mode,
            intelligenceMode: report.intelligenceMode,
            sourceCount: report.sources.length,
            durationMs: Date.now() - req.startedAt
        });

        res.end();
    } catch (error) {
        const timedOut = error && error.code === 'REQUEST_TIMEOUT';
        metrics.recordFailure(timedOut ? 'reportFailures' : 'reportFailures');

        let status = 500;
        let errCode = 'INTERNAL_ERROR';
        let errMsg = error.message || 'Internal server error';

        if (timedOut) {
            status = 504;
            errCode = 'ANALYSIS_TIMEOUT';
            errMsg = 'Analysis timed out. Try a narrower question or fewer sources.';
        } else if (error instanceof HttpError) {
            status = error.status;
            errCode = error.code;
            errMsg = error.message;
        }

        sendSSE('error', { status, error: { code: errCode, message: errMsg } });
        res.end();
    }
}

function parseOrigins(value) {
    return getConfig({ CORS_ORIGINS: value }).corsOrigins;
}

function withTimeout(promise, timeoutMs) {
    let timer;
    const timeout = new Promise((resolve, reject) => {
        timer = setTimeout(() => {
            const error = new Error('Request timed out.');
            error.code = 'REQUEST_TIMEOUT';
            reject(error);
        }, timeoutMs);
    });

    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function isAllowedDevOrigin(origin, appConfig) {
    if (appConfig.nodeEnv === 'production') return false;

    try {
        const url = new URL(origin);
        return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
    } catch {
        return false;
    }
}

function getIntelligenceMode(orchestrator) {
    return orchestrator.searchProvider && orchestrator.searchProvider.enabled ? 'live_web' : 'demo_grounding';
}

function clampInt(value, min, max, fallback) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
}

function fallbackSimulate(scenarioText, cash, burn, revenue, growth) {
    const text = scenarioText.toLowerCase();
    const cashVal = Number(cash || 0);
    const burnVal = Number(burn || 0);
    const revVal = Number(revenue || 0);
    const growthVal = Number(growth || 0);
    let cashDelta = 0;
    let burnDelta = 0;
    let growthDelta = 0;
    let explanation = "Rule-based analysis applied.";

    // Helper to parse numbers like 500k, 1.5m, 2000
    const parseAmount = (str) => {
        const match = str.match(/(?:[\$\s]|^)(\d+(?:\.\d+)?)\s*(k|m|million|thousand)?/i);
        if (!match) return null;
        let val = parseFloat(match[1]);
        const unit = (match[2] || '').toLowerCase();
        if (unit === 'k' || unit === 'thousand') val *= 1000;
        if (unit === 'm' || unit === 'million') val *= 1000000;
        return val;
    };

    if (text.includes('hire') || text.includes('add') || text.includes('employ') || text.includes('recruit')) {
        // Extract numbers
        const words = text.split(/\s+/);
        let count = 1;
        for (let i = 0; i < words.length; i++) {
            const num = parseInt(words[i], 10);
            if (!isNaN(num) && num > 0) {
                count = num;
                break;
            }
        }
        
        let ratePerPerson = 5000; // default $5k/mo
        let growthPerPerson = 0;
        
        if (text.includes('dev') || text.includes('engineer') || text.includes('senior') || text.includes('programmer') || text.includes('tech')) {
            ratePerPerson = 10000; // devs are expensive
            explanation = `Hiring ${count} technical personnel increases monthly burn by $${(ratePerPerson * count).toLocaleString()}/month to accelerate product development.`;
        } else if (text.includes('marketing') || text.includes('sales') || text.includes('growth')) {
            ratePerPerson = 6000;
            growthPerPerson = 1.5;
            growthDelta = growthPerPerson * count;
            explanation = `Adding ${count} sales/marketing hires increases burn by $${(ratePerPerson * count).toLocaleString()}/month, projecting a +${growthDelta}% boost in monthly growth rate.`;
        } else {
            explanation = `Hiring ${count} team members increases monthly burn by $${(ratePerPerson * count).toLocaleString()}/month.`;
        }
        
        burnDelta = ratePerPerson * count;
    } else if (text.includes('raise') || text.includes('funding') || text.includes('invest') || text.includes('vc') || text.includes('capital') || text.includes('seed')) {
        const amount = parseAmount(text) || 250000; // default 250k
        cashDelta = amount;
        explanation = `Successfully securing $${amount.toLocaleString()} in new capital increases cash reserves, extending runway.`;
    } else if (text.includes('cut') || text.includes('reduce') || text.includes('lower') || text.includes('save') || text.includes('layoff') || text.includes('fire')) {
        let amount = parseAmount(text);
        if (!amount) {
            // Check if percentage
            const pctMatch = text.match(/(\d+)\s*%/);
            if (pctMatch) {
                const pct = parseInt(pctMatch[1], 10) / 100;
                amount = burnVal * pct;
            } else {
                amount = burnVal * 0.15; // default 15% cut
            }
        }
        
        burnDelta = -amount;
        if (text.includes('layoff') || text.includes('fire') || text.includes('staff') || text.includes('team')) {
            growthDelta = -1.0;
            explanation = `Reducing staff lowers monthly burn by $${amount.toLocaleString()}/month, but may impact short-term velocity (-1% growth rate impact).`;
        } else {
            explanation = `Cost reduction initiatives lower monthly burn by $${amount.toLocaleString()}/month, optimizing efficiency.`;
        }
    } else if (text.includes('launch') || text.includes('release') || text.includes('ship')) {
        growthDelta = 3.0;
        burnDelta = 1500;
        explanation = `Launching the product/feature boosts growth rate by +3% while incurring minor hosting/operational overhead ($1,500/mo).`;
    } else if (text.includes('rent') || text.includes('office') || text.includes('space')) {
        const amount = parseAmount(text) || 3000;
        if (text.includes('cut') || text.includes('reduce') || text.includes('downsize') || text.includes('leave') || text.includes('close')) {
            burnDelta = -amount;
            explanation = `Downsizing office space reduces monthly burn by $${amount.toLocaleString()}/month.`;
        } else {
            burnDelta = amount;
            explanation = `Acquiring office space increases monthly burn by $${amount.toLocaleString()}/month.`;
        }
    } else {
        // Generic fallback
        explanation = `Simulation analyzed: "${scenarioText}". Evaluated minimal financial delta under default conservative model parameters.`;
    }

    return {
        cashDelta,
        burnDelta,
        growthDelta,
        explanation
    };
}

function startBackgroundSignalMonitor({ authStore, reportStore, orchestrator, signalStore, logger, config }) {
    const intervalMs = config.nodeEnv === 'production' ? 60 * 60 * 1000 : 15 * 60 * 1000;
    
    async function runSweep() {
        logger.info('Starting background market signals monitoring sweep...');
        try {
            const state = await authStore.readState();
            const registeredUserIds = new Set((state.users || []).map(u => u.id));
            
            const reports = await reportStore.readAll();
            
            const sectorsMap = new Map();
            
            for (const report of reports) {
                if (report.ownerId && registeredUserIds.has(report.ownerId)) {
                    const profile = report.founderContext && report.founderContext.profile;
                    if (profile && profile.industry && profile.geography) {
                        const ind = profile.industry.trim();
                        const geo = profile.geography.trim();
                        const key = `${ind.toLowerCase()}_${geo.toLowerCase()}`;
                        if (!sectorsMap.has(key)) {
                            sectorsMap.set(key, {
                                industry: ind,
                                geography: geo,
                                targetCustomer: profile.targetCustomer || 'users'
                            });
                        }
                    }
                }
            }
            
            let sectors = Array.from(sectorsMap.values());
            if (sectors.length === 0) {
                sectors = [{
                    industry: 'consumer coffee',
                    geography: 'Bengaluru',
                    targetCustomer: 'urban professionals'
                }];
            }
            
            logger.info(`Sweeping signals for ${sectors.length} unique sectors...`);
            for (const sector of sectors) {
                try {
                    logger.info(`Generating signals for sector: ${sector.industry} (${sector.geography})`);
                    const result = await orchestrator.processSignals(sector);
                    await signalStore.saveSignals(sector.industry, sector.geography, result.signals, result.mode);
                    logger.info(`Cached signals for: ${sector.industry} (${sector.geography})`);
                } catch (err) {
                    logger.error(`Failed to generate/cache signals for sector: ${sector.industry} (${sector.geography})`, { error: err.message });
                }
            }
            logger.info('Background market signals sweep completed successfully.');
        } catch (err) {
            logger.error('Background market signals sweep failed', { error: err.message });
        }
    }
    
    const timeoutId = setTimeout(() => {
        runSweep().catch(err => logger.error('Error in initial signals sweep', { error: err.message }));
    }, 1000);
    
    const intervalId = setInterval(runSweep, intervalMs);
    return {
        stop() {
            clearTimeout(timeoutId);
            clearInterval(intervalId);
            logger.info('Background market signals monitor stopped.');
        },
        runSweep
    };
}

function startBackgroundActivitySimulator({ startupStore, signalStore, orchestrator, logger, broadcastEvent }) {
    const intervalMs = 25000;
    
    const NEWS_POOL = [
        "Stripe acquires Bridge for $1.1B to scale stablecoin payments globally.",
        "Perplexity AI raises $250M at an $8B valuation to accelerate search features.",
        "Mistral AI releases Codestral Mamba, a new 7B parameter open-weight model.",
        "Scale AI valuation reaches $13.8B after closing a $1B Series F round.",
        "Anthropic launches Claude 3.5 Sonnet, demonstrating state-of-the-art coding capabilities.",
        "Waymo raises $5.6B in Series C funding to expand autonomous robotaxi service areas.",
        "Vercel announces v0.dev enterprise version for automated UI system generation.",
        "X.AI raises $6B Series B to build massive GPU compute cluster Colossus.",
        "Liquid AI introduces Liquid Neural Networks for sequential time-series processing.",
        "Physical Intelligence raises $400M from Bezos and OpenAI to build universal robot brains."
    ];

    const STARTUPS = [
        { name: "Cognito AI", founder: "Akash" },
        { name: "BioFlow Labs", founder: "Priya" },
        { name: "FinGlide", founder: "Sarah" },
        { name: "AgriLedger", founder: "David" },
        { name: "CyberShield", founder: "Kenji" },
        { name: "HealthSync", founder: "Liam" }
    ];

    const MILESTONES = [
        "Shipped the first 3 lines of cold brew concentrates to 20 test users in Bengaluru today!",
        "Completed migrating cap table planner to use advisory lock protections. (+15 score)",
        "Logged v0.8.2 beta build for our clinical data processing pipeline. (+15 score)",
        "Onboarded 5 hospitals for our trial clinic portal in Mumbai.",
        "Finished UPI Auto-pay sandbox integration for subscription flows.",
        "Optimized Postgres vector similarity search indexes, cutting response times in half.",
        "Closed pilot deal with 3 mid-sized fintechs for real-time compliance audits.",
        "Launched the public alpha of our AI legal counsel assistant. 300 signups in 2 hours!",
        "Designed an automated runway simulator using Google Gemini 2.5."
    ];

    const BOUNTIES = [
        { title: "Optimize Postgres indexing for cap table queries", desc: "Our cap table query takes over 200ms on 10k rows. Optimize indices or optimize query structure.", pts: 20, reward: "$150" },
        { title: "Write a script to parse FDA medical target approvals", desc: "Need a simple node.js parser that calls openFDA and exports a CSV of drug targets.", pts: 30, reward: "$250" },
        { title: "Integrate TailwindCSS glassmorphism styling into onboarding modals", desc: "Refactor onboarding UI with premium backdrop-filters, custom borders and transitions.", pts: 15, reward: "$100" },
        { title: "Build an automated daily backlink tracker for SEO pages", desc: "Write a background cron job that fetches search console positions and maps backlinks.", pts: 25, reward: "$200" },
        { title: "Fix webpack module federation bug in dashboard builder", desc: "Resolve asynchronous chunk loading failures when pulling shared component chunks.", pts: 40, reward: "$300" }
    ];

    const SIGNALS = [
        { type: "COMPETITOR ALERT", title: "New competitor raises $8M Seed in Berlin", desc: "A Berlin-based competitor closed a seed round to build compliance automation. High sector pressure." },
        { type: "REGULATION ALERT", title: "Reserve Bank mandates strict recurring pay limits", desc: "New mandate requires multi-factor approval for all automated subscriptions above $200. High tech impact." },
        { type: "ECOSYSTEM ALERT", title: "Techstars launches new climate-fintech accelerator", desc: "A 3-month equity program in Singapore with $120k initial check. Applications open next week." },
        { type: "MARKET SHIFT", title: "Valuations in SaaS stabilize at 10-12x ARR", desc: "Recent public multiples indicate a market rebound for early-stage software startups raising Series A." }
    ];

    async function runSimulation() {
        try {
            const dice = Math.random();
            if (dice < 0.3) {
                const newsIdx = Math.floor(Math.random() * NEWS_POOL.length);
                const content = NEWS_POOL[newsIdx];
                const post = {
                    id: 'news-' + crypto.randomUUID(),
                    startupId: null,
                    authorId: 'system-news',
                    content,
                    type: 'launch',
                    metadata: { isSystemNews: true },
                    authorName: 'Ecosystem Wire'
                };
                await startupStore.createPost(post);
                broadcastEvent('post_created', {
                    ...post,
                    startupName: 'Global Ecosystem',
                    startupLogo: null,
                    authorName: 'Ecosystem Wire'
                });
                logger.info(`[Simulator] Broadcasted news update: ${content}`);
            } else if (dice < 0.6) {
                const st = STARTUPS[Math.floor(Math.random() * STARTUPS.length)];
                const ml = MILESTONES[Math.floor(Math.random() * MILESTONES.length)];
                const post = {
                    id: 'post-' + crypto.randomUUID(),
                    startupId: null,
                    authorId: 'simulated-' + st.founder.toLowerCase(),
                    content: ml,
                    type: Math.random() > 0.4 ? 'milestone' : 'update',
                    metadata: { isSimulated: true },
                    authorName: st.founder
                };
                await startupStore.createPost(post);
                broadcastEvent('post_created', {
                    ...post,
                    startupName: st.name,
                    startupLogo: null,
                    authorName: st.founder
                });
                logger.info(`[Simulator] Broadcasted founder milestone: ${st.founder} (${st.name})`);
            } else if (dice < 0.8) {
                const b = BOUNTIES[Math.floor(Math.random() * BOUNTIES.length)];
                const bounty = {
                    id: 'bounty-' + crypto.randomUUID(),
                    startupId: 'system-bounties',
                    title: b.title,
                    description: b.desc,
                    points: b.pts,
                    reward: b.reward,
                    status: 'open',
                    submissions: []
                };
                await startupStore.createBounty(bounty);
                broadcastEvent('bounty_created', bounty);
                logger.info(`[Simulator] Broadcasted new bounty: ${b.title}`);
            } else {
                const s = SIGNALS[Math.floor(Math.random() * SIGNALS.length)];
                const signal = {
                    type: s.type,
                    title: s.title,
                    description: s.desc,
                    impact: Math.random() > 0.5 ? 'High' : 'Medium',
                    sentiment: Math.random() > 0.5 ? 'Positive' : 'Negative',
                    source: { title: 'Ecosystem Wire', url: '#' }
                };
                broadcastEvent('signal_created', signal);
                logger.info(`[Simulator] Broadcasted market signal: ${s.title}`);
            }
        } catch (err) {
            logger.error('[Simulator] Simulation cycle failed:', err.message);
        }
    }

    const startupTimer = setTimeout(() => {
        runSimulation().catch(e => logger.error('Initial simulation run failed', e));
    }, 3000);

    const intervalId = setInterval(runSimulation, intervalMs);

    return {
        stop() {
            clearTimeout(startupTimer);
            clearInterval(intervalId);
            logger.info('Background activity simulator stopped.');
        }
    };
}

if (require.main === module) {
    const logger = createLogger({ env: config.nodeEnv });
    const app = createApp({ logger });
    const server = app.listen(config.port, () => {
        logger.info('BI Agent Network started', {
            port: config.port,
            env: config.nodeEnv,
            pid: process.pid,
            backend: USE_PG ? 'postgresql' : 'file',
            cache: USE_REDIS ? 'redis' : 'memory'
        });
    });

    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            logger.error(`Port ${config.port} is already in use. Set PORT to another value, for example PORT=3100 npm start.`);
            process.exit(1);
        }
        throw error;
    });

    const shutdown = async (signal) => {
        logger.info('Shutdown signal received', { signal, pid: process.pid });
        if (app.signalMonitor) app.signalMonitor.stop();
        if (app.realtimeSimulator) app.realtimeSimulator.stop();

        server.close(async () => {
            logger.info('HTTP server closed');
            // Drain connections
            try {
                if (USE_PG) {
                    const { closePool } = require('./lib/db/pool');
                    await closePool();
                }
                if (USE_REDIS) {
                    const { closeRedis } = require('./lib/cache/redis');
                    await closeRedis();
                }
            } catch (e) {
                logger.warn('Error during resource cleanup:', e.message);
            }
            logger.info('Cleanup complete. Exiting.');
            process.exit(0);
        });

        // Force exit if graceful shutdown takes too long
        setTimeout(() => process.exit(1), 15_000).unref();
    };

    // Cluster worker shutdown support
    process.on('message', (msg) => {
        if (msg === 'shutdown') shutdown('cluster');
        if (msg && msg.type === 'cluster_broadcast') {
            app.broadcastEvent(msg.eventType, msg.eventData, true);
        }
    });

    process.on('SIGINT',  () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}

module.exports = {
    createApp,
    parseOrigins,
    withTimeout,
    isAllowedDevOrigin,
    clampInt,
    startBackgroundSignalMonitor
};
