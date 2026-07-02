const crypto = require('crypto');
const https = require('https');
const { createClerkClient } = require('@clerk/backend');
const { createClient } = require('@supabase/supabase-js');

// Initialize Clerk client if secret key is present
let clerkClient = null;
if (process.env.CLERK_SECRET_KEY && process.env.CLERK_SECRET_KEY !== 'sk_test_placeholder') {
  try {
    clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  } catch (err) {
    console.error('Clerk Backend initialization error:', err.message);
  }
}

// Initialize Supabase client if keys are present
let supabase = null;
if (process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
  try {
    supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  } catch (err) {
    console.error('Supabase client initialization error:', err.message);
  }
}
const { HttpError } = require('./httpErrors');

const SESSION_COOKIE = 'stratify_session';

async function verifyClerkToken(token) {
    if (!token) return null;
    try {
        if (clerkClient) {
            // Verify Clerk token using Clerk SDK
            const decoded = await clerkClient.verifyToken(token);
            if (decoded) {
                return {
                    id: decoded.sub,
                    email: decoded.email || '',
                    name: decoded.name || decoded.email?.split('@')[0] || 'Clerk User',
                    username: decoded.username || decoded.email?.split('@')[0] || 'clerk_user',
                    emailVerified: true,
                    role: 'user'
                };
            }
        }
        return null;
    } catch (e) {
        console.warn('Clerk token verification error:', e);
        return null;
    }
}

async function verifySupabaseToken(token) {
    if (!token) return null;
    try {
        if (supabase) {
            // Verify token using Supabase client
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
        return null;
    } catch (e) {
        console.warn('Supabase token verification error:', e);
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

            // Check Authorization Header for Clerk or Supabase Token
            const authHeader = req.get('authorization') || '';
            if (authHeader.startsWith('Bearer ')) {
                const authToken = authHeader.substring(7).trim();
                
                // Try Clerk first, then Supabase
                let appUser = await verifyClerkToken(authToken);
                if (appUser) {
                    if (authService) {
                        await authService.syncExternalUser(appUser, 'clerk');
                    }
                    req.user = appUser;
                    req.authType = 'clerk';
                    return next();
                }

                appUser = await verifySupabaseToken(authToken);
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

            // Check Authorization Header for Clerk or Supabase Token
            const authHeader = req.get('authorization') || '';
            if (authHeader.startsWith('Bearer ')) {
                const authToken = authHeader.substring(7).trim();
                
                let appUser = await verifyClerkToken(authToken);
                if (appUser) {
                    if (authService) {
                        await authService.syncExternalUser(appUser, 'clerk');
                    }
                    req.user = appUser;
                    req.authType = 'clerk';
                    return next();
                }

                appUser = await verifySupabaseToken(authToken);
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
    verifyClerkToken,
    verifySupabaseToken
};
