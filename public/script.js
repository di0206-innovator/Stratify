const PROFILE_KEY = 'neuralbi.founderProfile.v2';
const HISTORY_KEY = 'neuralbi.reportHistory.v2';

document.addEventListener('DOMContentLoaded', () => {
    const state = {
        profile: loadJson(PROFILE_KEY),
        history: loadJson(HISTORY_KEY) || [],
        lastReport: null
    };

    const elements = {
        onboardingPanel: document.getElementById('onboardingPanel'),
        workspaceView: document.getElementById('workspaceView'),
        profileView: document.getElementById('profileView'),
        historyView: document.getElementById('historyView'),
        profileForm: document.getElementById('profileForm'),
        profileSummary: document.getElementById('profileSummary'),
        queryInput: document.getElementById('queryInput'),
        reportType: document.getElementById('reportType'),
        audience: document.getElementById('audience'),
        timeHorizon: document.getElementById('timeHorizon'),
        sourceList: document.getElementById('sourceList'),
        addSourceBtn: document.getElementById('addSourceBtn'),
        analyzeBtn: document.getElementById('analyzeBtn'),
        formError: document.getElementById('formError'),
        reportTitle: document.getElementById('reportTitle'),
        emptyState: document.getElementById('emptyState'),
        reportContent: document.getElementById('reportContent'),
        copyReportBtn: document.getElementById('copyReportBtn'),
        downloadReportBtn: document.getElementById('downloadReportBtn'),
        resetProfileBtn: document.getElementById('resetProfileBtn'),
        modeStatus: document.getElementById('modeStatus'),
        intelStatus: document.getElementById('intelStatus'),
        sourceStatus: document.getElementById('sourceStatus')
    };

    const agents = {
        founder: document.getElementById('agent-founder'),
        research: document.getElementById('agent-research'),
        analyst: document.getElementById('agent-analyst'),
        strategy: document.getElementById('agent-strategy'),
        coach: document.getElementById('agent-coach'),
        composer: document.getElementById('agent-composer')
    };

    function initialize() {
        bindEvents();
        loadHealth();
        renderSourceBuilder();
        if (state.profile) {
            showWorkspace();
        }
    }

    function bindEvents() {
        elements.profileForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const profile = Object.fromEntries(new FormData(elements.profileForm).entries());
            state.profile = profile;
            saveJson(PROFILE_KEY, profile);
            showWorkspace();
        });

        document.querySelectorAll('.nav-item').forEach((button) => {
            button.addEventListener('click', () => switchView(button.dataset.view));
        });

        elements.resetProfileBtn.addEventListener('click', () => {
            localStorage.removeItem(PROFILE_KEY);
            state.profile = null;
            elements.onboardingPanel.classList.remove('hidden');
            elements.workspaceView.classList.add('hidden');
            switchView('workspace');
        });

        elements.addSourceBtn.addEventListener('click', () => addSourceCard());
        elements.analyzeBtn.addEventListener('click', generateReport);
        elements.copyReportBtn.addEventListener('click', copyReport);
        elements.downloadReportBtn.addEventListener('click', downloadReport);
    }

    function showWorkspace() {
        elements.onboardingPanel.classList.add('hidden');
        elements.workspaceView.classList.remove('hidden');
        renderProfileSummary();
        renderProfileView();
        renderHistory();
        switchView('workspace');
    }

    function switchView(view) {
        document.querySelectorAll('.nav-item').forEach((button) => {
            button.classList.toggle('active', button.dataset.view === view);
        });

        elements.workspaceView.classList.toggle('hidden', view !== 'workspace' || !state.profile);
        elements.profileView.classList.toggle('hidden', view !== 'profile');
        elements.historyView.classList.toggle('hidden', view !== 'history');
        if (!state.profile && view === 'workspace') {
            elements.onboardingPanel.classList.remove('hidden');
        } else {
            elements.onboardingPanel.classList.add('hidden');
        }
    }

    function renderProfileSummary() {
        const p = state.profile;
        elements.profileSummary.innerHTML = `
            <strong>${escapeHtml(label(p.founderType))} · ${escapeHtml(label(p.startupStage))}</strong>
            ${escapeHtml(p.product)} for ${escapeHtml(p.targetCustomer)} in ${escapeHtml(p.geography)}.
            <br>Goal: ${escapeHtml(p.currentGoal)}
        `;
    }

    function renderProfileView() {
        if (!state.profile) return;
        elements.profileView.innerHTML = `
            <div class="query-panel">
                <p class="eyebrow">Founder Profile</p>
                <h2>Your strategic context</h2>
                ${Object.entries(state.profile).map(([key, value]) => `
                    <div class="report-section">
                        <strong>${escapeHtml(label(key))}</strong>
                        <p>${escapeHtml(value || 'Not provided')}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function renderHistory() {
        elements.historyView.innerHTML = `
            <div class="query-panel">
                <p class="eyebrow">Report History</p>
                <h2>Recent founder reports</h2>
                ${state.history.length ? state.history.map((report) => `
                    <div class="history-item">
                        <strong>${escapeHtml(report.title)}</strong>
                        <p>${new Date(report.generatedAt).toLocaleString()}</p>
                        <button class="secondary-btn" data-report-id="${report.id}">Open report</button>
                    </div>
                `).join('') : '<p>No reports generated yet.</p>'}
            </div>
        `;

        elements.historyView.querySelectorAll('[data-report-id]').forEach((button) => {
            button.addEventListener('click', () => {
                const report = state.history.find((item) => item.id === button.dataset.reportId);
                if (report) {
                    renderReport(report);
                    switchView('workspace');
                }
            });
        });
    }

    function renderSourceBuilder() {
        elements.sourceList.innerHTML = '';
        addSourceCard();
    }

    function addSourceCard(source = {}) {
        const card = document.createElement('div');
        card.className = 'source-card';
        card.innerHTML = `
            <label>Title<input data-source-field="title" placeholder="Customer notes, competitor page" value="${escapeAttr(source.title || '')}"></label>
            <label>URL<input data-source-field="url" placeholder="https://example.com" value="${escapeAttr(source.url || '')}"></label>
            <label>Summary<textarea data-source-field="summary" placeholder="Paste the useful signal, customer quote, or source summary.">${escapeHtml(source.summary || '')}</textarea></label>
            <button class="secondary-btn" type="button">Remove source</button>
        `;
        card.querySelector('button').addEventListener('click', () => card.remove());
        elements.sourceList.appendChild(card);
    }

    function collectSources() {
        return [...elements.sourceList.querySelectorAll('.source-card')]
            .map((card) => ({
                title: card.querySelector('[data-source-field="title"]').value.trim(),
                url: card.querySelector('[data-source-field="url"]').value.trim(),
                summary: card.querySelector('[data-source-field="summary"]').value.trim()
            }))
            .filter((source) => source.title || source.url || source.summary);
    }

    async function generateReport() {
        elements.formError.textContent = '';
        const query = elements.queryInput.value.trim();

        if (!state.profile) {
            elements.formError.textContent = 'Complete founder onboarding first.';
            return;
        }

        if (query.length < 8) {
            elements.formError.textContent = 'Ask a founder problem with at least 8 characters.';
            return;
        }

        setLoading(true);
        resetAgents();
        elements.reportTitle.textContent = 'Building founder report...';
        elements.emptyState.classList.remove('hidden');
        elements.emptyState.innerHTML = '<strong>Agent pipeline running...</strong><span>Planning research, gathering signals, and composing execution steps.</span>';
        elements.reportContent.classList.add('hidden');

        try {
            setAgent('founder', 'Mapping founder context...', true);
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query,
                    sources: collectSources(),
                    founderProfile: state.profile,
                    reportOptions: {
                        reportType: elements.reportType.value,
                        audience: elements.audience.value,
                        timeHorizon: elements.timeHorizon.value
                    }
                })
            });

            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.details ? payload.details.join(' ') : payload.error || 'Report generation failed.');
            }

            await playAgentLogs(payload.report.agentLogs);
            renderReport(payload.report);
            addToHistory(payload.report);
        } catch (error) {
            elements.formError.textContent = error.message;
            elements.emptyState.innerHTML = '<strong>Report could not be generated.</strong><span>Review the profile, sources, or API configuration and try again.</span>';
        } finally {
            setLoading(false);
        }
    }

    async function playAgentLogs(logs = []) {
        for (const item of logs) {
            setAgent(item.id, item.message, true);
            await new Promise((resolve) => setTimeout(resolve, 180));
            setAgent(item.id, item.message, false, true);
        }
    }

    function renderReport(report) {
        state.lastReport = report;
        elements.reportTitle.textContent = report.title;
        elements.emptyState.classList.add('hidden');
        elements.reportContent.classList.remove('hidden');
        elements.copyReportBtn.disabled = false;
        elements.downloadReportBtn.disabled = false;
        elements.sourceStatus.innerHTML = report.sources.length
            ? report.sources.slice(0, 8).map((source) => source.url
                ? `<a class="source-link" href="${escapeAttr(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.title)}</a>`
                : `<div class="source-link">${escapeHtml(source.title)}</div>`).join('')
            : 'No external sources available.';

        const s = report.sections;
        elements.reportContent.innerHTML = DOMPurify.sanitize(`
            <div class="report-meta">
                <span class="badge">${escapeHtml(report.mode === 'live' ? 'Live Gemini' : 'Demo strategy')}</span>
                <span class="badge">${escapeHtml(report.intelligenceMode === 'live_web' ? 'Live web intelligence' : 'Demo grounding')}</span>
                <span class="badge">${escapeHtml(new Date(report.generatedAt).toLocaleString())}</span>
            </div>
            ${section('Executive Snapshot', `<p>${escapeHtml(s.executiveSnapshot)}</p>`)}
            ${section('Founder Context', `<p>${escapeHtml(s.founderContext)}</p>`)}
            ${section('Real-Time Market Signals', list(s.marketSignals))}
            ${section('Opportunity Thesis', `<p>${escapeHtml(s.opportunityThesis)}</p>`)}
            ${section('Recommendations', list(s.recommendations))}
            ${section('7-Day Sprint', list(s.actionPlan.sevenDaySprint))}
            ${section('30-Day Roadmap', list(s.actionPlan.thirtyDayRoadmap))}
            ${section('Validation Checklist', list(s.actionPlan.validationChecklist))}
            ${section('Risks', list(s.risks))}
            ${section('Assumptions', list(s.assumptions))}
        `);
    }

    function section(title, body) {
        return `<article class="report-section"><h3>${escapeHtml(title)}</h3>${body}</article>`;
    }

    function list(items = []) {
        return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
    }

    function addToHistory(report) {
        state.history = [report, ...state.history.filter((item) => item.id !== report.id)].slice(0, 12);
        saveJson(HISTORY_KEY, state.history);
        renderHistory();
    }

    async function copyReport() {
        if (!state.lastReport) return;
        await navigator.clipboard.writeText(state.lastReport.markdown);
        elements.copyReportBtn.textContent = 'Copied';
        setTimeout(() => { elements.copyReportBtn.textContent = 'Copy'; }, 1200);
    }

    function downloadReport() {
        if (!state.lastReport) return;
        const blob = new Blob([state.lastReport.markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${state.lastReport.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.md`;
        link.click();
        URL.revokeObjectURL(url);
    }

    function resetAgents() {
        Object.entries(agents).forEach(([id, node]) => {
            node.classList.remove('active', 'complete');
            node.querySelector('span').textContent = 'Waiting';
        });
    }

    function setAgent(id, message, active = false, complete = false) {
        const node = agents[id];
        if (!node) return;
        node.classList.toggle('active', active);
        node.classList.toggle('complete', complete);
        node.querySelector('span').textContent = message;
    }

    function setLoading(isLoading) {
        elements.analyzeBtn.disabled = isLoading;
        elements.analyzeBtn.textContent = isLoading ? 'Generating...' : 'Generate Founder Report';
    }

    async function loadHealth() {
        try {
            const response = await fetch('/api/health');
            const data = await response.json();
            elements.modeStatus.textContent = data.mode === 'live' ? 'Live Gemini' : 'Demo Gemini';
            elements.intelStatus.textContent = data.intelligenceMode === 'live_web'
                ? 'Live web intelligence enabled'
                : 'Demo grounding; add TAVILY_API_KEY for real-time signals';
        } catch {
            elements.modeStatus.textContent = 'Unavailable';
            elements.intelStatus.textContent = 'Backend health check failed';
        }
    }

    initialize();
});

function saveJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function loadJson(key) {
    try {
        return JSON.parse(localStorage.getItem(key));
    } catch {
        return null;
    }
}

function label(value) {
    return String(value || '').replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#096;');
}
