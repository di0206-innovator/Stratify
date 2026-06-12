const fs = require('fs/promises');
const path = require('path');

class FileReportStore {
    constructor({ filePath, maxReports = 500 } = {}) {
        this.filePath = filePath || path.join(process.cwd(), 'data', 'reports.json');
        this.maxReports = maxReports;
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

    async list({ limit = 25, userId } = {}) {
        const reports = await this.readAll();
        return reports
            .filter((report) => canAccessReport(report, userId))
            .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))
            .slice(0, limit)
            .map(stripHeavyFields);
    }

    async get(id, { userId } = {}) {
        const reports = await this.readAll();
        return reports.find((report) => report.id === id && canAccessReport(report, userId)) || null;
    }

    async save(report) {
        const reports = await this.readAll();
        const next = [report, ...reports.filter((item) => item.id !== report.id)]
            .slice(0, this.maxReports);
        await this.writeAll(next);
        return report;
    }

    async delete(id, { userId } = {}) {
        const reports = await this.readAll();
        const next = reports.filter((report) => !(report.id === id && canAccessReport(report, userId)));
        if (next.length === reports.length) return false;
        await this.writeAll(next);
        return true;
    }

    async readAll() {
        await this.ensureReady();
        const raw = await fs.readFile(this.filePath, 'utf8');
        const parsed = JSON.parse(raw || '[]');
        return Array.isArray(parsed) ? parsed : [];
    }

    async writeAll(reports) {
        await this.ensureReady();
        const tmpPath = `${this.filePath}.tmp`;
        await fs.writeFile(tmpPath, `${JSON.stringify(reports, null, 2)}\n`);
        await fs.rename(tmpPath, this.filePath);
    }

    async ensureReady() {
        if (!this.ready) {
            await this.init();
        }
    }
}

class MemoryReportStore {
    constructor() {
        this.reports = [];
        this.ready = false;
    }

    async init() {
        this.ready = true;
    }

    async list({ limit = 25, userId } = {}) {
        return this.reports
            .filter((report) => canAccessReport(report, userId))
            .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))
            .slice(0, limit)
            .map(stripHeavyFields);
    }

    async get(id, { userId } = {}) {
        return this.reports.find((report) => report.id === id && canAccessReport(report, userId)) || null;
    }

    async save(report) {
        this.reports = [report, ...this.reports.filter((item) => item.id !== report.id)];
        return report;
    }

    async delete(id, { userId } = {}) {
        const before = this.reports.length;
        this.reports = this.reports.filter((report) => !(report.id === id && canAccessReport(report, userId)));
        return this.reports.length !== before;
    }

    async readAll() {
        return this.reports;
    }
}

function canAccessReport(report, userId) {
    if (!userId || userId === 'api-token') return true;
    return report.ownerId === userId;
}

function stripHeavyFields(report) {
    return {
        id: report.id,
        title: report.title,
        generatedAt: report.generatedAt,
        mode: report.mode,
        intelligenceMode: report.intelligenceMode,
        model: report.model,
        ownerId: report.ownerId,
        sourceCount: Array.isArray(report.sources) ? report.sources.length : 0,
        reportType: report.founderContext && report.founderContext.reportOptions
            ? report.founderContext.reportOptions.reportType
            : undefined
    };
}

module.exports = { FileReportStore, MemoryReportStore, stripHeavyFields };
