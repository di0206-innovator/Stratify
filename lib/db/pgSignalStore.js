/**
 * PgSignalStore — PostgreSQL-native replacement for FileSignalStore.
 * Uses Redis for hot cache (24h TTL), falls back to PostgreSQL for persistence.
 */

const { query } = require('./pool');

const SIGNAL_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const REDIS_KEY_PREFIX = 'signals:';

class PgSignalStore {
    /**
     * @param {object} [opts]
     * @param {object} [opts.redis] - ioredis client (optional)
     */
    constructor({ redis } = {}) {
        this.redis = redis || null;
    }

    async init() {}

    /**
     * Get cached signals for (industry, geography).
     * Redis → PostgreSQL fallback.
     * @returns {{ signals, mode } | null}
     */
    async getSignals(industry, geography) {
        const keyInd = normalize(industry);
        const keyGeo = normalize(geography);

        // L1: Redis (sub-millisecond)
        const redisResult = await this._getFromRedis(keyInd, keyGeo);
        if (redisResult) return redisResult;

        // L2: PostgreSQL
        const { rows } = await query(
            `SELECT signals, mode, updated_at
             FROM signals_cache
             WHERE LOWER(industry) = $1 AND LOWER(geography) = $2
             LIMIT 1`,
            [keyInd, keyGeo]
        );

        if (!rows[0]) return null;

        const ageMs = Date.now() - new Date(rows[0].updated_at).getTime();
        if (ageMs > SIGNAL_CACHE_TTL_MS) return null;

        const result = { signals: rows[0].signals, mode: rows[0].mode || 'cache' };

        // Re-populate Redis with remaining TTL
        await this._setInRedis(keyInd, keyGeo, result, SIGNAL_CACHE_TTL_MS - ageMs).catch(() => {});

        return result;
    }

    /**
     * Upsert cached signals for (industry, geography).
     */
    async saveSignals(industry, geography, signals, mode) {
        const keyInd = normalize(industry);
        const keyGeo = normalize(geography);
        const safeMode = mode || 'cache';

        await query(
            `INSERT INTO signals_cache (industry, geography, signals, mode)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (industry, geography) DO UPDATE
                SET signals = EXCLUDED.signals,
                    mode    = EXCLUDED.mode,
                    updated_at = NOW()`,
            [keyInd, keyGeo, JSON.stringify(signals), safeMode]
        );

        // Update Redis cache
        await this._setInRedis(keyInd, keyGeo, { signals, mode: safeMode }, SIGNAL_CACHE_TTL_MS).catch(() => {});

        return { signals, mode: safeMode };
    }

    /**
     * Read all signals (background sweep usage).
     */
    async readAll() {
        const { rows } = await query(`SELECT * FROM signals_cache ORDER BY updated_at DESC`);
        return rows;
    }

    // ─── Redis helpers ───────────────────────────────────────────────

    _redisKey(ind, geo) {
        return `${REDIS_KEY_PREFIX}${ind}:${geo}`;
    }

    async _getFromRedis(ind, geo) {
        if (!this.redis) return null;
        try {
            const raw = await this.redis.get(this._redisKey(ind, geo));
            if (!raw) return null;
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    async _setInRedis(ind, geo, data, ttlMs) {
        if (!this.redis || ttlMs <= 0) return;
        try {
            await this.redis.set(
                this._redisKey(ind, geo),
                JSON.stringify(data),
                'PX',
                Math.floor(ttlMs)
            );
        } catch {
            // non-fatal
        }
    }
}

function normalize(str) {
    return String(str || '').toLowerCase().trim();
}

module.exports = { PgSignalStore };
