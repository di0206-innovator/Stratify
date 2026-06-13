function getConfig(env = process.env) {
    const config = {
        port: Number(env.PORT || 3000),
        geminiApiKey: env.GEMINI_API_KEY || '',
        geminiModel: env.GEMINI_MODEL || 'gemini-2.5-flash',
        tavilyApiKey: env.TAVILY_API_KEY || '',
        apiAuthToken: env.API_AUTH_TOKEN || '',
        authStorePath: env.AUTH_STORE_PATH || '',
        sessionTtlMs: Number(env.SESSION_TTL_MS || 1000 * 60 * 60 * 24 * 7),
        emailVerificationTokenTtlMs: Number(env.EMAIL_VERIFICATION_TOKEN_TTL_MS || 1000 * 60 * 60 * 24),
        passwordResetTokenTtlMs: Number(env.PASSWORD_RESET_TOKEN_TTL_MS || 1000 * 60 * 30),
        loginRateLimitWindowMs: Number(env.LOGIN_RATE_LIMIT_WINDOW_MS || 1000 * 60 * 15),
        loginRateLimitMax: Number(env.LOGIN_RATE_LIMIT_MAX || 5),
        requireAuthForAnalyze: String(env.REQUIRE_AUTH_FOR_ANALYZE || 'false').toLowerCase() === 'true',
        corsOrigins: parseList(env.CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000'),
        jsonBodyLimit: env.JSON_BODY_LIMIT || '128kb',
        requestTimeoutMs: Number(env.REQUEST_TIMEOUT_MS || 300_000),
        rateLimitWindowMs: Number(env.RATE_LIMIT_WINDOW_MS || 60_000),
        rateLimitMax: Number(env.RATE_LIMIT_MAX || 20),
        reportStorePath: env.REPORT_STORE_PATH || '',
        signalStorePath: env.SIGNAL_STORE_PATH || '',
        maxStoredReports: Number(env.MAX_STORED_REPORTS || 500),
        firebaseProjectId: env.FIREBASE_PROJECT_ID || 'studio-9817976701-89717',
        nodeEnv: env.NODE_ENV || 'development'
    };

    validateConfig(config);
    return config;
}

function parseList(value) {
    return String(value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
}

function validateConfig(config) {
    const errors = [];

    if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
        errors.push('PORT must be a valid TCP port.');
    }

    if (!Number.isFinite(config.requestTimeoutMs) || config.requestTimeoutMs < 1000) {
        errors.push('REQUEST_TIMEOUT_MS must be at least 1000.');
    }

    if (!Number.isFinite(config.rateLimitWindowMs) || config.rateLimitWindowMs < 1000) {
        errors.push('RATE_LIMIT_WINDOW_MS must be at least 1000.');
    }

    if (!Number.isInteger(config.rateLimitMax) || config.rateLimitMax < 1) {
        errors.push('RATE_LIMIT_MAX must be a positive integer.');
    }

    if (!Number.isInteger(config.maxStoredReports) || config.maxStoredReports < 1) {
        errors.push('MAX_STORED_REPORTS must be a positive integer.');
    }

    [
        ['SESSION_TTL_MS', config.sessionTtlMs],
        ['EMAIL_VERIFICATION_TOKEN_TTL_MS', config.emailVerificationTokenTtlMs],
        ['PASSWORD_RESET_TOKEN_TTL_MS', config.passwordResetTokenTtlMs],
        ['LOGIN_RATE_LIMIT_WINDOW_MS', config.loginRateLimitWindowMs]
    ].forEach(([name, value]) => {
        if (!Number.isFinite(value) || value < 1000) {
            errors.push(`${name} must be at least 1000.`);
        }
    });

    if (!Number.isInteger(config.loginRateLimitMax) || config.loginRateLimitMax < 1) {
        errors.push('LOGIN_RATE_LIMIT_MAX must be a positive integer.');
    }

    if (config.nodeEnv === 'production' && config.corsOrigins.length === 0) {
        errors.push('CORS_ORIGINS must be set in production.');
    }

    if (errors.length) {
        const error = new Error(`Invalid configuration: ${errors.join(' ')}`);
        error.code = 'INVALID_CONFIG';
        error.details = errors;
        throw error;
    }
}

module.exports = { getConfig, parseList, validateConfig };
