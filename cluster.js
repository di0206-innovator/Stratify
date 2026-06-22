/**
 * cluster.js — Production entry point using Node.js built-in cluster module.
 *
 * Spawns one worker per CPU core. Each worker runs a full server.js instance.
 * The primary process only manages workers — no requests handled there.
 *
 * Usage:
 *   node cluster.js          # auto-detects CPU count
 *   WORKERS=4 node cluster.js  # override worker count
 *
 * In Kubernetes/Docker, set WORKERS=1 (let the orchestrator handle replicas).
 */

require('dotenv').config();

const cluster = require('cluster');
const os      = require('os');
const { createLogger } = require('./lib/logger');

const logger = createLogger({ env: process.env.NODE_ENV });

const WORKER_COUNT = Number(process.env.WORKERS) || os.cpus().length;
const SHUTDOWN_GRACE_MS = Number(process.env.SHUTDOWN_GRACE_MS) || 15_000;

if (cluster.isPrimary) {
    logger.info(`[Cluster] Primary ${process.pid} starting ${WORKER_COUNT} workers`);

    // Run DB migration once in the primary process before spawning workers
    if (process.env.DATABASE_URL || process.env.PGHOST) {
        const { migrate } = require('./lib/db/migrate');
        migrate({ logger })
            .then(() => spawnWorkers())
            .catch((err) => {
                logger.error('[Cluster] Migration failed — aborting startup', { error: err.message });
                process.exit(1);
            });
    } else {
        spawnWorkers();
    }
} else {
    // Worker process — run the Express application
    require('./server.js');
    logger.info(`[Cluster] Worker ${process.pid} started`);
}

// ─── Primary process helpers ─────────────────────────────────────────────────

function spawnWorkers() {
    for (let i = 0; i < WORKER_COUNT; i++) {
        spawnWorker();
    }

    cluster.on('exit', (worker, code, signal) => {
        const reason = signal || (code !== 0 ? `exit code ${code}` : 'normal exit');
        logger.warn(`[Cluster] Worker ${worker.process.pid} died (${reason}). Restarting…`);
        // Restart crashed workers after a brief delay
        setTimeout(() => spawnWorker(), 1000);
    });

    // Graceful shutdown: send SIGTERM to all workers on primary signal
    ['SIGINT', 'SIGTERM'].forEach((sig) => {
        process.on(sig, () => {
            logger.info(`[Cluster] ${sig} received — shutting down workers`);
            const workers = Object.values(cluster.workers);
            let exited = 0;

            workers.forEach((w) => {
                w.send('shutdown');
                w.on('exit', () => {
                    exited++;
                    if (exited === workers.length) {
                        logger.info('[Cluster] All workers exited cleanly');
                        process.exit(0);
                    }
                });
            });

            // Force kill after grace period
            setTimeout(() => {
                logger.error('[Cluster] Grace period expired — force killing remaining workers');
                process.exit(1);
            }, SHUTDOWN_GRACE_MS).unref();
        });
    });
}

function spawnWorker() {
    const w = cluster.fork();
    logger.info(`[Cluster] Spawned worker ${w.process.pid}`);
    return w;
}
