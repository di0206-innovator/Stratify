/**
 * Redis client singleton built on ioredis.
 *
 * Features:
 *  - Single shared client instance per process (cluster workers each get their own)
 *  - Automatic reconnection with exponential backoff
 *  - Lazy initialization — no crash if Redis is unavailable (graceful degradation)
 *  - Configurable via REDIS_URL or individual REDIS_* env vars
 */

let _client = null;
let _connectionFailed = false;

/**
 * Get the shared Redis client.
 * Returns null if Redis is not configured or unavailable (graceful degradation).
 */
function getRedis() {
    if (_connectionFailed) return null;
    if (_client) return _client;

    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl && !process.env.REDIS_HOST) {
        // Redis not configured — app runs without it (file stores / in-memory fallback)
        return null;
    }

    try {
        // ioredis is required lazily so the app still boots without it installed
        const Redis = require('ioredis');

        const options = {
            // Retry strategy: exponential backoff, max 30s, give up after 10 attempts
            retryStrategy(times) {
                if (times > 10) {
                    console.error('[Redis] Max reconnection attempts reached. Disabling Redis.');
                    _connectionFailed = true;
                    _client = null;
                    return null; // stop retrying
                }
                return Math.min(times * 200, 30_000);
            },
            enableReadyCheck: true,
            maxRetriesPerRequest: 3,
            lazyConnect: false,
            connectTimeout: 5000,
            commandTimeout: 3000,
        };

        if (redisUrl) {
            _client = new Redis(redisUrl, options);
        } else {
            _client = new Redis({
                host:     process.env.REDIS_HOST     || 'localhost',
                port:     Number(process.env.REDIS_PORT || 6379),
                password: process.env.REDIS_PASSWORD || undefined,
                db:       Number(process.env.REDIS_DB   || 0),
                tls:      process.env.REDIS_TLS === 'true' ? {} : undefined,
                ...options,
            });
        }

        _client.on('connect', () => {
            _connectionFailed = false;
            console.log('[Redis] Connected');
        });

        _client.on('ready', () => {
            console.log('[Redis] Ready');
        });

        _client.on('error', (err) => {
            // Log but don't crash — the retry strategy handles reconnection
            console.warn('[Redis] Error:', err.message);
        });

        _client.on('close', () => {
            console.warn('[Redis] Connection closed');
        });

        return _client;
    } catch (err) {
        // ioredis not installed or init failed
        console.warn('[Redis] Could not initialize client:', err.message, '— running without Redis.');
        _connectionFailed = true;
        return null;
    }
}

/**
 * Gracefully close the Redis connection during shutdown.
 */
async function closeRedis() {
    if (_client) {
        try {
            await _client.quit();
        } catch {
            _client.disconnect();
        }
        _client = null;
    }
}

/**
 * Verify the Redis connection is alive.
 */
async function testRedisConnection() {
    const redis = getRedis();
    if (!redis) return false;
    try {
        await redis.ping();
        return true;
    } catch {
        return false;
    }
}

module.exports = { getRedis, closeRedis, testRedisConnection };
