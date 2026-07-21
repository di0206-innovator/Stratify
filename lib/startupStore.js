const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { lockManager } = require('./security/lock');
const { query } = require('./db/pool');
const { getWritableDataDir } = require('./runtimePaths');

// ═══════════════════════════════════════════════════════════════
//  Seed Data: Government Schemes
// ═══════════════════════════════════════════════════════════════
const MOCK_SCHEMES = [
    {
        id: 'scheme-1',
        name: 'Startup India Seed Fund Scheme (SISFS)',
        geography: 'India',
        industry: 'Any',
        description: 'Financial assistance to startups for proof of concept, prototype development, product trials, market entry, and commercialization.',
        incentive: 'Up to INR 50 Lakhs (approx. $60,000 USD) in seed funding.',
        link: 'https://www.startupindia.gov.in/'
    },
    {
        id: 'scheme-2',
        name: 'ASPIRE Scheme for Rural Innovation',
        geography: 'India',
        industry: 'Agriculture, Manufacturing, FoodTech',
        description: 'Promotion of Innovation, Rural Industry & Entrepreneurship to set up a network of technology centers and incubation centers.',
        incentive: 'Grants up to INR 1 Crore for setting up incubation centers.',
        link: 'https://msme.gov.in/'
    },
    {
        id: 'scheme-3',
        name: 'Horizon Europe Innovation Grant',
        geography: 'EU',
        industry: 'Climate, Health, DeepTech, AI',
        description: 'The EU\'s key funding program for research and innovation with a focus on technological transitions and climate impact.',
        incentive: 'Grants ranging from €500,000 to €2.5 Million.',
        link: 'https://ec.europa.eu/info/research-and-innovation_en'
    },
    {
        id: 'scheme-4',
        name: 'SBIR / STTR Small Business Grants',
        geography: 'US',
        industry: 'DeepTech, Health, Energy, Defense',
        description: 'Highly competitive programs that encourage domestic small businesses to engage in Federal Research/Research and Development (R/R&D) with commercialization potential.',
        incentive: 'Phase I grants up to $250,000; Phase II up to $1.5 Million.',
        link: 'https://www.sbir.gov/'
    },
    {
        id: 'scheme-5',
        name: 'Tax Credit for Research and Development (SR&ED)',
        geography: 'Canada',
        industry: 'Any',
        description: 'Tax incentive program to encourage Canadian businesses of all sizes and in all sectors to conduct research and development.',
        incentive: 'Refundable tax credits up to 35% of qualified R&D expenditures.',
        link: 'https://www.canada.ca/'
    }
];

// ═══════════════════════════════════════════════════════════════
//  Seed Data: Opportunities (Grants, Accelerators, Programs)
// ═══════════════════════════════════════════════════════════════
const SEED_OPPORTUNITIES = [
    {
        id: 'opp-1', title: 'Y Combinator', type: 'accelerator', organization: 'Y Combinator',
        description: 'The world\'s most prestigious startup accelerator. $500K standard deal for 7% equity. 3-month intensive program in San Francisco with Demo Day.',
        geography: 'Global', industries: 'Any', stages: 'idea, mvp, launched',
        deadline: 'Rolling (batches in Jan & Jun)', link: 'https://www.ycombinator.com/apply'
    },
    {
        id: 'opp-2', title: 'Techstars Accelerator', type: 'accelerator', organization: 'Techstars',
        description: '3-month mentorship-driven accelerator program. $120K investment for 6% equity. Access to 10,000+ mentors and alumni network.',
        geography: 'Global', industries: 'Any', stages: 'idea, mvp, launched',
        deadline: 'Rolling (multiple programs)', link: 'https://www.techstars.com/'
    },
    {
        id: 'opp-3', title: 'Google for Startups Accelerator', type: 'accelerator', organization: 'Google',
        description: 'Equity-free accelerator providing mentorship, technical support, and Google Cloud credits for AI-first startups.',
        geography: 'Global', industries: 'AI, ML, DeepTech', stages: 'mvp, launched, raising',
        deadline: 'Quarterly applications', link: 'https://startup.google.com/'
    },
    {
        id: 'opp-4', title: 'Startup India Recognition', type: 'program', organization: 'Government of India',
        description: 'Official recognition under DPIIT providing tax exemptions, IPR fast-tracking, and self-certification for labour and environmental laws.',
        geography: 'India', industries: 'Any', stages: 'idea, mvp, launched, raising, scaling',
        deadline: 'Open year-round', link: 'https://www.startupindia.gov.in/'
    },
    {
        id: 'opp-5', title: 'NSF SBIR/STTR Phase I', type: 'grant', organization: 'National Science Foundation',
        description: 'Non-dilutive federal grants up to $275,000 for deeptech R&D. 6-12 month award periods. Path to Phase II ($1M+).',
        geography: 'US', industries: 'DeepTech, Health, Climate, AI', stages: 'idea, mvp',
        deadline: 'June and December annually', link: 'https://www.nsf.gov/eng/iip/sbir/'
    },
    {
        id: 'opp-6', title: 'EIC Accelerator', type: 'grant', organization: 'European Innovation Council',
        description: 'Up to €2.5M grant + €15M equity for breakthrough innovations. For single SMEs with high-impact potential.',
        geography: 'EU', industries: 'DeepTech, Health, Climate, Digital', stages: 'mvp, launched, raising',
        deadline: 'Multiple cut-offs annually', link: 'https://eic.ec.europa.eu/'
    },
    {
        id: 'opp-7', title: '500 Global Accelerator', type: 'accelerator', organization: '500 Global',
        description: '4-month program with $150K investment. Access to global network of 2,800+ portfolio companies across 80+ countries.',
        geography: 'Global', industries: 'Any', stages: 'mvp, launched',
        deadline: 'Quarterly', link: 'https://500.co/'
    },
    {
        id: 'opp-8', title: 'AWS Activate', type: 'program', organization: 'Amazon Web Services',
        description: 'Up to $100K in AWS credits, technical support, and architecture guidance for startups. Portfolio tier available.',
        geography: 'Global', industries: 'SaaS, AI, Cloud', stages: 'idea, mvp, launched',
        deadline: 'Open year-round', link: 'https://aws.amazon.com/activate/'
    },
    {
        id: 'opp-9', title: 'Microsoft for Startups Founders Hub', type: 'program', organization: 'Microsoft',
        description: 'Up to $150K in Azure credits, free access to GitHub Enterprise, Visual Studio, and OpenAI API credits.',
        geography: 'Global', industries: 'SaaS, AI, Cloud', stages: 'idea, mvp, launched, raising',
        deadline: 'Open year-round', link: 'https://foundershub.startups.microsoft.com/'
    },
    {
        id: 'opp-10', title: 'Antler Residency', type: 'accelerator', organization: 'Antler',
        description: 'Pre-team accelerator matching cofounders and investing $100K-250K pre-seed. Programs in 27 cities globally.',
        geography: 'Global', industries: 'Any', stages: 'idea',
        deadline: 'Rolling', link: 'https://www.antler.co/'
    },
    {
        id: 'opp-11', title: 'Plug and Play Accelerator', type: 'accelerator', organization: 'Plug and Play Tech Center',
        description: 'Silicon Valley\'s largest innovation platform. No equity taken. Access to 500+ corporate partners for pilot programs.',
        geography: 'Global', industries: 'FinTech, Health, Supply Chain, Mobility', stages: 'mvp, launched',
        deadline: 'Rolling', link: 'https://www.plugandplaytechcenter.com/'
    },
    {
        id: 'opp-12', title: 'BIRAC BIG Grant', type: 'grant', organization: 'Biotechnology Industry Research Assistance Council',
        description: 'Non-dilutive grants up to INR 50 Lakhs for biotech and healthtech startups in India. Proof-of-concept funding.',
        geography: 'India', industries: 'HealthTech, BioTech', stages: 'idea, mvp',
        deadline: 'Quarterly', link: 'https://birac.nic.in/'
    }
];

// ═══════════════════════════════════════════════════════════════
//  PostgreSQL Store Implementation
// ═══════════════════════════════════════════════════════════════

function calculateStartupScore(startup) {
    let score = 20; // Base score

    // Stage weight
    const stage = String(startup.stage || '').toLowerCase();
    if (stage === 'scaling') score += 30;
    else if (stage === 'launched') score += 20;
    else if (stage === 'mvp') score += 10;
    else if (stage === 'ideation') score += 5;

    // Pitch & Prop details
    if (startup.pitch && startup.pitch.length > 50) score += 10;
    if (startup.problem && startup.problem.length > 50) score += 10;
    if (startup.solution && startup.solution.length > 50) score += 10;

    // Team status
    const team = String(startup.teamStatus || startup.team_status || '').toLowerCase();
    if (team.includes('co-founder') || team.includes('hiring') || team.includes('team')) {
        score += 15;
    } else if (team.length > 0) {
        score += 5;
    }

    // Revenue / Funding raised
    if (startup.revenue && startup.revenue !== '0' && startup.revenue !== '') score += 10;
    if (startup.fundingRaised || startup.funding_raised) score += 10;

    // Tech stack
    if (startup.techStack || startup.tech_stack) score += 10;

    const baseCalculated = Math.min(Math.max(score, 10), 99);
    return Math.max(startup.score || 0, baseCalculated);
}

class PgStartupStore {
    async init() {}

    // ── Startups ──
    async getStartup(id) {
        const { rows } = await query('SELECT * FROM startups WHERE id = $1 LIMIT 1', [id]);
        return rows[0] || null;
    }

    async getStartupByOwner(ownerId) {
        const { rows } = await query('SELECT * FROM startups WHERE owner_id = $1 LIMIT 1', [ownerId]);
        return rows[0] || null;
    }

    async saveStartup(startup) {
        const existing = await this.getStartup(startup.id);
        if (existing) {
            await query(
                `UPDATE startups SET 
                    name = $2, logo_url = $3, pitch = $4, problem = $5, solution = $6, 
                    stage = $7, industry = $8, geography = $9, team_status = $10, 
                    traction = $11, needs = $12, tech_stack = $13, score = $14,
                    deck_url = $15, website_url = $16, revenue = $17, funding_raised = $18,
                    updated_at = NOW()
                 WHERE id = $1`,
                [
                    startup.id, startup.name, startup.logoUrl || startup.logo_url, startup.pitch, startup.problem, startup.solution,
                    startup.stage, startup.industry, startup.geography, startup.teamStatus || startup.team_status,
                    startup.traction, startup.needs, startup.techStack || startup.tech_stack, calculateStartupScore(startup),
                    startup.deckUrl || startup.deck_url || '', startup.websiteUrl || startup.website_url || '',
                    startup.revenue || '', startup.fundingRaised || startup.funding_raised || ''
                ]
            );
        } else {
            await query(
                `INSERT INTO startups (id, owner_id, name, logo_url, pitch, problem, solution, stage, industry, geography, team_status, traction, needs, tech_stack, score, deck_url, website_url, revenue, funding_raised)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
                [
                    startup.id, startup.ownerId, startup.name, startup.logoUrl || startup.logo_url, startup.pitch, startup.problem, startup.solution,
                    startup.stage, startup.industry, startup.geography, startup.teamStatus || startup.team_status,
                    startup.traction, startup.needs, startup.techStack || startup.tech_stack, calculateStartupScore(startup),
                    startup.deckUrl || startup.deck_url || '', startup.websiteUrl || startup.website_url || '',
                    startup.revenue || '', startup.fundingRaised || startup.funding_raised || ''
                ]
            );
        }
        return startup;
    }

    async updateStartup(id, updates) {
        const existing = await this.getStartup(id);
        if (!existing) return null;
        const merged = { ...existing, ...updates, id };
        await this.saveStartup(merged);
        return merged;
    }

    async listStartups({ limit = 20 } = {}) {
        const { rows } = await query('SELECT * FROM startups ORDER BY score DESC, created_at DESC LIMIT $1', [limit]);
        return rows;
    }

    async getTrendingStartups({ limit = 10 } = {}) {
        const { rows } = await query('SELECT * FROM startups ORDER BY score DESC, created_at DESC LIMIT $1', [limit]);
        return rows;
    }

    // ── Posts ──
    async createPost(post) {
        await query(
            `INSERT INTO posts (id, startup_id, author_id, content, type, metadata)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [post.id, post.startupId, post.authorId, post.content, post.type, JSON.stringify(post.metadata || {})]
        );
        return post;
    }

    async listPosts({ limit = 50 } = {}) {
        const { rows } = await query(
            `SELECT p.*, s.name as startup_name, s.logo_url as startup_logo, u.name as author_name 
             FROM posts p
             LEFT JOIN startups s ON p.startup_id = s.id
             LEFT JOIN users u ON p.author_id = u.id
             ORDER BY p.created_at DESC LIMIT $1`,
            [limit]
        );
        return rows.map(r => ({
            ...r,
            startupName: r.startup_name,
            startupLogo: r.startup_logo,
            authorName: r.author_name
        }));
    }

    async getPost(id) {
        const { rows } = await query(
            `SELECT p.*, s.name as startup_name, s.logo_url as startup_logo, u.name as author_name 
             FROM posts p
             LEFT JOIN startups s ON p.startup_id = s.id
             LEFT JOIN users u ON p.author_id = u.id
             WHERE p.id = $1 LIMIT 1`,
            [id]
        );
        if (!rows[0]) return null;
        const r = rows[0];
        return {
            ...r,
            startupName: r.startup_name,
            startupLogo: r.startup_logo,
            authorName: r.author_name
        };
    }

    async updatePost(id, updates) {
        const existing = await this.getPost(id);
        if (!existing) return null;
        
        const setCols = [];
        const params = [id];
        let idx = 2;
        
        if (updates.metadata !== undefined) {
            setCols.push(`metadata = $${idx++}`);
            const mergedMetadata = { ...(existing.metadata || {}), ...updates.metadata };
            params.push(JSON.stringify(mergedMetadata));
        }
        if (updates.content !== undefined) {
            setCols.push(`content = $${idx++}`);
            params.push(updates.content);
        }
        
        if (setCols.length === 0) return existing;
        
        await query(
            `UPDATE posts SET ${setCols.join(', ')} WHERE id = $1`,
            params
        );
        
        return this.getPost(id);
    }

    // ── Matches ──
    async createMatch(match) {
        await query(
            `INSERT INTO matches (id, sender_id, receiver_id, status)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (sender_id, receiver_id) DO UPDATE SET status = $4`,
            [match.id, match.senderId, match.receiverId, match.status]
        );
        return match;
    }

    async listMatches(userId) {
        const { rows } = await query(
            `SELECT m.*, u1.name as sender_name, u1.role as sender_role, u2.name as receiver_name, u2.role as receiver_role
             FROM matches m
             LEFT JOIN users u1 ON m.sender_id = u1.id
             LEFT JOIN users u2 ON m.receiver_id = u2.id
             WHERE m.sender_id = $1 OR m.receiver_id = $1`,
            [userId]
        );
        return rows;
    }

    // ── Decisions ──
    async createDecision(decision) {
        await query(
            `INSERT INTO decisions (id, startup_id, author_id, title, context, outcome, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [decision.id, decision.startupId, decision.authorId, decision.title, decision.context || '', decision.outcome || '', decision.status || 'active']
        );
        return decision;
    }

    async listDecisions(startupId, { limit = 50 } = {}) {
        const { rows } = await query(
            'SELECT * FROM decisions WHERE startup_id = $1 ORDER BY created_at DESC LIMIT $2',
            [startupId, limit]
        );
        return rows;
    }

    // ── Timeline Events ──
    async createTimelineEvent(event) {
        await query(
            `INSERT INTO timeline_events (id, startup_id, actor_id, event_type, title, description, metadata)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [event.id, event.startupId, event.actorId, event.eventType, event.title, event.description || '', JSON.stringify(event.metadata || {})]
        );
        return event;
    }

    async listTimeline(startupId, { limit = 100, eventType } = {}) {
        let sql = 'SELECT * FROM timeline_events';
        const params = [];
        if (startupId) {
            sql += ' WHERE startup_id = $1';
            params.push(startupId);
        }
        if (eventType) {
            sql += params.length > 0 ? ' AND event_type = $2' : ' WHERE event_type = $1';
            params.push(eventType);
        }
        sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
        params.push(limit);
        const { rows } = await query(sql, params);
        return rows;
    }

    // ── Opportunities ──
    async listOpportunities({ geography, industry, stage, type, limit = 50 } = {}) {
        const { rows } = await query('SELECT * FROM opportunities ORDER BY created_at DESC LIMIT $1', [limit]);
        return filterOpportunities(rows, { geography, industry, stage, type });
    }

    async createOpportunity(opp) {
        await query(
            `INSERT INTO opportunities (id, title, type, organization, description, geography, industries, stages, deadline, link)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [opp.id, opp.title, opp.type, opp.organization, opp.description, opp.geography, opp.industries, opp.stages, opp.deadline || null, opp.link || null]
        );
        return opp;
    }

    // ── Signal History ──
    async saveSignalHistory(entry) {
        await query(
            `INSERT INTO signal_history (id, startup_id, signal_data, relevance, is_read)
             VALUES ($1, $2, $3, $4, $5)`,
            [entry.id, entry.startupId, JSON.stringify(entry.signalData), entry.relevance || 'medium', false]
        );
        return entry;
    }

    async listSignalHistory(startupId, { limit = 100 } = {}) {
        const { rows } = await query(
            'SELECT * FROM signal_history WHERE startup_id = $1 ORDER BY created_at DESC LIMIT $2',
            [startupId, limit]
        );
        return rows;
    }

    // ── Bounties ──
    async createBounty(bounty) {
        await query(
            `INSERT INTO bounties (id, startup_id, title, description, points, reward, status, submissions)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [bounty.id, bounty.startupId, bounty.title, bounty.description, bounty.points, bounty.reward, bounty.status || 'open', JSON.stringify(bounty.submissions || [])]
        );
        return bounty;
    }

    async listBounties({ startupId, status, limit = 50 } = {}) {
        let sql = 'SELECT * FROM bounties WHERE 1=1';
        let params = [];
        if (startupId) {
            params.push(startupId);
            sql += ` AND startup_id = $${params.length}`;
        }
        if (status) {
            params.push(status);
            sql += ` AND status = $${params.length}`;
        }
        params.push(limit);
        sql += ` ORDER BY created_at DESC LIMIT $${params.length}`;
        const { rows } = await query(sql, params);
        return rows;
    }

    async updateBounty(id, updates) {
        const setCols = [];
        const params = [id];
        let idx = 2;
        if (updates.status !== undefined) {
            setCols.push(`status = $${idx++}`);
            params.push(updates.status);
        }
        if (updates.submissions !== undefined) {
            setCols.push(`submissions = $${idx++}`);
            params.push(JSON.stringify(updates.submissions));
        }
        
        if (setCols.length === 0) return null;
        setCols.push(`updated_at = NOW()`);
        
        const { rows } = await query(
            `UPDATE bounties SET ${setCols.join(', ')} WHERE id = $1 RETURNING *`,
            params
        );
        return rows[0];
    }

    // ── Briefs ──
    async getBrief(id) {
        const { rows } = await query(
            'SELECT * FROM briefs WHERE id = $1 LIMIT 1',
            [id]
        );
        return rows[0] || null;
    }

    async createBrief(brief) {
        await query(
            `INSERT INTO briefs (id, startup_id, title, content)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (id) DO UPDATE SET
                title = EXCLUDED.title,
                content = EXCLUDED.content,
                updated_at = NOW()`,
            [brief.id, brief.startupId || brief.startup_id, brief.title, brief.content]
        );
        return brief;
    }

    async listBriefs(startupId) {
        const { rows } = await query(
            'SELECT * FROM briefs WHERE startup_id = $1 ORDER BY created_at DESC',
            [startupId]
        );
        return rows;
    }

    // ── Cap Tables ──
    async saveCapTable(capTable) {
        const { rows } = await query(
            `INSERT INTO cap_tables (id, startup_id, version_name, state)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (id) DO UPDATE SET state = $4, version_name = $3, updated_at = NOW()
             RETURNING *`,
            [capTable.id, capTable.startupId, capTable.versionName || 'Current', JSON.stringify(capTable.state || {})]
        );
        return rows[0];
    }

    async getCapTable(startupId) {
        const { rows } = await query(
            'SELECT * FROM cap_tables WHERE startup_id = $1 ORDER BY updated_at DESC LIMIT 1',
            [startupId]
        );
        return rows[0] || null;
    }
}

// ═══════════════════════════════════════════════════════════════
//  File-Based Store Implementation
// ═══════════════════════════════════════════════════════════════
class FileStartupStore {
    constructor(baseDir) {
        this.dataDir = baseDir || getWritableDataDir();
        this.startupsPath = path.join(this.dataDir, 'startups.json');
        this.postsPath = path.join(this.dataDir, 'posts.json');
        this.matchesPath = path.join(this.dataDir, 'matches.json');
        this.decisionsPath = path.join(this.dataDir, 'decisions.json');
        this.timelinePath = path.join(this.dataDir, 'timeline.json');
        this.opportunitiesPath = path.join(this.dataDir, 'opportunities.json');
        this.signalHistoryPath = path.join(this.dataDir, 'signal_history.json');
        this.bountiesPath = path.join(this.dataDir, 'bounties.json');
        this.briefsPath = path.join(this.dataDir, 'briefs.json');
        this.capTablesPath = path.join(this.dataDir, 'cap_tables.json');
        this.ready = false;
    }

    async init() {
        await fs.mkdir(this.dataDir, { recursive: true });
        const files = [
            this.startupsPath, this.postsPath, this.matchesPath,
            this.decisionsPath, this.timelinePath, this.signalHistoryPath,
            this.bountiesPath, this.briefsPath, this.capTablesPath
        ];
        for (const filePath of files) {
            try {
                await fs.access(filePath);
            } catch {
                await fs.writeFile(filePath, '[]\n');
            }
        }
        // Seed opportunities if file doesn't exist
        try {
            await fs.access(this.opportunitiesPath);
        } catch {
            await fs.writeFile(this.opportunitiesPath, JSON.stringify(SEED_OPPORTUNITIES, null, 2) + '\n');
        }
        this.ready = true;
    }

    async readJson(filePath) {
        await this.ensureReady();
        const raw = await fs.readFile(filePath, 'utf8');
        return JSON.parse(raw || '[]');
    }

    async writeJson(filePath, data) {
        await this.ensureReady();
        const tmpPath = `${filePath}.${crypto.randomUUID()}.tmp`;
        await fs.writeFile(tmpPath, `${JSON.stringify(data, null, 2)}\n`);
        await fs.rename(tmpPath, filePath);
    }

    async ensureReady() {
        if (!this.ready) await this.init();
    }

    // ── Startups ──
    async getStartup(id) {
        const startups = await this.readJson(this.startupsPath);
        return startups.find(s => s.id === id) || null;
    }

    async getStartupByOwner(ownerId) {
        const startups = await this.readJson(this.startupsPath);
        return startups.find(s => s.ownerId === ownerId || s.owner_id === ownerId) || null;
    }

    async saveStartup(startup) {
        startup.score = calculateStartupScore(startup);
        const release = await lockManager.acquire(this.startupsPath);
        try {
            const startups = await this.readJson(this.startupsPath);
            const index = startups.findIndex(s => s.id === startup.id);
            if (index !== -1) {
                startups[index] = { ...startups[index], ...startup, updatedAt: new Date().toISOString() };
            } else {
                startups.push({
                    ...startup,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
            await this.writeJson(this.startupsPath, startups);
            return startup;
        } finally {
            release();
        }
    }

    async updateStartup(id, updates) {
        const existing = await this.getStartup(id);
        if (!existing) return null;
        const merged = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };
        return this.saveStartup(merged);
    }

    async listStartups({ limit = 20 } = {}) {
        const startups = await this.readJson(this.startupsPath);
        return startups
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, limit);
    }

    async getTrendingStartups({ limit = 10 } = {}) {
        return this.listStartups({ limit });
    }

    // ── Posts ──
    async createPost(post) {
        const release = await lockManager.acquire(this.postsPath);
        try {
            const posts = await this.readJson(this.postsPath);
            const newPost = {
                ...post,
                createdAt: new Date().toISOString()
            };
            posts.unshift(newPost);
            await this.writeJson(this.postsPath, posts);
            return newPost;
        } finally {
            release();
        }
    }

    async listPosts({ limit = 50 } = {}) {
        const posts = await this.readJson(this.postsPath);
        const startups = await this.readJson(this.startupsPath);
        return posts.slice(0, limit).map(post => {
            const startup = startups.find(s => s.id === post.startupId);
            return {
                ...post,
                startupName: startup ? startup.name : 'Independent Founder',
                startupLogo: startup ? startup.logoUrl || startup.logo_url : null,
                authorName: post.authorName || 'Founder'
            };
        });
    }

    async getPost(id) {
        const posts = await this.readJson(this.postsPath);
        const post = posts.find(p => p.id === id);
        if (!post) return null;
        
        const startups = await this.readJson(this.startupsPath);
        const startup = startups.find(s => s.id === post.startupId);
        return {
            ...post,
            startupName: startup ? startup.name : 'Independent Founder',
            startupLogo: startup ? startup.logoUrl || startup.logo_url : null,
            authorName: post.authorName || 'Founder'
        };
    }

    async updatePost(id, updates) {
        const release = await lockManager.acquire(this.postsPath);
        try {
            const posts = await this.readJson(this.postsPath);
            const index = posts.findIndex(p => p.id === id);
            if (index === -1) return null;
            
            const existing = posts[index];
            const updated = {
                ...existing,
                ...updates,
                metadata: {
                    ...(existing.metadata || {}),
                    ...(updates.metadata || {})
                }
            };
            posts[index] = updated;
            await this.writeJson(this.postsPath, posts);
            
            const startups = await this.readJson(this.startupsPath);
            const startup = startups.find(s => s.id === updated.startupId);
            return {
                ...updated,
                startupName: startup ? startup.name : 'Independent Founder',
                startupLogo: startup ? startup.logoUrl || startup.logo_url : null,
                authorName: updated.authorName || 'Founder'
            };
        } finally {
            release();
        }
    }

    // ── Matches ──
    async createMatch(match) {
        const release = await lockManager.acquire(this.matchesPath);
        try {
            const matches = await this.readJson(this.matchesPath);
            const index = matches.findIndex(m => m.senderId === match.senderId && m.receiverId === match.receiverId);
            if (index !== -1) {
                matches[index].status = match.status;
            } else {
                matches.push({
                    id: match.id || crypto.randomUUID(),
                    senderId: match.senderId,
                    receiverId: match.receiverId,
                    status: match.status || 'pending',
                    createdAt: new Date().toISOString()
                });
            }
            await this.writeJson(this.matchesPath, matches);
            return match;
        } finally {
            release();
        }
    }

    async listMatches(userId) {
        const matches = await this.readJson(this.matchesPath);
        return matches.filter(m => m.senderId === userId || m.receiverId === userId);
    }

    // ── Decisions ──
    async createDecision(decision) {
        const release = await lockManager.acquire(this.decisionsPath);
        try {
            const decisions = await this.readJson(this.decisionsPath);
            decisions.unshift({ ...decision, createdAt: new Date().toISOString() });
            await this.writeJson(this.decisionsPath, decisions);
            return decision;
        } finally {
            release();
        }
    }

    async listDecisions(startupId, { limit = 50 } = {}) {
        const decisions = await this.readJson(this.decisionsPath);
        return decisions.filter(d => d.startupId === startupId).slice(0, limit);
    }

    // ── Timeline Events ──
    async createTimelineEvent(event) {
        const release = await lockManager.acquire(this.timelinePath);
        try {
            const events = await this.readJson(this.timelinePath);
            events.unshift({ ...event, createdAt: new Date().toISOString() });
            await this.writeJson(this.timelinePath, events);
            return event;
        } finally {
            release();
        }
    }

    async listTimeline(startupId, { limit = 100, eventType } = {}) {
        const events = await this.readJson(this.timelinePath);
        let filtered = startupId ? events.filter(e => e.startupId === startupId) : events;
        if (eventType) {
            filtered = filtered.filter(e => (e.eventType || e.event_type) === eventType);
        }
        return filtered.slice(0, limit);
    }

    // ── Opportunities ──
    async listOpportunities({ geography, industry, stage, type, limit = 50 } = {}) {
        const opps = await this.readJson(this.opportunitiesPath);
        return filterOpportunities(opps, { geography, industry, stage, type }).slice(0, limit);
    }

    async createOpportunity(opp) {
        const release = await lockManager.acquire(this.opportunitiesPath);
        try {
            const opps = await this.readJson(this.opportunitiesPath);
            opps.unshift({ ...opp, createdAt: new Date().toISOString() });
            await this.writeJson(this.opportunitiesPath, opps);
            return opp;
        } finally {
            release();
        }
    }

    // ── Signal History ──
    async saveSignalHistory(entry) {
        const release = await lockManager.acquire(this.signalHistoryPath);
        try {
            const history = await this.readJson(this.signalHistoryPath);
            history.unshift({ ...entry, createdAt: new Date().toISOString() });
            await this.writeJson(this.signalHistoryPath, history);
            return entry;
        } finally {
            release();
        }
    }

    async listSignalHistory(startupId, { limit = 100 } = {}) {
        const history = await this.readJson(this.signalHistoryPath);
        return history.filter(h => h.startupId === startupId).slice(0, limit);
    }

    // ── Bounties ──
    async createBounty(bounty) {
        const release = await lockManager.acquire(this.bountiesPath);
        try {
            const bounties = await this.readJson(this.bountiesPath);
            bounties.unshift({ ...bounty, createdAt: new Date().toISOString() });
            await this.writeJson(this.bountiesPath, bounties);
            return bounty;
        } finally {
            release();
        }
    }

    async listBounties({ startupId, status, limit = 50 } = {}) {
        const bounties = await this.readJson(this.bountiesPath);
        return bounties.filter(b => {
            if (startupId && b.startupId !== startupId) return false;
            if (status && b.status !== status) return false;
            return true;
        }).slice(0, limit);
    }

    async updateBounty(id, updates) {
        const release = await lockManager.acquire(this.bountiesPath);
        try {
            const bounties = await this.readJson(this.bountiesPath);
            const index = bounties.findIndex(b => b.id === id);
            if (index === -1) return null;
            bounties[index] = { ...bounties[index], ...updates, updatedAt: new Date().toISOString() };
            await this.writeJson(this.bountiesPath, bounties);
            return bounties[index];
        } finally {
            release();
        }
    }

    // ── Briefs ──
    async getBrief(id) {
        const briefs = await this.readJson(this.briefsPath);
        return briefs.find(b => b.id === id) || null;
    }

    async createBrief(brief) {
        const release = await lockManager.acquire(this.briefsPath);
        try {
            const briefs = await this.readJson(this.briefsPath);
            const index = briefs.findIndex(b => b.id === brief.id);
            const merged = { 
                ...brief, 
                startupId: brief.startupId || brief.startup_id,
                updatedAt: new Date().toISOString() 
            };
            if (index !== -1) {
                briefs[index] = { ...briefs[index], ...merged };
            } else {
                merged.createdAt = merged.updatedAt;
                briefs.unshift(merged);
            }
            await this.writeJson(this.briefsPath, briefs);
            return merged;
        } finally {
            release();
        }
    }

    async listBriefs(startupId) {
        const briefs = await this.readJson(this.briefsPath);
        return briefs.filter(b => (b.startupId || b.startup_id) === startupId);
    }

    // ── Cap Tables ──
    async saveCapTable(capTable) {
        const release = await lockManager.acquire(this.capTablesPath);
        try {
            const capTables = await this.readJson(this.capTablesPath);
            const index = capTables.findIndex(c => c.id === capTable.id);
            const merged = { ...capTable, updatedAt: new Date().toISOString() };
            if (index !== -1) {
                capTables[index] = merged;
            } else {
                merged.createdAt = merged.updatedAt;
                capTables.unshift(merged);
            }
            await this.writeJson(this.capTablesPath, capTables);
            return merged;
        } finally {
            release();
        }
    }

    async getCapTable(startupId) {
        const capTables = await this.readJson(this.capTablesPath);
        const filtered = capTables.filter(c => c.startupId === startupId);
        if (filtered.length === 0) return null;
        return filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
    }
}

// ═══════════════════════════════════════════════════════════════
//  Utility Functions
// ═══════════════════════════════════════════════════════════════

function filterOpportunities(opps, { geography, industry, stage, type } = {}) {
    return opps.filter(opp => {
        if (type && opp.type !== type) return false;
        if (geography) {
            const oppGeo = (opp.geography || '').toLowerCase();
            const filterGeo = geography.toLowerCase();
            if (oppGeo !== 'global' && !oppGeo.includes(filterGeo) && !filterGeo.includes(oppGeo)) return false;
        }
        if (industry) {
            const oppInd = (opp.industries || '').toLowerCase();
            const filterInd = industry.toLowerCase();
            if (oppInd !== 'any' && !oppInd.split(',').some(i => filterInd.includes(i.trim()) || i.trim().includes(filterInd))) return false;
        }
        if (stage) {
            const oppStages = (opp.stages || '').toLowerCase();
            if (oppStages && !oppStages.includes(stage.toLowerCase())) return false;
        }
        return true;
    });
}

function getMatchedSchemes(geography, industry) {
    const geoLower = String(geography || '').toLowerCase();
    const indLower = String(industry || '').toLowerCase();

    return MOCK_SCHEMES.filter(scheme => {
        const matchGeo = scheme.geography === 'Any' || geoLower.includes(scheme.geography.toLowerCase()) || scheme.geography.toLowerCase().includes(geoLower);
        const matchInd = scheme.industry === 'Any' || scheme.industry.toLowerCase().split(', ').some(ind => indLower.includes(ind) || ind.includes(indLower));
        return matchGeo && matchInd;
    });
}

module.exports = {
    PgStartupStore,
    FileStartupStore,
    getMatchedSchemes,
    SEED_OPPORTUNITIES
};
