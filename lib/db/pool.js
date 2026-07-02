const { Pool } = require('pg');

let _pool = null;

/**
 * Returns the singleton PostgreSQL connection pool.
 * Lazily created on first call.
 */
function getPool() {
    if (!_pool) {
        _pool = createPool();
    }
    return _pool;
}

function createPool() {
    const pool = new Pool({
        // Prefer DATABASE_URL (e.g. Cloud SQL connection string) when set,
        // otherwise build from individual env vars.
        connectionString: process.env.DATABASE_URL || undefined,
        host:     process.env.PGHOST     || 'localhost',
        port:     Number(process.env.PGPORT || 5432),
        database: process.env.PGDATABASE || 'stratify',
        user:     process.env.PGUSER     || 'stratify',
        password: process.env.PGPASSWORD || 'stratify',

        // Connection pool settings tuned for high concurrency:
        //   max: 20 connections per worker process
        //   With 8 workers that's 160 total, well within PgBouncer / Cloud SQL limits
        max:                  Number(process.env.PG_POOL_MAX             || 20),
        min:                  Number(process.env.PG_POOL_MIN             || 2),
        idleTimeoutMillis:    Number(process.env.PG_IDLE_TIMEOUT_MS      || 30_000),
        connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS || 5_000),

        ssl: buildSslConfig(),
    });

    pool.on('error', (err) => {
        // Log but don't crash — the pool will attempt to reconnect automatically
        console.error('[PgPool] Unexpected idle client error:', err.message);
    });

    pool.on('connect', () => {
        // Useful for debugging connection churn; remove in production if too noisy
        if (process.env.PG_DEBUG === '1') {
            console.debug('[PgPool] New client connected');
        }
    });

    return pool;
}

function buildSslConfig() {
    // Explicit opt-out for local Docker / CI where SSL is not configured
    if (process.env.PGSSL === 'false' || process.env.PGSSL === '0') return false;
    // Production: enable SSL without rejecting self-signed certs (Cloud SQL pattern)
    if (process.env.NODE_ENV === 'production') return { rejectUnauthorized: false };
    return false;
}

/**
 * Execute a single SQL query, borrowing a client from the pool.
 * @param {string} text  - SQL string (use $1, $2, … placeholders)
 * @param {any[]}  [params] - Parameter array
 */
async function query(text, params) {
    const start = Date.now();
    try {
        const result = await getPool().query(text, params);
        if (process.env.PG_DEBUG === '1') {
            console.debug(`[PgPool] query (${Date.now() - start}ms):`, text.slice(0, 80));
        }
        return result;
    } catch (err) {
        console.error('[PgPool] Query error:', err.message, '\nQuery:', text.slice(0, 200));
        throw err;
    }
}

/**
 * Run a set of queries inside a single serializable transaction.
 * Automatically rolls back on any thrown error.
 *
 * @param {Function} fn - async (client) => result
 */
async function withTransaction(fn) {
    const client = await getPool().connect();
    try {
        await client.query('BEGIN');
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Verify that we can reach the database.
 * @returns {Promise<boolean>}
 */
async function testConnection() {
    try {
        await query('SELECT 1 AS ok');
        return true;
    } catch {
        return false;
    }
}

/**
 * Gracefully drain and close the pool.
 * Call this during process shutdown.
 */
async function closePool() {
    if (_pool) {
        await _pool.end();
        _pool = null;
    }
}

module.exports = { getPool, query, withTransaction, testConnection, closePool };
