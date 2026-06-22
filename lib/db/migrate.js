/**
 * Database migration runner.
 * Reads lib/db/schema.sql and applies it idempotently.
 * Safe to call on every startup (all statements use IF NOT EXISTS / CREATE OR REPLACE).
 */
require('dotenv').config();

const fs   = require('fs/promises');
const path = require('path');
const { getPool, closePool, testConnection } = require('./pool');

const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 2000;

async function migrate({ logger } = {}) {
    const log = logger || { info: console.log, error: console.error };

    // Wait for Postgres to be ready (important in Docker compose startup race)
    let connected = false;
    for (let i = 1; i <= MAX_RETRIES; i++) {
        connected = await testConnection();
        if (connected) break;
        log.info(`[migrate] Waiting for PostgreSQL... (attempt ${i}/${MAX_RETRIES})`);
        await sleep(RETRY_DELAY_MS);
    }

    if (!connected) {
        throw new Error('[migrate] Could not connect to PostgreSQL after max retries');
    }

    log.info('[migrate] Connected to PostgreSQL. Applying schema...');

    const sql = await fs.readFile(SCHEMA_PATH, 'utf8');
    const pool = getPool();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');
        log.info('[migrate] Schema applied successfully.');
    } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`[migrate] Schema migration failed: ${err.message}`);
    } finally {
        client.release();
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Allow running directly: node lib/db/migrate.js
if (require.main === module) {
    migrate()
        .then(() => {
            console.log('[migrate] Done.');
            return closePool();
        })
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('[migrate] Fatal:', err.message);
            process.exit(1);
        });
}

module.exports = { migrate };
