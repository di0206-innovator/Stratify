const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { lockManager } = require('./security/lock');
const { getWritableDataPath } = require('./runtimePaths');

class FileAuthStore {
    constructor({ filePath } = {}) {
        this.filePath = filePath || getWritableDataPath('auth.json');
        this.ready = false;
    }

    async init() {
        await fs.mkdir(path.dirname(this.filePath), { recursive: true });
        try {
            await fs.access(this.filePath);
        } catch {
            await this.writeState(emptyState());
        }
        this.ready = true;
    }

    async readState() {
        await this.ensureReady();
        const raw = await fs.readFile(this.filePath, 'utf8');
        return normalizeState(JSON.parse(raw || '{}'));
    }

    async writeState(state) {
        await fs.mkdir(path.dirname(this.filePath), { recursive: true });
        const uniqueId = crypto.randomUUID();
        const tmpPath = `${this.filePath}.${uniqueId}.tmp`;
        await fs.writeFile(tmpPath, `${JSON.stringify(normalizeState(state), null, 2)}\n`);
        await fs.rename(tmpPath, this.filePath);
    }

    async update(mutator) {
        const release = await lockManager.acquire(this.filePath);
        try {
            const state = await this.readState();
            const result = await mutator(state);
            await this.writeState(state);
            return result;
        } finally {
            release();
        }
    }

    async ensureReady() {
        if (!this.ready) await this.init();
    }
}

class MemoryAuthStore {
    constructor(initialState = emptyState()) {
        this.state = normalizeState(initialState);
        this.ready = false;
    }

    async init() {
        this.ready = true;
    }

    async readState() {
        return normalizeState(JSON.parse(JSON.stringify(this.state)));
    }

    async writeState(state) {
        this.state = normalizeState(JSON.parse(JSON.stringify(state)));
    }

    async update(mutator) {
        const result = await mutator(this.state);
        this.state = normalizeState(this.state);
        return result;
    }
}

function emptyState() {
    return {
        users: [],
        sessions: [],
        tokens: [],
        emailOutbox: []
    };
}

function normalizeState(state) {
    return {
        users: Array.isArray(state.users) ? state.users : [],
        sessions: Array.isArray(state.sessions) ? state.sessions : [],
        tokens: Array.isArray(state.tokens) ? state.tokens : [],
        emailOutbox: Array.isArray(state.emailOutbox) ? state.emailOutbox : []
    };
}

module.exports = {
    FileAuthStore,
    MemoryAuthStore,
    emptyState
};
