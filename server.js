require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const crypto = require('crypto');
const { GeminiBIOrchestrator } = require('./GEMINI_ORCHESTRATOR');
const { validateAnalyzeRequest } = require('./lib/validation');
const { createRateLimiter } = require('./lib/rateLimit');
const { getConfig } = require('./lib/config');
const {
    createAuthMiddleware,
    createOptionalAuthMiddleware,
    setSessionCookie,
    clearSessionCookie,
    readCookie
} = require('./lib/auth');
const { AuthService } = require('./lib/authService');
const { FileAuthStore } = require('./lib/authStore');
const { HttpError, errorResponse } = require('./lib/httpErrors');
const { createLogger } = require('./lib/logger');
const { createMetrics } = require('./lib/metrics');
const { FileReportStore } = require('./lib/reportStore');

const config = getConfig();

function createApp(options = {}) {
    const app = express();
    const appConfig = options.config || config;
    const logger = options.logger || createLogger({ env: appConfig.nodeEnv });
    const metrics = options.metrics || createMetrics();
    const orchestrator = options.orchestrator || new GeminiBIOrchestrator({
        apiKey: appConfig.geminiApiKey,
        modelName: appConfig.geminiModel,
        tavilyApiKey: appConfig.tavilyApiKey
    });
    const reportStore = options.reportStore || new FileReportStore({
        filePath: appConfig.reportStorePath || path.join(__dirname, 'data', 'reports.json'),
        maxReports: appConfig.maxStoredReports
    });
    const authStore = options.authStore || new FileAuthStore({
        filePath: appConfig.authStorePath || path.join(__dirname, 'data', 'auth.json')
    });
    const authService = options.authService || new AuthService({
        store: authStore,
        config: appConfig,
        logger
    });
    const auth = createAuthMiddleware({ token: appConfig.apiAuthToken, authService });
    const optionalAuth = createOptionalAuthMiddleware({ token: appConfig.apiAuthToken, authService });
    const analyzeLimiter = createRateLimiter({
        windowMs: appConfig.rateLimitWindowMs,
        max: appConfig.rateLimitMax
    });
    const loginLimiter = createRateLimiter({
        windowMs: appConfig.loginRateLimitWindowMs,
        max: appConfig.loginRateLimitMax
    });

    app.disable('x-powered-by');
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
                styleSrc: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'"]
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

    app.use(cors({
        origin(origin, callback) {
            if (!origin || appConfig.corsOrigins.includes(origin) || isAllowedDevOrigin(origin, appConfig)) {
                return callback(null, true);
            }

            return callback(new HttpError(403, 'CORS_ORIGIN_DENIED', 'Origin is not allowed by CORS.'));
        }
    }));

    app.use(express.json({ limit: appConfig.jsonBodyLimit }));
    app.use(express.static(path.join(__dirname, 'public')));

    app.get('/api/health', (req, res) => {
        res.json({
            ok: true,
            service: 'neuralbi-api',
            requestId: req.id,
            mode: orchestrator.mode,
            model: orchestrator.modelName || 'demo',
            intelligenceMode: getIntelligenceMode(orchestrator)
        });
    });

    app.get('/api/ready', async (req, res, next) => {
        try {
            await reportStore.init();
            await authStore.init();
            res.json({
                ok: true,
                requestId: req.id,
                dependencies: {
                    reportStore: 'ready',
                    authStore: 'ready',
                    gemini: orchestrator.mode === 'live' ? 'configured' : 'demo',
                    intelligence: getIntelligenceMode(orchestrator)
                }
            });
        } catch (error) {
            next(new HttpError(503, 'NOT_READY', 'Service dependencies are not ready.', { cause: error.message }));
        }
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
            await authService.logout(readCookie(req, 'neuralbi_session'));
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

    app.post('/api/reports', auth, analyzeLimiter, (req, res, next) => {
        createReport(req, res, next, { orchestrator, reportStore, appConfig, logger, metrics });
    });

    app.post('/api/analyze', optionalAuth, analyzeLimiter, (req, res, next) => {
        if (appConfig.requireAuthForAnalyze && !req.user) {
            return next(new HttpError(401, 'UNAUTHORIZED', 'Authentication is required.'));
        }
        createReport(req, res, next, { orchestrator, reportStore, appConfig, logger, metrics });
    });

    app.use((req, res, next) => {
        next(new HttpError(404, 'ROUTE_NOT_FOUND', 'Route not found.'));
    });

    app.use((err, req, res, next) => {
        if (err && err.type === 'entity.too.large') {
            err = new HttpError(413, 'REQUEST_TOO_LARGE', 'Request body is too large.');
        }

        const response = errorResponse(err, req.id);
        logger.error(err.message || 'Unhandled error', {
            requestId: req.id,
            status: response.status,
            code: response.body.error.code,
            stack: err.stack
        });
        res.status(response.status).json(response.body);
    });

    return app;
}

async function createReport(req, res, next, services) {
    const { orchestrator, reportStore, appConfig, logger, metrics } = services;
    const validation = validateAnalyzeRequest(req.body);

    if (!validation.ok) {
        return next(new HttpError(400, 'INVALID_ANALYSIS_REQUEST', 'Invalid analysis request.', validation.errors));
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

if (require.main === module) {
    const logger = createLogger({ env: config.nodeEnv });
    const app = createApp({ logger });
    const server = app.listen(config.port, () => {
        logger.info('BI Agent Network started', { port: config.port, env: config.nodeEnv });
    });

    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            logger.error(`Port ${config.port} is already in use. Set PORT to another value, for example PORT=3100 npm start.`);
            process.exit(1);
        }

        throw error;
    });

    const shutdown = (signal) => {
        logger.info('Shutdown signal received', { signal });
        server.close(() => {
            logger.info('HTTP server closed');
            process.exit(0);
        });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

module.exports = {
    createApp,
    parseOrigins,
    withTimeout,
    isAllowedDevOrigin,
    clampInt
};
