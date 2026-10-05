const crypto = require('crypto');
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client if keys are present
let supabase = null;
const sbUrl = process.env.VITE_SUPABASE_URL || (process.env.NODE_ENV !== 'test' ? 'https://kekoeliybtqrhgxazfhz.supabase.co' : null);
const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || (process.env.NODE_ENV !== 'test' ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtla29lbGl5YnRxcmhneGF6Zmh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzA4ODcxNywiZXhwIjoyMDk4NjY0NzE3fQ.6b_tauplpstYLp64jQ3XWpTrY31QsQK8ka_2DVcPkv0' : null);

if (sbUrl && sbKey && sbUrl !== 'https://placeholder.supabase.co') {
  try {
    supabase = createClient(sbUrl, sbKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  } catch (err) {
    console.error('Supabase client initialization error:', err.message);
  }
}
const { HttpError } = require('./httpErrors');

const SESSION_COOKIE = 'stratify_session';

async function verifySupabaseToken(token) {
    if (!token || typeof token !== 'string') return null;
    try {
        if (supabase) {
            // Verify token using Supabase client (authoritative, verified)
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (error) throw error;
            if (user) {
                return {
                    id: user.id,
                    email: user.email || '',
                    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Supabase User',
                    username: user.user_metadata?.username || user.email?.split('@')[0] || 'supabase_user',
                    emailVerified: !!user.email_confirmed_at,
                    role: 'user'
                };
            }
        }

        // Cryptographically verify signature if SUPABASE_JWT_SECRET is configured
        const jwtSecret = process.env.SUPABASE_JWT_SECRET;
        if (jwtSecret) {
            const parts = token.split('.');
            if (parts.length === 3) {
                const [headerB64, payloadB64, signatureB64] = parts;
                const expectedSignature = crypto
                    .createHmac('sha256', jwtSecret)
                    .update(`${headerB64}.${payloadB64}`)
                    .digest('base64url');

                const sigBuf = Buffer.from(signatureB64);
                const expBuf = Buffer.from(expectedSignature);
                if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
                    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
                    const now = Math.floor(Date.now() / 1000);
                    if (payload.sub && payload.exp && payload.exp > now) {
                        return {
                            id: payload.sub,
                            email: payload.email || '',
                            name: payload.user_metadata?.full_name || payload.email?.split('@')[0] || 'User',
                            username: payload.user_metadata?.username || payload.email?.split('@')[0] || 'user',
                            emailVerified: !!payload.email_confirmed_at,
                            role: 'user'
                        };
                    }
                }
            }
        }
        return null;
    } catch (e) {
        console.warn('Supabase token verification error:', e?.message || e);
        return null;
    }
}



function createAuthMiddleware({ token, authService } = {}) {
    return async function authMiddleware(req, res, next) {
        try {
            const apiUser = authenticateApiToken(req, token);
            if (apiUser) {
                req.user = apiUser;
                req.authType = 'api_token';
                return next();
            }

            // Check Authorization Header for Supabase Token
            const authHeader = req.get('authorization') || '';
            if (authHeader.startsWith('Bearer ')) {
                const authToken = authHeader.substring(7).trim();
                
                const appUser = await verifySupabaseToken(authToken);
                if (appUser) {
                    if (authService) {
                        await authService.syncExternalUser(appUser, 'supabase');
                    }
                    req.user = appUser;
                    req.authType = 'supabase';
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

function createOptionalAuthMiddleware({ token, authService } = {}) {
    return async function optionalAuthMiddleware(req, res, next) {
        try {
            const apiUser = authenticateApiToken(req, token);
            if (apiUser) {
                req.user = apiUser;
                req.authType = 'api_token';
                return next();
            }

            // Check Authorization Header for Supabase Token
            const authHeader = req.get('authorization') || '';
            if (authHeader.startsWith('Bearer ')) {
                const authToken = authHeader.substring(7).trim();
                
                const appUser = await verifySupabaseToken(authToken);
                if (appUser) {
                    if (authService) {
                        await authService.syncExternalUser(appUser, 'supabase');
                    }
                    req.user = appUser;
                    req.authType = 'supabase';
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
    if (!header.startsWith('Bearer ')) return null;
    const clientToken = header.substring(7).trim();

    // Prevent timing side-channel attacks by comparing hashes of identical length in constant-time
    const expectedHash = crypto.createHash('sha256').update(token).digest();
    const clientHash = crypto.createHash('sha256').update(clientToken).digest();

    if (expectedHash.length !== clientHash.length) return null;
    if (!crypto.timingSafeEqual(expectedHash, clientHash)) return null;

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
    verifySupabaseToken
};
