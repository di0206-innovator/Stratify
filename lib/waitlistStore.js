const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { lockManager } = require('./security/lock');
const { getWritableDataPath } = require('./runtimePaths');

class FileWaitlistStore {
    constructor({ filePath } = {}) {
        this.filePath = filePath || getWritableDataPath('waitlist.json');
        this.ready = false;
    }

    async init() {
        await fs.mkdir(path.dirname(this.filePath), { recursive: true });
        try {
            await fs.access(this.filePath);
        } catch {
            await this._write([]);
        }
        this.ready = true;
    }

    async _ensureReady() {
        if (!this.ready) await this.init();
    }

    async _read() {
        await this._ensureReady();
        const raw = await fs.readFile(this.filePath, 'utf8');
        try {
            const data = JSON.parse(raw || '[]');
            return Array.isArray(data) ? data : [];
        } catch {
            return [];
        }
    }

    async _write(entries) {
        await fs.mkdir(path.dirname(this.filePath), { recursive: true });
        const tmpPath = `${this.filePath}.${crypto.randomUUID()}.tmp`;
        await fs.writeFile(tmpPath, `${JSON.stringify(entries, null, 2)}\n`);
        await fs.rename(tmpPath, this.filePath);
    }

    async add(entry) {
        const release = await lockManager.acquire(this.filePath);
        try {
            const entries = await this._read();
            const record = {
                id: crypto.randomUUID(),
                name: String(entry.name || '').trim(),
                email: String(entry.email || '').trim().toLowerCase(),
                plan: String(entry.plan || 'general').trim(),
                message: String(entry.message || '').trim().slice(0, 500),
                createdAt: new Date().toISOString()
            };
            entries.push(record);
            await this._write(entries);
            return record;
        } finally {
            release();
        }
    }

    async readAll() {
        return this._read();
    }

    async remove(id) {
        const release = await lockManager.acquire(this.filePath);
        try {
            const entries = await this._read();
            const filtered = entries.filter((e) => e.id !== id);
            if (filtered.length === entries.length) return false;
            await this._write(filtered);
            return true;
        } finally {
            release();
        }
    }

    async count() {
        const entries = await this._read();
        return entries.length;
    }
}

module.exports = { FileWaitlistStore };
