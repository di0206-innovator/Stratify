/**
 * PgReportStore — PostgreSQL-native replacement for FileReportStore.
 * Same external interface; all reads and writes use SQL.
 */

const { query, withTransaction } = require('./pool');

class PgReportStore {
    constructor({ maxReports = 500 } = {}) {
        this.maxReports = maxReports;
    }

    /** No-op init (pool manages connections) */
    async init() {}

    /**
     * List reports accessible to userId, newest first.
     * @param {object} opts
     * @param {number} [opts.limit=25]
     * @param {string} [opts.userId]
     */
    async list({ limit = 25, userId } = {}) {
        const clampedLimit = Math.min(Math.max(1, Number(limit) || 25), 100);

        // Access rules:
        //  - api-token user sees ALL reports
        //  - authenticated user sees their own + unowned
        //  - unauthenticated (null) sees unowned only
        let sql, params;

        if (userId === 'api-token') {
            sql = `SELECT id, owner_id, title, mode, intelligence_mode, model, sources, founder_context, generated_at
                   FROM reports ORDER BY generated_at DESC LIMIT $1`;
            params = [clampedLimit];
        } else if (userId) {
            sql = `SELECT id, owner_id, title, mode, intelligence_mode, model, sources, founder_context, generated_at
                   FROM reports
                   WHERE owner_id = $1 OR owner_id IS NULL
                   ORDER BY generated_at DESC LIMIT $2`;
            params = [userId, clampedLimit];
        } else {
            sql = `SELECT id, owner_id, title, mode, intelligence_mode, model, sources, founder_context, generated_at
                   FROM reports
                   WHERE owner_id IS NULL
                   ORDER BY generated_at DESC LIMIT $1`;
            params = [clampedLimit];
        }

        const { rows } = await query(sql, params);
        return rows.map(stripHeavyFields);
    }

    /**
     * Fetch a single report by id.
     */
    async get(id, { userId } = {}) {
        let sql, params;

        if (userId === 'api-token') {
            sql = `SELECT * FROM reports WHERE id = $1 LIMIT 1`;
            params = [id];
        } else if (userId) {
            sql = `SELECT * FROM reports WHERE id = $1 AND (owner_id = $2 OR owner_id IS NULL) LIMIT 1`;
            params = [id, userId];
        } else {
            sql = `SELECT * FROM reports WHERE id = $1 AND owner_id IS NULL LIMIT 1`;
            params = [id];
        }

        const { rows } = await query(sql, params);
        return rows[0] ? pgReportToRecord(rows[0]) : null;
    }

    /**
     * Insert or replace a report. Enforces maxReports per user via cleanup.
     */
    async save(report) {
        const row = recordToPgReport(report);

        await query(
            `INSERT INTO reports
                (id, owner_id, title, mode, intelligence_mode, model, markdown, sections, section_order, sources, founder_context, generated_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
             ON CONFLICT (id) DO UPDATE SET
                owner_id          = EXCLUDED.owner_id,
                title             = EXCLUDED.title,
                mode              = EXCLUDED.mode,
                intelligence_mode = EXCLUDED.intelligence_mode,
                model             = EXCLUDED.model,
                markdown          = EXCLUDED.markdown,
                sections          = EXCLUDED.sections,
                section_order     = EXCLUDED.section_order,
                sources           = EXCLUDED.sources,
                founder_context   = EXCLUDED.founder_context`,
            [
                row.id, row.owner_id, row.title, row.mode, row.intelligence_mode,
                row.model, row.markdown,
                JSON.stringify(row.sections),
                JSON.stringify(row.section_order),
                JSON.stringify(row.sources),
                JSON.stringify(row.founder_context),
                row.generated_at,
            ]
        );

        // Async cleanup: keep only maxReports per owner (don't block the response)
        if (report.ownerId) {
            this._enforceLimit(report.ownerId).catch(() => {});
        }

        return report;
    }

    /**
     * Delete a report by id.
     * @returns {boolean} true if deleted, false if not found / no access
     */
    async delete(id, { userId } = {}) {
        let sql, params;

        if (userId === 'api-token') {
            sql = `DELETE FROM reports WHERE id = $1 RETURNING id`;
            params = [id];
        } else if (userId) {
            sql = `DELETE FROM reports WHERE id = $1 AND (owner_id = $2 OR owner_id IS NULL) RETURNING id`;
            params = [id, userId];
        } else {
            sql = `DELETE FROM reports WHERE id = $1 AND owner_id IS NULL RETURNING id`;
            params = [id];
        }

        const { rowCount } = await query(sql, params);
        return rowCount > 0;
    }

    /**
     * Read ALL reports (admin/background use only).
     */
    async readAll() {
        const { rows } = await query(`SELECT * FROM reports ORDER BY generated_at DESC`);
        return rows.map(pgReportToRecord);
    }

    // ─── Private ────────────────────────────────────────────────────

    async _enforceLimit(ownerId) {
        // Delete oldest reports beyond maxReports for this owner
        await query(
            `DELETE FROM reports
             WHERE owner_id = $1
               AND id NOT IN (
                   SELECT id FROM reports WHERE owner_id = $1
                   ORDER BY generated_at DESC LIMIT $2
               )`,
            [ownerId, this.maxReports]
        );
    }
}

// ─── Mappers ────────────────────────────────────────────────────────────────

function pgReportToRecord(row) {
    return {
        id:              row.id,
        ownerId:         row.owner_id,
        title:           row.title,
        mode:            row.mode,
        intelligenceMode: row.intelligence_mode,
        model:           row.model,
        markdown:        row.markdown,
        sections:        row.sections,
        sectionOrder:    row.section_order,
        sources:         row.sources,
        founderContext:  row.founder_context,
        generatedAt:     row.generated_at,
    };
}

function recordToPgReport(report) {
    return {
        id:               report.id,
        owner_id:         report.ownerId || null,
        title:            report.title,
        mode:             report.mode,
        intelligence_mode: report.intelligenceMode,
        model:            report.model,
        markdown:         report.markdown,
        sections:         report.sections,
        section_order:    report.sectionOrder,
        sources:          report.sources,
        founder_context:  report.founderContext,
        generated_at:     report.generatedAt || new Date().toISOString(),
    };
}

function stripHeavyFields(row) {
    return {
        id:              row.id,
        ownerId:         row.owner_id,
        title:           row.title,
        mode:            row.mode,
        intelligenceMode: row.intelligence_mode,
        model:           row.model,
        generatedAt:     row.generated_at,
        sourceCount:     Array.isArray(row.sources) ? row.sources.length : (row.sources ? Object.keys(row.sources).length : 0),
        reportType:      row.founder_context?.reportOptions?.reportType,
    };
}

module.exports = { PgReportStore };
