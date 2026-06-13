const crypto = require('crypto');
const https = require('https');
const { HttpError } = require('./httpErrors');

const SESSION_COOKIE = 'neuralbi_session';

let cachedCerts = null;
let certsExpiresAt = 0;

function fetchGoogleCerts() {
    return new Promise((resolve, reject) => {
        https.get('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com', (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const certs = JSON.parse(data);
                    const cacheControl = res.headers['cache-control'] || '';
                    const match = cacheControl.match(/max-age=(\d+)/);
                    const maxAge = match ? parseInt(match[1], 10) * 1000 : 3600 * 1000;
                    
                    cachedCerts = certs;
                    certsExpiresAt = Date.now() + maxAge;
                    resolve(certs);
                } catch (e) {
                    reject(new Error('Failed to parse Google certificates: ' + e.message));
                }
            });
        }).on('error', reject);
    });
}

async function getGoogleCert(kid) {
    if (!cachedCerts || Date.now() > certsExpiresAt) {
        await fetchGoogleCerts().catch(err => {
            console.error('Error fetching Google certificates:', err);
        });
    }
    if (cachedCerts && cachedCerts[kid]) {
        return cachedCerts[kid];
    }
    await fetchGoogleCerts().catch(() => {});
    return cachedCerts ? cachedCerts[kid] : null;
}

function base64urlDecode(str) {
    return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

async function verifyFirebaseToken(token, firebaseProjectId) {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    try {
        const header = JSON.parse(base64urlDecode(parts[0]));
        const payload = JSON.parse(base64urlDecode(parts[1]));

        if (header.alg !== 'RS256' || !header.kid) return null;

        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
            console.warn('Firebase ID Token is expired.');
            return null;
        }

        const expectedIss = `https://securetoken.google.com/${firebaseProjectId}`;
        if (payload.iss !== expectedIss) {
            console.warn('Firebase Token Issuer mismatch:', payload.iss, 'expected:', expectedIss);
            return null;
        }

        if (payload.aud !== firebaseProjectId) {
            console.warn('Firebase Token Audience mismatch:', payload.aud, 'expected:', firebaseProjectId);
            return null;
        }

        const cert = await getGoogleCert(header.kid);
        if (!cert) {
            console.warn('Google certificate not found for kid:', header.kid);
            return null;
        }

        const isValid = crypto.verify(
            'sha256',
            Buffer.from(parts[0] + '.' + parts[1]),
            cert,
            Buffer.from(parts[2], 'base64url')
        );

        if (!isValid) {
            console.warn('Firebase Token signature verification failed.');
            return null;
        }

        return {
            id: payload.sub,
            email: payload.email || '',
            name: payload.name || payload.email?.split('@')[0] || 'Firebase User',
            username: payload.name || payload.email?.split('@')[0] || 'firebase_user',
            emailVerified: !!payload.email_verified,
            role: 'user'
        };
    } catch (e) {
        console.error('Error parsing/verifying Firebase ID Token:', e);
        return null;
    }
}

function createAuthMiddleware({ token, authService, firebaseProjectId } = {}) {
    return async function authMiddleware(req, res, next) {
        try {
            const apiUser = authenticateApiToken(req, token);
            if (apiUser) {
                req.user = apiUser;
                req.authType = 'api_token';
                return next();
            }

            // Check Firebase Authentication Header
            const authHeader = req.get('authorization') || '';
            if (authHeader.startsWith('Bearer ')) {
                const firebaseToken = authHeader.substring(7).trim();
                const pId = firebaseProjectId || 'studio-9817976701-89717';
                const firebaseUser = await verifyFirebaseToken(firebaseToken, pId);
                if (firebaseUser) {
                    req.user = firebaseUser;
                    req.authType = 'firebase';
                    return next();
                }
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

function createOptionalAuthMiddleware({ token, authService, firebaseProjectId } = {}) {
    return async function optionalAuthMiddleware(req, res, next) {
        try {
            const apiUser = authenticateApiToken(req, token);
            if (apiUser) {
                req.user = apiUser;
                req.authType = 'api_token';
                return next();
            }

            // Check Firebase Authentication Header
            const authHeader = req.get('authorization') || '';
            if (authHeader.startsWith('Bearer ')) {
                const firebaseToken = authHeader.substring(7).trim();
                const pId = firebaseProjectId || 'studio-9817976701-89717';
                const firebaseUser = await verifyFirebaseToken(firebaseToken, pId);
                if (firebaseUser) {
                    req.user = firebaseUser;
                    req.authType = 'firebase';
                    return next();
                }
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
    readCookie,
    verifyFirebaseToken
};
