const fs = require('fs/promises');
const path = require('path');

class LockManager {
    constructor() {
        this.locks = new Map();
    }

    /**
     * Acquires a lock for a given key (e.g. file path).
     * Returns a release function that must be called when the operation is complete.
     * Combines an in-process queue with an atomic on-disk lockfile.
     * 
     * @param {string} key - The resource key to lock (must be a writeable file path)
     * @returns {Promise<Function>} A function to release the acquired lock
     */
    async acquire(key) {
        // L1: In-process queue to prevent thrashing inside the same worker thread
        if (!this.locks.has(key)) {
            this.locks.set(key, Promise.resolve());
        }

        let releaseInProcess;
        const nextLock = new Promise((resolve) => {
            releaseInProcess = resolve;
        });

        const previousLock = this.locks.get(key);
        this.locks.set(key, nextLock);

        await previousLock;

        // L2: Inter-process lock file using atomic 'wx' file creation
        const lockFilePath = `${key}.lock`;
        const maxRetries = 100;
        const retryDelayMs = 50;
        let acquiredLockFile = false;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                // Ensure parent directory exists before attempting to open the lock file
                await fs.mkdir(path.dirname(lockFilePath), { recursive: true });
                const handle = await fs.open(lockFilePath, 'wx');
                await handle.close();
                acquiredLockFile = true;
                break;
            } catch (err) {
                if (err.code === 'EEXIST') {
                    // Lock held by another worker process, sleep and retry
                    await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
                } else {
                    // Propagate other errors (like permissions/directory errors)
                    releaseInProcess();
                    if (this.locks.get(key) === nextLock) {
                        this.locks.delete(key);
                    }
                    throw err;
                }
            }
        }

        if (!acquiredLockFile) {
            releaseInProcess();
            if (this.locks.get(key) === nextLock) {
                this.locks.delete(key);
            }
            throw new Error(`[LockManager] Timeout acquiring lock for file: ${key}`);
        }

        // Return a combined release function to free both L1 and L2 locks
        return async () => {
            try {
                await fs.unlink(lockFilePath);
            } catch (err) {
                // Ignore if already deleted/missing
            }

            releaseInProcess();
            if (this.locks.get(key) === nextLock) {
                this.locks.delete(key);
            }
        };
    }
}

const lockManager = new LockManager();

module.exports = { LockManager, lockManager };
