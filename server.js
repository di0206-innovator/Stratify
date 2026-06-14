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
    readCookie
} = require('./lib/auth');
const { AuthService } = require('./lib/authService');
const { FileAuthStore } = require('./lib/authStore');
const { HttpError, errorResponse } = require('./lib/httpErrors');
const { createLogger } = require('./lib/logger');
const { createMetrics } = require('./lib/metrics');
const { FileReportStore } = require('./lib/reportStore');
const { FileSignalStore } = require('./lib/signalStore');

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
    const signalStore = options.signalStore || new FileSignalStore({
        filePath: appConfig.signalStorePath || path.join(__dirname, 'data', 'signals.json')
    });
    const authStore = options.authStore || new FileAuthStore({
        filePath: appConfig.authStorePath || path.join(__dirname, 'data', 'auth.json')
    });
    const authService = options.authService || new AuthService({
        store: authStore,
        config: appConfig,
        logger
    });
    const auth = createAuthMiddleware({ token: appConfig.apiAuthToken, authService, firebaseProjectId: appConfig.firebaseProjectId });
    const optionalAuth = createOptionalAuthMiddleware({ token: appConfig.apiAuthToken, authService, firebaseProjectId: appConfig.firebaseProjectId });
    const analyzeLimiter = createRateLimiter({
        windowMs: appConfig.rateLimitWindowMs,
        max: appConfig.rateLimitMax
    });
    const loginLimiter = createRateLimiter({
        windowMs: appConfig.loginRateLimitWindowMs,
        max: appConfig.loginRateLimitMax
    });

    app.disable('x-powered-by');
    app.set('trust proxy', true);
    app.use(compression());
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
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
    app.use(express.static(path.join(__dirname, 'dist')));

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
            await signalStore.init();
            res.json({
                ok: true,
                requestId: req.id,
                dependencies: {
                    reportStore: 'ready',
                    authStore: 'ready',
                    signalStore: 'ready',
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
                isFirebase: !!u.isFirebase
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
        createReport(req, res, next, { orchestrator, reportStore, appConfig, logger, metrics });
    });

    app.post('/api/analyze', optionalAuth, analyzeLimiter, (req, res, next) => {
        if (appConfig.requireAuthForAnalyze && !req.user) {
            return next(new HttpError(401, 'UNAUTHORIZED', 'Authentication is required.'));
        }
        createReport(req, res, next, { orchestrator, reportStore, appConfig, logger, metrics });
    });

    app.post('/api/analyze/stream', optionalAuth, analyzeLimiter, (req, res, next) => {
        if (appConfig.requireAuthForAnalyze && !req.user) {
            return next(new HttpError(401, 'UNAUTHORIZED', 'Authentication is required.'));
        }
        createReportStream(req, res, next, { orchestrator, reportStore, appConfig, logger, metrics });
    });

    app.post('/api/signals', optionalAuth, async (req, res, next) => {
        try {
            const profile = normalizeFounderProfile(req.body && req.body.founderProfile);
            if (!profile.industry || !profile.geography) {
                throw new HttpError(400, 'INVALID_PROFILE', 'Industry and geography are required for market signals.');
            }

            const cached = await signalStore.getSignals(profile.industry, profile.geography);
            if (cached) {
                return res.json({
                    requestId: req.id,
                    signals: cached.signals,
                    mode: cached.mode
                });
            }

            const result = await orchestrator.processSignals(profile);
            await signalStore.saveSignals(profile.industry, profile.geography, result.signals, result.mode);

            res.json({
                requestId: req.id,
                signals: result.signals,
                mode: result.mode
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

async function createReportStream(req, res, next, services) {
    const { orchestrator, reportStore, appConfig, logger, metrics } = services;
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
        if (app.signalMonitor) {
            app.signalMonitor.stop();
        }
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
    clampInt,
    startBackgroundSignalMonitor
};
