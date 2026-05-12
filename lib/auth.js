const { HttpError } = require('./httpErrors');

const SESSION_COOKIE = 'neuralbi_session';

function createAuthMiddleware({ token, authService } = {}) {
    return async function authMiddleware(req, res, next) {
        try {
            const apiUser = authenticateApiToken(req, token);
            if (apiUser) {
                req.user = apiUser;
                req.authType = 'api_token';
                return next();
            }

            if (authService) {
                const sessionToken = readCookie(req, SESSION_COOKIE);
                const sessionAuth = await authService.authenticateSession(sessionToken);
                if (sessionAuth) {
                    req.user = sessionAuth.user;
                    req.session = sessionAuth.session;
                    req.authType = 'session';
                    return next();
                }
            }

            return next(new HttpError(401, 'UNAUTHORIZED', 'Authentication is required.'));
        } catch (error) {
            return next(error);
        }
    };
}

function createOptionalAuthMiddleware({ token, authService } = {}) {
    return async function optionalAuthMiddleware(req, res, next) {
        try {
            const apiUser = authenticateApiToken(req, token);
            if (apiUser) {
                req.user = apiUser;
                req.authType = 'api_token';
                return next();
            }

            if (authService) {
                const sessionToken = readCookie(req, SESSION_COOKIE);
                const sessionAuth = await authService.authenticateSession(sessionToken);
                if (sessionAuth) {
                    req.user = sessionAuth.user;
                    req.session = sessionAuth.session;
                    req.authType = 'session';
                }
            }

            return next();
        } catch (error) {
            return next(error);
        }
    };
}

function authenticateApiToken(req, token) {
    if (!token) return null;
    const header = req.get('authorization') || '';
    if (header !== `Bearer ${token}`) return null;
    return {
        id: 'api-token',
        email: 'api-token@system.local',
        name: 'API Token',
        emailVerified: true,
        role: 'system'
    };
}

function setSessionCookie(res, rawToken, expiresAt, config) {
    const maxAgeSeconds = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
    const secure = config.nodeEnv === 'production';
    const parts = [
        `${SESSION_COOKIE}=${encodeURIComponent(rawToken)}`,
        'HttpOnly',
        'Path=/',
        'SameSite=Lax',
        `Max-Age=${maxAgeSeconds}`,
        `Expires=${new Date(expiresAt).toUTCString()}`
    ];

    if (secure) parts.push('Secure');
    res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(res, config) {
    const parts = [
        `${SESSION_COOKIE}=`,
        'HttpOnly',
        'Path=/',
        'SameSite=Lax',
        'Max-Age=0',
        'Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    ];
    if (config.nodeEnv === 'production') parts.push('Secure');
    res.setHeader('Set-Cookie', parts.join('; '));
}

function readCookie(req, name) {
    const header = req.get('cookie') || '';
    const cookie = header
        .split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith(`${name}=`));

    if (!cookie) return '';
    return decodeURIComponent(cookie.slice(name.length + 1));
}

module.exports = {
    SESSION_COOKIE,
    createAuthMiddleware,
    createOptionalAuthMiddleware,
    setSessionCookie,
    clearSessionCookie,
    readCookie
};
