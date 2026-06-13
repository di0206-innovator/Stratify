const crypto = require('crypto');
const { HttpError } = require('./httpErrors');
const { hashPassword, verifyPassword, validatePasswordStrength } = require('./security/passwords');
const { createSecretToken, hashToken, addMs, isExpired } = require('./security/tokens');

const TOKEN_TYPES = {
    EMAIL_VERIFICATION: 'email_verification',
    PASSWORD_RESET: 'password_reset'
};

class AuthService {
    constructor({ store, config, logger } = {}) {
        this.store = store;
        this.config = config;
        this.logger = logger || { info() {}, warn() {}, error() {} };
    }

    async register({ email, password, name, username }) {
        const actualName = name || username;
        const normalizedEmail = normalizeEmail(email);
        assertEmail(normalizedEmail);
        assertName(actualName);
        assertPassword(password);

        const existing = await this.findUserByEmail(normalizedEmail);
        if (existing) {
            throw new HttpError(409, 'EMAIL_ALREADY_REGISTERED', 'A user with this email already exists.');
        }

        const passwordHash = await hashPassword(password);
        const user = {
            id: crypto.randomUUID(),
            email: normalizedEmail,
            name: String(actualName).trim(),
            passwordHash,
            emailVerified: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const token = createSecretToken();
        const tokenRecord = createTokenRecord(user.id, TOKEN_TYPES.EMAIL_VERIFICATION, token, this.config.emailVerificationTokenTtlMs);

        await this.store.update((state) => {
            state.users.push(user);
            state.tokens.push(tokenRecord);
            state.emailOutbox.push(createOutboxEmail({
                to: user.email,
                type: TOKEN_TYPES.EMAIL_VERIFICATION,
                subject: 'Verify your NeuralBI email',
                token,
                expiresAt: tokenRecord.expiresAt
            }));
        });

        this.logger.info('User registered; verification email queued', { userId: user.id });
        return sanitizeUser(user);
    }

    async verifyEmail(token) {
        const tokenHash = hashToken(token);
        let verifiedUser;

        await this.store.update((state) => {
            const record = state.tokens.find((item) => item.type === TOKEN_TYPES.EMAIL_VERIFICATION && item.tokenHash === tokenHash && !item.usedAt);
            if (!record || isExpired(record.expiresAt)) {
                throw new HttpError(400, 'INVALID_OR_EXPIRED_TOKEN', 'Email verification token is invalid or expired.');
            }

            const user = state.users.find((item) => item.id === record.userId);
            if (!user) {
                throw new HttpError(400, 'INVALID_OR_EXPIRED_TOKEN', 'Email verification token is invalid or expired.');
            }

            user.emailVerified = true;
            user.updatedAt = new Date().toISOString();
            record.usedAt = new Date().toISOString();
            verifiedUser = sanitizeUser(user);
        });

        return verifiedUser;
    }

    async login({ email, password, userAgent, ip }) {
        const normalizedEmail = normalizeEmail(email);
        assertEmail(normalizedEmail);
        const user = await this.findUserByEmail(normalizedEmail);
        const validPassword = user ? await verifyPassword(String(password || ''), user.passwordHash) : false;

        if (!user || !validPassword) {
            throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
        }

        if (!user.emailVerified) {
            throw new HttpError(403, 'EMAIL_NOT_VERIFIED', 'Verify your email before signing in.');
        }

        const rawSessionToken = createSecretToken();
        const session = {
            id: crypto.randomUUID(),
            userId: user.id,
            tokenHash: hashToken(rawSessionToken),
            userAgent: String(userAgent || '').slice(0, 300),
            ip: String(ip || '').slice(0, 80),
            createdAt: new Date().toISOString(),
            expiresAt: addMs(this.config.sessionTtlMs)
        };

        await this.store.update((state) => {
            pruneExpired(state);
            state.sessions.push(session);
        });

        return {
            sessionToken: rawSessionToken,
            session: { id: session.id, expiresAt: session.expiresAt },
            user: sanitizeUser(user)
        };
    }

    async authenticateSession(rawToken) {
        if (!rawToken) return null;
        const tokenHash = hashToken(rawToken);
        const state = await this.store.readState();
        const session = state.sessions.find((item) => item.tokenHash === tokenHash);
        if (!session || isExpired(session.expiresAt)) return null;
        const user = state.users.find((item) => item.id === session.userId);
        if (!user || !user.emailVerified) return null;
        return {
            user: sanitizeUser(user),
            session: {
                id: session.id,
                expiresAt: session.expiresAt
            }
        };
    }

    async logout(rawToken) {
        if (!rawToken) return;
        const tokenHash = hashToken(rawToken);
        await this.store.update((state) => {
            state.sessions = state.sessions.filter((session) => session.tokenHash !== tokenHash);
        });
    }

    async requestPasswordReset(email) {
        const normalizedEmail = normalizeEmail(email);
        if (!normalizedEmail) return;

        const user = await this.findUserByEmail(normalizedEmail);
        if (!user) return;

        const token = createSecretToken();
        const tokenRecord = createTokenRecord(user.id, TOKEN_TYPES.PASSWORD_RESET, token, this.config.passwordResetTokenTtlMs);

        await this.store.update((state) => {
            state.tokens.push(tokenRecord);
            state.emailOutbox.push(createOutboxEmail({
                to: user.email,
                type: TOKEN_TYPES.PASSWORD_RESET,
                subject: 'Reset your NeuralBI password',
                token,
                expiresAt: tokenRecord.expiresAt
            }));
        });
    }

    async resetPassword({ token, password }) {
        assertPassword(password);
        const tokenHash = hashToken(token);
        const passwordHash = await hashPassword(password);
        let updatedUser;

        await this.store.update((state) => {
            const record = state.tokens.find((item) => item.type === TOKEN_TYPES.PASSWORD_RESET && item.tokenHash === tokenHash && !item.usedAt);
            if (!record || isExpired(record.expiresAt)) {
                throw new HttpError(400, 'INVALID_OR_EXPIRED_TOKEN', 'Password reset token is invalid or expired.');
            }

            const user = state.users.find((item) => item.id === record.userId);
            if (!user) {
                throw new HttpError(400, 'INVALID_OR_EXPIRED_TOKEN', 'Password reset token is invalid or expired.');
            }

            user.passwordHash = passwordHash;
            user.updatedAt = new Date().toISOString();
            record.usedAt = new Date().toISOString();
            state.sessions = state.sessions.filter((session) => session.userId !== user.id);
            updatedUser = sanitizeUser(user);
        });

        return updatedUser;
    }

    async findUserByEmail(email) {
        const state = await this.store.readState();
        return state.users.find((user) => user.email === normalizeEmail(email)) || null;
    }
}

function createTokenRecord(userId, type, rawToken, ttlMs) {
    return {
        id: crypto.randomUUID(),
        userId,
        type,
        tokenHash: hashToken(rawToken),
        createdAt: new Date().toISOString(),
        expiresAt: addMs(ttlMs),
        usedAt: null
    };
}

function createOutboxEmail({ to, type, subject, token, expiresAt }) {
    return {
        id: crypto.randomUUID(),
        to,
        type,
        subject,
        token,
        expiresAt,
        createdAt: new Date().toISOString()
    };
}

function pruneExpired(state) {
    state.sessions = state.sessions.filter((session) => !isExpired(session.expiresAt));
    state.tokens = state.tokens.filter((token) => !token.usedAt && !isExpired(token.expiresAt));
}

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function assertEmail(email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new HttpError(400, 'INVALID_EMAIL', 'A valid email address is required.');
    }
}

function assertName(name) {
    if (String(name || '').trim().length < 2) {
        throw new HttpError(400, 'INVALID_NAME', 'Name must be at least 2 characters.');
    }
}

function assertPassword(password) {
    const errors = validatePasswordStrength(password);
    if (errors.length) {
        throw new HttpError(400, 'WEAK_PASSWORD', 'Password does not meet security requirements.', errors);
    }
}

function sanitizeUser(user) {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.name,
        emailVerified: Boolean(user.emailVerified),
        createdAt: user.createdAt
    };
}

module.exports = {
    AuthService,
    TOKEN_TYPES,
    sanitizeUser
};
