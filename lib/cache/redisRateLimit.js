/**
 * Redis Sliding-Window Rate Limiter
 *
 * Algorithm: Sliding-window log using Redis Sorted Sets.
 *
 * For each IP + window pair:
 *   ZADD rl:{key}:{window} <timestamp> <unique-id>
 *   ZREMRANGEBYSCORE rl:{key}:{window} -inf <windowStart>
 *   ZCARD rl:{key}:{window}
 *
 * This gives an exact count of requests in the sliding window.
 * Atomic via Lua script (no race conditions between cluster workers).
 *
 * Falls back to the in-memory rate limiter when Redis is unavailable.
 */

const { createRateLimiter: createMemoryRateLimiter } = require('../rateLimit');

// Lua script — atomic check + increment in a single Redis round-trip
const SLIDING_WINDOW_SCRIPT = `
local key        = KEYS[1]
local now        = tonumber(ARGV[1])
local windowMs   = tonumber(ARGV[2])
local max        = tonumber(ARGV[3])
local uniqueId   = ARGV[4]
local windowStart = now - windowMs

-- Remove entries older than the window
redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)

-- Count remaining entries
local count = redis.call('ZCARD', key)

if count < max then
    -- Add current request
    redis.call('ZADD', key, now, uniqueId)
    redis.call('PEXPIRE', key, windowMs)
    return 0   -- allowed
else
    return 1   -- rate limited
end
`;

/**
 * Create a distributed rate limiter middleware.
 *
 * @param {object} opts
 * @param {number}  opts.windowMs  - Window duration in ms
 * @param {number}  opts.max       - Max requests per window
 * @param {object}  [opts.redis]   - ioredis client (falls back to in-memory if null)
 * @param {string}  [opts.keyPrefix] - Redis key prefix (default 'rl')
 */
function createRedisRateLimiter({ windowMs = 60_000, max = 20, redis = null, keyPrefix = 'rl' } = {}) {
    // Fall back gracefully if Redis is not available
    if (!redis) {
        return createMemoryRateLimiter({ windowMs, max });
    }

    let scriptSha = null; // cached SHA after first SCRIPT LOAD

    async function loadScript() {
        if (!scriptSha) {
            scriptSha = await redis.script('LOAD', SLIDING_WINDOW_SCRIPT);
        }
        return scriptSha;
    }

    return async function redisRateLimiter(req, res, next) {
        const ip  = req.ip || req.socket?.remoteAddress || 'unknown';
        const key = `${keyPrefix}:${ip}`;
        const now = Date.now();
        const id  = `${now}-${Math.random().toString(36).slice(2, 8)}`;

        try {
            const sha = await loadScript();
            const result = await redis.evalsha(sha, 1, key, now, windowMs, max, id);

            res.setHeader('X-RateLimit-Limit', String(max));

            if (result === 1) {
                res.setHeader('X-RateLimit-Remaining', '0');
                res.setHeader('Retry-After', Math.ceil(windowMs / 1000));
                return res.status(429).json({
                    error: {
                        code: 'RATE_LIMITED',
                        message: 'Too many requests. Please slow down and try again.',
                        requestId: req.id,
                    },
                });
            }

            // Best-effort remaining count (ZCARD is O(1))
            const count = await redis.zcard(key).catch(() => 0);
            res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - count)));
            return next();
        } catch (redisErr) {
            // Redis error — fail open to avoid blocking all traffic
            console.warn('[RateLimit] Redis error, allowing request:', redisErr.message);
            return next();
        }
    };
}

module.exports = { createRedisRateLimiter };
