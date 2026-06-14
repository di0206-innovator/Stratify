const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { lockManager } = require('./security/lock');

class FileSignalStore {
    constructor({ filePath } = {}) {
        this.filePath = filePath || path.join(process.cwd(), 'data', 'signals.json');
        this.ready = false;
    }

    async init() {
        await fs.mkdir(path.dirname(this.filePath), { recursive: true });
        try {
            await fs.access(this.filePath);
        } catch {
            await fs.writeFile(this.filePath, '[]\n');
        }
        this.ready = true;
    }

    async getSignals(industry, geography) {
        await this.ensureReady();
        const records = await this.readAll();
        const keyInd = (industry || '').toLowerCase().trim();
        const keyGeo = (geography || '').toLowerCase().trim();

        const match = records.find(r => 
            r.industry.toLowerCase().trim() === keyInd && 
            r.geography.toLowerCase().trim() === keyGeo
        );

        if (!match) return null;

        // Check if cached signals are older than 24 hours
        const ageMs = Date.now() - new Date(match.timestamp).getTime();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        if (ageMs > twentyFourHours) {
            return null; // Expired cache
        }

        return { signals: match.signals, mode: match.mode || 'cache' };
    }

    async saveSignals(industry, geography, signals, mode) {
        const release = await lockManager.acquire(this.filePath);
        try {
            await this.ensureReady();
            const records = await this.readAll();
            const keyInd = (industry || '').toLowerCase().trim();
            const keyGeo = (geography || '').toLowerCase().trim();

            const entry = {
                industry: keyInd,
                geography: keyGeo,
                timestamp: new Date().toISOString(),
                signals,
                mode: mode || 'cache'
            };

            const next = [
                entry,
                ...records.filter(r => 
                    !(r.industry.toLowerCase().trim() === keyInd && 
                      r.geography.toLowerCase().trim() === keyGeo)
                )
            ];

            await this.writeAll(next);
            return { signals, mode: entry.mode };
        } finally {
            release();
        }
    }

    async readAll() {
        await this.ensureReady();
        try {
            const raw = await fs.readFile(this.filePath, 'utf8');
            const parsed = JSON.parse(raw || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    async writeAll(records) {
        await this.ensureReady();
        const uniqueId = crypto.randomUUID();
        const tmpPath = `${this.filePath}.${uniqueId}.tmp`;
        await fs.writeFile(tmpPath, `${JSON.stringify(records, null, 2)}\n`);
        await fs.rename(tmpPath, this.filePath);
    }

    async ensureReady() {
        if (!this.ready) {
            await this.init();
        }
    }
}

class MemorySignalStore {
    constructor() {
        this.records = [];
        this.ready = false;
    }

    async init() {
        this.ready = true;
    }

    async getSignals(industry, geography) {
        const keyInd = (industry || '').toLowerCase().trim();
        const keyGeo = (geography || '').toLowerCase().trim();
        const match = this.records.find(r => 
            r.industry.toLowerCase().trim() === keyInd && 
            r.geography.toLowerCase().trim() === keyGeo
        );
        if (!match) return null;

        const ageMs = Date.now() - new Date(match.timestamp).getTime();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        if (ageMs > twentyFourHours) return null;

        return { signals: match.signals, mode: match.mode || 'cache' };
    }

    async saveSignals(industry, geography, signals, mode) {
        const keyInd = (industry || '').toLowerCase().trim();
        const keyGeo = (geography || '').toLowerCase().trim();
        const entry = {
            industry: keyInd,
            geography: keyGeo,
            timestamp: new Date().toISOString(),
            signals,
            mode: mode || 'cache'
        };
        this.records = [
            entry,
            ...this.records.filter(r => 
                !(r.industry.toLowerCase().trim() === keyInd && 
                  r.geography.toLowerCase().trim() === keyGeo)
            )
        ];
        return { signals, mode: entry.mode };
    }
}

module.exports = { FileSignalStore, MemorySignalStore };
