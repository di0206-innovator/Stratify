class LockManager {
    constructor() {
        this.locks = new Map();
    }

    /**
     * Acquires a lock for a given key.
     * Returns a release function that must be called when the operation is complete.
     * 
     * @param {string} key - The resource key to lock (e.g. file path)
     * @returns {Promise<Function>} A function to release the acquired lock
     */
    async acquire(key) {
        if (!this.locks.has(key)) {
            this.locks.set(key, Promise.resolve());
        }

        let release;
        const nextLock = new Promise((resolve) => {
            release = resolve;
        });

        const previousLock = this.locks.get(key);
        // Queue the next lock
        this.locks.set(key, nextLock);

        // Wait for the previous lock to release
        await previousLock;

        return () => {
            release();
            // Clean up the key from the map if no other queue items exist
            if (this.locks.get(key) === nextLock) {
                this.locks.delete(key);
            }
        };
    }
}

const lockManager = new LockManager();

module.exports = { LockManager, lockManager };
