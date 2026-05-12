function createRateLimiter({ windowMs = 60_000, max = 20 } = {}) {
    const hits = new Map();

    return function rateLimiter(req, res, next) {
        const now = Date.now();
        const key = req.ip || req.socket.remoteAddress || 'unknown';
        const record = hits.get(key) || { count: 0, resetAt: now + windowMs };

        if (now > record.resetAt) {
            record.count = 0;
            record.resetAt = now + windowMs;
        }

        record.count += 1;
        hits.set(key, record);

        res.setHeader('X-RateLimit-Limit', String(max));
        res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - record.count)));

        if (record.count > max) {
            return res.status(429).json({
                message: 'Too many requests. Please wait and try again.',
                error: {
                    code: 'RATE_LIMITED',
                    message: 'Too many requests. Please wait and try again.',
                    requestId: req.id
                }
            });
        }

        return next();
    };
}

module.exports = { createRateLimiter };
