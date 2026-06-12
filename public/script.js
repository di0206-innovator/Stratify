const PROFILE_KEY = 'neuralbi.founderProfile.v2';
const HISTORY_KEY = 'neuralbi.reportHistory.v2';

/**
 * Section renderers map — defines how to render each section type.
 * Each key corresponds to a section name from the backend REPORT_SECTION_MAP.
 */
const SECTION_TITLES = {
    executiveSnapshot: 'Executive Snapshot',
    founderContext: 'Founder Context',
    marketSignals: 'Real-Time Market Signals',
    opportunityThesis: 'Opportunity Thesis',
    recommendations: 'Recommendations',
    actionPlan: 'Action Plan',
    risks: 'Risks',
    assumptions: 'Assumptions',
    trendAnalysis: 'Trend Analysis',
    competitivePositioning: 'Competitive Positioning',
    targetSegment: 'Target Segment',
    channelStrategy: 'Channel Strategy',
    marketOpportunity: 'Market Opportunity',
    tractionEvidence: 'Traction Evidence',
    askAndUse: 'Ask & Use of Funds',
    threatCategories: 'Threat Categories',
    mitigationPlan: 'Mitigation Plan'
};

/**
 * Badge color accents per report type for visual differentiation.
 */
const REPORT_TYPE_ACCENTS = {
    idea_validation: '#0f766e',
    market_pulse: '#2563eb',
    competitor_brief: '#9333ea',
    gtm_strategy: '#ea580c',
    investor_memo: '#0891b2',
    risk_radar: '#dc2626',
    execution_plan: '#059669'
};

document.addEventListener('DOMContentLoaded', () => {
    const state = {
        profile: loadJson(PROFILE_KEY),
        history: loadJson(HISTORY_KEY) || [],
        lastReport: null,
        user: null,
        isDarkMode: localStorage.getItem('neuralbi.theme') === 'dark'
    };

    const elements = {
        onboardingPanel: document.getElementById('onboardingPanel'),
        workspaceView: document.getElementById('workspaceView'),
        profileView: document.getElementById('profileView'),
        historyView: document.getElementById('historyView'),
        signalsView: document.getElementById('signalsView'),
        authView: document.getElementById('authView'),
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
        sourceStatus: document.getElementById('sourceStatus'),

        // New Workspace Elements
        themeToggleBtn: document.getElementById('themeToggleBtn'),
        authBtn: document.getElementById('authBtn'),
        userStatusBadge: document.getElementById('userStatusBadge'),
        refreshSignalsBtn: document.getElementById('refreshSignalsBtn'),
        signalsGrid: document.getElementById('signalsGrid'),
        signalsStatus: document.getElementById('signalsStatus'),

        // Auth Form Cards
        loginCard: document.getElementById('loginCard'),
        registerCard: document.getElementById('registerCard'),
        verifyCard: document.getElementById('verifyCard'),
        requestResetCard: document.getElementById('requestResetCard'),
        resetPasswordCard: document.getElementById('resetPasswordCard'),

        // Auth Forms
        loginForm: document.getElementById('loginForm'),
        registerForm: document.getElementById('registerForm'),
        verifyForm: document.getElementById('verifyForm'),
        requestResetForm: document.getElementById('requestResetForm'),
        resetPasswordForm: document.getElementById('resetPasswordForm'),
        authError: document.getElementById('authError'),
        authSuccess: document.getElementById('authSuccess'),

        // Dev Mail Sandbox
        devMailSandbox: document.getElementById('devMailSandbox'),
        devMailContent: document.getElementById('devMailContent'),
        closeDevMailBtn: document.getElementById('closeDevMailBtn'),

        // Workspace Panels and Tabs
        queryPanel: document.getElementById('queryPanel'),
        reportPanel: document.getElementById('reportPanel'),
        agentPanel: document.getElementById('agentPanel'),
        workspaceTabs: document.getElementById('workspaceTabs')
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
        initTheme();
        checkSession();
        startDevMailPolling();
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

        document.querySelectorAll('.nav-item[data-view]').forEach((button) => {
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

        // Mobile Workspace Tabs toggling
        const wsTabs = document.querySelectorAll('.workspace-tab');
        const panels = [elements.queryPanel, elements.reportPanel, elements.agentPanel];

        wsTabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                wsTabs.forEach(t => t.classList.toggle('active', t === tab));
                const targetPanelId = tab.dataset.panel + 'Panel';
                panels.forEach(p => {
                    if (p) {
                        p.classList.toggle('mobile-hidden', p.id !== targetPanelId);
                    }
                });
            });
        });

        // Theme Toggle
        elements.themeToggleBtn.addEventListener('click', toggleTheme);

        // Auth Navigation Action
        elements.authBtn.addEventListener('click', () => {
            if (state.user) {
                logout();
            } else {
                switchView('auth');
                switchAuthCard('loginCard');
            }
        });

        // Auth Card Switching
        document.getElementById('toRegisterLink').addEventListener('click', (e) => {
            e.preventDefault();
            switchAuthCard('registerCard');
        });
        document.getElementById('toResetLink').addEventListener('click', (e) => {
            e.preventDefault();
            switchAuthCard('requestResetCard');
        });
        document.getElementById('toLoginLink').addEventListener('click', (e) => {
            e.preventDefault();
            switchAuthCard('loginCard');
        });
        document.getElementById('toLoginLink2').addEventListener('click', (e) => {
            e.preventDefault();
            switchAuthCard('loginCard');
        });

        // Auth Form Handlers
        elements.loginForm.addEventListener('submit', handleLogin);
        elements.registerForm.addEventListener('submit', handleRegister);
        elements.verifyForm.addEventListener('submit', handleVerify);
        elements.requestResetForm.addEventListener('submit', handleRequestReset);
        elements.resetPasswordForm.addEventListener('submit', handleResetPassword);

        // Dev Mail Widget Close
        elements.closeDevMailBtn.addEventListener('click', () => {
            elements.devMailSandbox.classList.add('hidden');
        });

        // Signals Refresh
        elements.refreshSignalsBtn.addEventListener('click', () => {
            loadSignals(true);
        });

        // Dynamic Rich Citation Tooltips
        let activeTooltip = null;

        elements.reportContent.addEventListener('mouseover', (e) => {
            const anchor = e.target.closest('.citation-ref');
            if (!anchor) return;

            const title = anchor.getAttribute('title');
            if (!title) return;

            // Prevent default tooltip
            anchor.dataset.title = title;
            anchor.removeAttribute('title');

            if (activeTooltip) {
                activeTooltip.remove();
                activeTooltip = null;
            }

            const tooltip = document.createElement('div');
            tooltip.className = 'citation-tooltip';
            
            const num = anchor.textContent.replace(/[\[\]]/g, '');
            const index = parseInt(num, 10) - 1;
            const source = state.lastReport && state.lastReport.sources && state.lastReport.sources[index];
            
            let contentHtml = `<strong>Source ${num}: ${escapeHtml(title)}</strong>`;
            if (source && source.summary) {
                contentHtml += `<p style="margin: 6px 0 0 0; font-size: 0.82rem; line-height: 1.4; color: var(--muted);">${escapeHtml(source.summary)}</p>`;
            }
            if (source && source.url) {
                contentHtml += `<small style="display: block; margin-top: 4px; color: var(--brand-2); word-break: break-all;">${escapeHtml(source.url)}</small>`;
            }

            tooltip.innerHTML = contentHtml;
            document.body.appendChild(tooltip);
            activeTooltip = tooltip;

            const rect = anchor.getBoundingClientRect();
            tooltip.style.position = 'fixed';
            tooltip.style.left = `${rect.left + window.scrollX}px`;
            tooltip.style.top = `${rect.bottom + window.scrollY + 6}px`;
            
            const tooltipRect = tooltip.getBoundingClientRect();
            if (rect.left + tooltipRect.width > window.innerWidth) {
                tooltip.style.left = `${window.innerWidth - tooltipRect.width - 12}px`;
            }
        });

        elements.reportContent.addEventListener('mouseout', (e) => {
            const anchor = e.target.closest('.citation-ref');
            if (!anchor) return;

            const storedTitle = anchor.dataset.title;
            if (storedTitle) {
                anchor.setAttribute('title', storedTitle);
                anchor.removeAttribute('data-title');
            }

            if (activeTooltip) {
                activeTooltip.remove();
                activeTooltip = null;
            }
        });
    }

    function showWorkspace() {
        elements.onboardingPanel.classList.add('hidden');
        elements.workspaceView.classList.remove('hidden');
        renderProfileSummary();
        renderProfileView();
        loadHistory();

        // Reset mobile workspace tabs to Tab 1
        const tab1 = document.querySelector('.workspace-tab[data-panel="query"]');
        if (tab1) {
            tab1.click();
        }

        switchView('workspace');
    }

    function switchView(view) {
        document.querySelectorAll('.nav-item[data-view]').forEach((button) => {
            button.classList.toggle('active', button.dataset.view === view);
        });

        elements.workspaceView.classList.toggle('hidden', view !== 'workspace' || !state.profile);
        elements.profileView.classList.toggle('hidden', view !== 'profile');
        elements.historyView.classList.toggle('hidden', view !== 'history');
        elements.signalsView.classList.toggle('hidden', view !== 'signals');
        elements.authView.classList.toggle('hidden', view !== 'auth');

        if (!state.profile && view === 'workspace') {
            elements.onboardingPanel.classList.remove('hidden');
        } else {
            elements.onboardingPanel.classList.add('hidden');
        }

        if (view === 'signals') {
            loadSignals();
        }
    }

    // ── Theme Switcher ───────────────────────────────────────────────────

    function initTheme() {
        if (state.isDarkMode) {
            document.body.classList.add('dark-theme');
            elements.themeToggleBtn.textContent = '☀️ Light Mode';
        } else {
            document.body.classList.remove('dark-theme');
            elements.themeToggleBtn.textContent = '🌙 Dark Mode';
        }
    }

    function toggleTheme() {
        state.isDarkMode = !state.isDarkMode;
        localStorage.setItem('neuralbi.theme', state.isDarkMode ? 'dark' : 'light');
        initTheme();
    }

    // ── Session & Auth Handlers ──────────────────────────────────────────

    async function checkSession() {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                state.user = data.user;
                updateAuthUI();
                await loadHistory();
            } else {
                state.user = null;
                updateAuthUI();
            }
        } catch {
            state.user = null;
            updateAuthUI();
        }
    }

    function updateAuthUI() {
        if (state.user) {
            elements.userStatusBadge.textContent = `User: ${state.user.name}`;
            elements.authBtn.textContent = 'Sign Out';
        } else {
            elements.userStatusBadge.textContent = 'Guest Mode';
            elements.authBtn.textContent = 'Sign In';
        }
    }

    async function logout() {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (err) {
            console.error('Logout failed:', err);
        }
        state.user = null;
        updateAuthUI();
        state.history = loadJson(HISTORY_KEY) || [];
        renderHistory();
        switchView('workspace');
    }

    function switchAuthCard(cardId) {
        elements.loginCard.classList.toggle('hidden', cardId !== 'loginCard');
        elements.registerCard.classList.toggle('hidden', cardId !== 'registerCard');
        elements.verifyCard.classList.toggle('hidden', cardId !== 'verifyCard');
        elements.requestResetCard.classList.toggle('hidden', cardId !== 'requestResetCard');
        elements.resetPasswordCard.classList.toggle('hidden', cardId !== 'resetPasswordCard');
        clearAuthMessages();
    }

    function clearAuthMessages() {
        elements.authError.textContent = '';
        elements.authSuccess.textContent = '';
    }

    function showAuthError(msg) {
        elements.authError.textContent = msg;
    }

    function showAuthSuccess(msg) {
        elements.authSuccess.textContent = msg;
    }

    async function handleLogin(e) {
        e.preventDefault();
        clearAuthMessages();
        const data = Object.fromEntries(new FormData(elements.loginForm).entries());
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const body = await res.json();
            if (!res.ok) {
                if (res.status === 403 && body.error && body.error.code === 'EMAIL_NOT_VERIFIED') {
                    showAuthSuccess('Account not verified. Enter verification token below.');
                    switchAuthCard('verifyCard');
                    return;
                }
                throw new Error((body.error && body.error.message) || 'Login failed');
            }
            state.user = body.user;
            updateAuthUI();
            showAuthSuccess(`Welcome back, ${state.user.name}!`);
            await loadHistory();
            setTimeout(() => showWorkspace(), 1000);
        } catch (err) {
            showAuthError(err.message);
        }
    }

    async function handleRegister(e) {
        e.preventDefault();
        clearAuthMessages();
        const data = Object.fromEntries(new FormData(elements.registerForm).entries());
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const body = await res.json();
            if (!res.ok) {
                throw new Error((body.error && body.error.message) || 'Registration failed');
            }
            showAuthSuccess('Registration successful! Enter verification token below.');
            switchAuthCard('verifyCard');
        } catch (err) {
            showAuthError(err.message);
        }
    }

    async function handleVerify(e) {
        e.preventDefault();
        clearAuthMessages();
        const data = Object.fromEntries(new FormData(elements.verifyForm).entries());
        try {
            const res = await fetch('/api/auth/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const body = await res.json();
            if (!res.ok) {
                throw new Error((body.error && body.error.message) || 'Verification failed');
            }
            showAuthSuccess('Email verified successfully! You can now log in.');
            switchAuthCard('loginCard');
        } catch (err) {
            showAuthError(err.message);
        }
    }

    async function handleRequestReset(e) {
        e.preventDefault();
        clearAuthMessages();
        const data = Object.fromEntries(new FormData(elements.requestResetForm).entries());
        try {
            const res = await fetch('/api/auth/request-password-reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) {
                const body = await res.json();
                throw new Error((body.error && body.error.message) || 'Reset request failed');
            }
            showAuthSuccess('If that email exists, a password reset token has been queued. Enter it below.');
            switchAuthCard('resetPasswordCard');
        } catch (err) {
            showAuthError(err.message);
        }
    }

    async function handleResetPassword(e) {
        e.preventDefault();
        clearAuthMessages();
        const data = Object.fromEntries(new FormData(elements.resetPasswordForm).entries());
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) {
                const body = await res.json();
                throw new Error((body.error && body.error.message) || 'Password reset failed');
            }
            showAuthSuccess('Password reset successful! You can now log in.');
            switchAuthCard('loginCard');
        } catch (err) {
            showAuthError(err.message);
        }
    }

    // ── Dev Mail Sandbox Widget Polling ──────────────────────────────────

    let devMailInterval = null;

    function startDevMailPolling() {
        fetchDevMail();
        devMailInterval = setInterval(fetchDevMail, 3000);
    }

    async function fetchDevMail() {
        try {
            const res = await fetch('/api/dev/emails');
            if (res.status === 404) {
                elements.devMailSandbox.classList.add('hidden');
                clearInterval(devMailInterval);
                return;
            }
            if (!res.ok) return;

            const data = await res.json();
            const emails = data.emails || [];

            if (!emails.length) {
                elements.devMailContent.innerHTML = '<p class="dev-mail-empty">No emails queued yet.</p>';
                return;
            }

            elements.devMailSandbox.classList.remove('hidden');

            elements.devMailContent.innerHTML = emails.map(email => {
                return `
                    <div class="dev-mail-card" style="margin-bottom: 8px;">
                        <strong>To: ${escapeHtml(email.to)}</strong>
                        <p style="margin: 2px 0;">Subject: ${escapeHtml(email.subject)}</p>
                        <p style="margin: 2px 0; color: var(--muted); font-size: 0.75rem;">Sent: ${new Date(email.createdAt).toLocaleTimeString()}</p>
                        <div style="margin-top: 4px;">
                            Token: <span class="dev-mail-token">${escapeHtml(email.token)}</span>
                        </div>
                    </div>
                `;
            }).join('');
        } catch {
            elements.devMailSandbox.classList.add('hidden');
            clearInterval(devMailInterval);
        }
    }

    // ── Live Market Signals Feed ─────────────────────────────────────────

    async function loadSignals(forceRefresh = false) {
        elements.signalsStatus.textContent = '';
        if (!state.profile) {
            elements.signalsGrid.innerHTML = '<p class="empty-signals">Complete founder onboarding first to scan market signals.</p>';
            return;
        }

        if (!forceRefresh && elements.signalsGrid.querySelector('.signal-card')) {
            return;
        }

        elements.signalsGrid.innerHTML = '<p class="empty-signals">Scanning live market news and analyzing regulatory triggers...</p>';

        try {
            const response = await fetch('/api/signals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ founderProfile: state.profile })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error((data.error && data.error.message) || 'Failed to fetch signals.');
            }

            renderSignals(data.signals || []);
        } catch (error) {
            elements.signalsStatus.textContent = error.message;
            elements.signalsGrid.innerHTML = '<p class="empty-signals">Could not load signals. Try again.</p>';
        }
    }

    function renderSignals(signals = []) {
        if (!signals.length) {
            elements.signalsGrid.innerHTML = '<p class="empty-signals">No recent market signals found for your industry segment.</p>';
            return;
        }

        elements.signalsGrid.innerHTML = signals.map(sig => {
            const impactClass = `impact-${sig.impact.toLowerCase()}`;
            const sentimentClass = `sentiment-${sig.sentiment.toLowerCase()}`;

            return `
                <div class="signal-card">
                    <div class="signal-header">
                        <span class="signal-type">${escapeHtml(sig.type)}</span>
                        <div class="signal-badges">
                            <span class="signal-badge ${impactClass}">Impact: ${escapeHtml(sig.impact)}</span>
                            <span class="signal-badge ${sentimentClass}">${escapeHtml(sig.sentiment)}</span>
                        </div>
                    </div>
                    <h3>${escapeHtml(sig.title)}</h3>
                    <p>${escapeHtml(sig.description)}</p>
                    <div class="signal-footer">
                        ${sig.source ? (sig.source.url
                            ? `<a class="signal-source" href="${escapeAttr(sig.source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(sig.source.title)}</a>`
                            : `<span class="signal-source">${escapeHtml(sig.source.title)}</span>`
                        ) : '<span class="signal-source">Internal Grounding</span>'}
                        <button class="signal-action-btn" data-analyze-query="Analyze: ${escapeAttr(sig.title)} in our market context">Analyze</button>
                    </div>
                </div>
            `;
        }).join('');

        // Bind signals actions
        elements.signalsGrid.querySelectorAll('[data-analyze-query]').forEach(btn => {
            btn.addEventListener('click', () => {
                elements.queryInput.value = btn.dataset.analyzeQuery;
                switchView('workspace');
                elements.queryInput.focus();
            });
        });
    }

    // ── Profile Summary & History ────────────────────────────────────────

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
                    <div class="report-section" style="margin-bottom: 12px;">
                        <strong>${escapeHtml(label(key))}</strong>
                        <p style="margin: 6px 0 0;">${escapeHtml(value || 'Not provided')}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async function loadHistory() {
        if (!state.user) {
            state.history = loadJson(HISTORY_KEY) || [];
            renderHistory();
            return;
        }

        try {
            const res = await fetch('/api/reports');
            if (res.ok) {
                const data = await res.json();
                state.history = data.reports || [];
                renderHistory();
            }
        } catch (err) {
            console.error('Failed to load history', err);
        }
    }

    function renderHistory() {
        elements.historyView.innerHTML = `
            <div class="query-panel">
                <p class="eyebrow">Report History</p>
                <h2>Recent founder reports</h2>
                ${state.history.length ? state.history.map((report) => `
                    <div class="history-item" id="history-item-${report.id}" style="border-top: 1px solid var(--line); padding: 14px 0;">
                        <strong>${escapeHtml(report.title)}</strong>
                        ${report.reportType ? `<span class="badge history-badge">${escapeHtml(label(report.reportType))}</span>` : ''}
                        <p style="margin: 4px 0;">${new Date(report.generatedAt).toLocaleString()}</p>
                        <div style="display: flex; gap: 8px; margin-top: 8px;">
                            <button class="secondary-btn" data-report-id="${report.id}">Open report</button>
                            <button class="secondary-btn delete-report-btn" data-delete-id="${report.id}" style="border-color: rgba(220, 38, 38, 0.35); color: var(--danger);">Delete</button>
                        </div>
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

        elements.historyView.querySelectorAll('[data-delete-id]').forEach((button) => {
            button.addEventListener('click', async () => {
                const reportId = button.dataset.deleteId;
                if (confirm('Are you sure you want to delete this report?')) {
                    if (state.user) {
                        try {
                            const res = await fetch(`/api/reports/${reportId}`, { method: 'DELETE' });
                            if (res.ok) {
                                state.history = state.history.filter(item => item.id !== reportId);
                                renderHistory();
                            }
                        } catch (err) {
                            alert('Failed to delete report on server');
                        }
                    } else {
                        state.history = state.history.filter(item => item.id !== reportId);
                        saveJson(HISTORY_KEY, state.history);
                        renderHistory();
                    }
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
            <button class="secondary-btn" type="button" style="border-color: rgba(220,38,38,0.2); color: var(--danger);">Remove source</button>
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

    // ── Report Generation ────────────────────────────────────────────────

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
        
        const agentTab = document.querySelector('.workspace-tab[data-panel="agent"]');
        if (agentTab) {
            agentTab.click();
        }

        elements.reportTitle.textContent = 'Building founder report...';
        elements.emptyState.classList.remove('hidden');
        elements.emptyState.innerHTML = '<strong>Agent pipeline running...</strong><span>Planning research, gathering signals, and composing execution steps.</span>';
        elements.reportContent.classList.add('hidden');

        try {
            setAgent('founder', 'Mapping founder context...', true);
            const response = await fetch('/api/analyze/stream', {
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

            if (!response.ok) {
                const payload = await response.json();
                throw new Error((payload.error && payload.error.message) || payload.error || 'Report generation failed.');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            
            const partialReport = {
                title: `${label(elements.reportType.value)} for ${state.profile.product || 'Startup'}`,
                generatedAt: new Date().toISOString(),
                sections: {},
                sources: [],
                founderContext: {
                    profile: state.profile,
                    reportOptions: {
                        reportType: elements.reportType.value,
                        audience: elements.audience.value,
                        timeHorizon: elements.timeHorizon.value
                    }
                }
            };

            let lastAgentId = null;
            let currentEvent = 'log';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) continue;

                    if (trimmedLine.startsWith('event: ')) {
                        currentEvent = trimmedLine.substring(7).trim();
                    } else if (trimmedLine.startsWith('data: ')) {
                        const rawData = trimmedLine.substring(6).trim();
                        try {
                            const parsedData = JSON.parse(rawData);
                            if (currentEvent === 'log') {
                                if (lastAgentId && lastAgentId !== parsedData.id) {
                                    const lastMsg = agents[lastAgentId] ? agents[lastAgentId].querySelector('span').textContent : '';
                                    setAgent(lastAgentId, lastMsg, false, true);
                                }
                                setAgent(parsedData.id, parsedData.message, true, false);
                                lastAgentId = parsedData.id;
                            } else if (currentEvent === 'sources') {
                                partialReport.sources = parsedData;
                                renderSources(parsedData);
                            } else if (currentEvent === 'analysis') {
                                partialReport.sections.marketSignals = parsedData.marketSignals;
                                partialReport.sections.risks = parsedData.risks;
                                partialReport.sections.assumptions = parsedData.assumptions;
                                const extraFields = ['trendAnalysis', 'threatCategories', 'mitigationPlan'];
                                for (const field of extraFields) {
                                    if (parsedData[field]) {
                                        partialReport.sections[field] = parsedData[field];
                                    }
                                }
                                renderPartialReport(partialReport);
                                
                                const reportTab = document.querySelector('.workspace-tab[data-panel="report"]');
                                if (reportTab && !reportTab.classList.contains('active')) {
                                    reportTab.click();
                                }
                            } else if (currentEvent === 'strategy') {
                                partialReport.sections.executiveSnapshot = parsedData.thesis;
                                partialReport.sections.opportunityThesis = parsedData.positioning;
                                partialReport.sections.recommendations = parsedData.recommendations;
                                const extraFields = [
                                    'trendAnalysis', 'competitivePositioning', 'targetSegment',
                                    'channelStrategy', 'marketOpportunity', 'tractionEvidence',
                                    'askAndUse', 'threatCategories', 'mitigationPlan'
                                ];
                                for (const field of extraFields) {
                                    if (parsedData[field]) {
                                        partialReport.sections[field] = parsedData[field];
                                    }
                                }
                                renderPartialReport(partialReport);
                            } else if (currentEvent === 'executionPlan') {
                                partialReport.sections.actionPlan = normalizeActionPlan(parsedData);
                                renderPartialReport(partialReport);
                            } else if (currentEvent === 'result') {
                                Object.keys(agents).forEach((id) => {
                                    const agentMsg = agents[id] ? agents[id].querySelector('span').textContent : '';
                                    setAgent(id, agentMsg, false, true);
                                });
                                renderReport(parsedData);
                                addToHistory(parsedData);
                            } else if (currentEvent === 'error') {
                                throw new Error(parsedData.error.message || 'Stream error');
                            }
                        } catch (err) {
                            console.error('Error handling event data:', err, trimmedLine);
                        }
                    }
                }
            }

            if (lastAgentId) {
                const lastMsg = agents[lastAgentId] ? agents[lastAgentId].querySelector('span').textContent : '';
                setAgent(lastAgentId, lastMsg, false, true);
            }

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

    function renderSources(sources = []) {
        elements.sourceStatus.innerHTML = sources.length
            ? sources.slice(0, 8).map((source, index) => source.url
                ? `<a class="source-link" href="${escapeAttr(source.url)}" target="_blank" rel="noopener noreferrer"><span class="source-index">[${index + 1}]</span> ${escapeHtml(source.title)}</a>`
                : `<div class="source-link"><span class="source-index">[${index + 1}]</span> ${escapeHtml(source.title)}</div>`).join('')
            : 'No external sources available.';
    }

    function normalizeActionPlan(actionPlan) {
        if (!actionPlan || typeof actionPlan !== 'object') return {};
        const keys = ['sevenDaySprint', 'thirtyDayRoadmap', 'validationChecklist', 'nextAssets'];
        const result = {};
        for (const key of keys) {
            const list = actionPlan[key] || [];
            result[key] = list.map((item, idx) => {
                if (item && typeof item === 'object') {
                    return {
                        id: item.id || `${key}-${idx}`,
                        text: item.text || '',
                        completed: Boolean(item.completed)
                    };
                }
                return {
                    id: `${key}-${idx}`,
                    text: String(item),
                    completed: false
                };
            });
        }
        return result;
    }

    function renderPartialReport(report) {
        const reportType = (report.founderContext && report.founderContext.reportOptions)
            ? report.founderContext.reportOptions.reportType
            : 'idea_validation';
        const accentColor = REPORT_TYPE_ACCENTS[reportType] || REPORT_TYPE_ACCENTS.idea_validation;

        elements.reportTitle.textContent = report.title;
        elements.emptyState.classList.add('hidden');
        elements.reportContent.classList.remove('hidden');
        
        elements.copyReportBtn.disabled = true;
        elements.downloadReportBtn.disabled = true;

        const sectionOrder = [
            'executiveSnapshot', 'founderContext', 'marketSignals',
            'opportunityThesis', 'recommendations', 'actionPlan',
            'risks', 'assumptions'
        ];

        const s = report.sections;
        const sectionsHtml = sectionOrder
            .filter((key) => key !== 'sources' && s[key] != null)
            .map((key) => renderSection(key, s[key], report.sources, accentColor))
            .join('');

        elements.reportContent.innerHTML = DOMPurify.sanitize(`
            <div class="report-meta">
                <span class="badge" style="border-left: 3px solid ${accentColor}">${escapeHtml(label(reportType))}</span>
                <span class="badge">Streaming Analysis...</span>
                <span class="badge">${escapeHtml(new Date(report.generatedAt).toLocaleString())}</span>
            </div>
            ${sectionsHtml}
        `);

        bindChecklistEvents();
    }

    function renderReport(report) {
        state.lastReport = report;
        const reportType = (report.founderContext && report.founderContext.reportOptions)
            ? report.founderContext.reportOptions.reportType
            : 'idea_validation';
        const accentColor = REPORT_TYPE_ACCENTS[reportType] || REPORT_TYPE_ACCENTS.idea_validation;

        elements.reportTitle.textContent = report.title;
        elements.emptyState.classList.add('hidden');
        elements.reportContent.classList.remove('hidden');
        elements.copyReportBtn.disabled = false;
        elements.downloadReportBtn.disabled = false;

        renderSources(report.sources);

        const sectionOrder = report.sectionOrder || [
            'executiveSnapshot', 'founderContext', 'marketSignals',
            'opportunityThesis', 'recommendations', 'actionPlan',
            'risks', 'assumptions'
        ];

        const s = report.sections;
        const sectionsHtml = sectionOrder
            .filter((key) => key !== 'sources' && s[key] != null)
            .map((key) => renderSection(key, s[key], report.sources, accentColor))
            .join('');

        elements.reportContent.innerHTML = DOMPurify.sanitize(`
            <div class="report-meta">
                <span class="badge" style="border-left: 3px solid ${accentColor}">${escapeHtml(label(reportType))}</span>
                <span class="badge">${escapeHtml(report.mode === 'live' ? 'Live Gemini' : 'Demo strategy')}</span>
                <span class="badge">${escapeHtml(report.intelligenceMode === 'live_web' ? 'Live web intelligence' : 'Demo grounding')}</span>
                <span class="badge">${escapeHtml(new Date(report.generatedAt).toLocaleString())}</span>
            </div>
            ${sectionsHtml}
        `);

        bindChecklistEvents();

        const reportTab = document.querySelector('.workspace-tab[data-panel="report"]');
        if (reportTab) {
            reportTab.click();
        }
    }

    function bindChecklistEvents() {
        elements.reportContent.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', async (e) => {
                const checked = e.target.checked;
                const index = parseInt(e.target.dataset.index, 10);
                const listKey = e.target.closest('ul').dataset.listKey;
                const li = e.target.closest('li');
                
                li.classList.toggle('task-completed', checked);
                
                // Update progress bar and badge
                const ul = e.target.closest('ul');
                const checkboxes = ul.querySelectorAll('.task-checkbox');
                const total = checkboxes.length;
                const completedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
                const pct = Math.round((completedCount / total) * 100);

                const badge = ul.previousElementSibling.previousElementSibling.querySelector(`[data-progress-key="${listKey}"]`);
                if (badge) {
                    badge.textContent = `${completedCount}/${total} (${pct}%)`;
                }
                const bar = ul.previousElementSibling.querySelector(`[data-bar-key="${listKey}"]`);
                if (bar) {
                    bar.style.width = `${pct}%`;
                }
                
                if (state.lastReport && state.lastReport.sections.actionPlan) {
                    const taskList = state.lastReport.sections.actionPlan[listKey];
                    if (taskList && taskList[index]) {
                        if (typeof taskList[index] === 'object') {
                            taskList[index].completed = checked;
                        } else {
                            taskList[index] = {
                                id: `${listKey}-${index}`,
                                text: String(taskList[index]),
                                completed: checked
                            };
                        }
                    }
                    
                    updateClientMarkdown(state.lastReport);
                    
                    if (state.user) {
                        try {
                            await fetch(`/api/reports/${state.lastReport.id}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    sections: {
                                        actionPlan: state.lastReport.sections.actionPlan
                                    }
                                })
                            });
                            const histItem = state.history.find(h => h.id === state.lastReport.id);
                            if (histItem) {
                                histItem.sections = state.lastReport.sections;
                                histItem.markdown = state.lastReport.markdown;
                            }
                        } catch (err) {
                            console.error('Failed to sync checklist state to server:', err);
                        }
                    } else {
                        const histItem = state.history.find(h => h.id === state.lastReport.id);
                        if (histItem) {
                            histItem.sections = state.lastReport.sections;
                            histItem.markdown = state.lastReport.markdown;
                            saveJson(HISTORY_KEY, state.history);
                        }
                    }
                }
            });
        });
    }

    function updateClientMarkdown(report) {
        let lines = [`# ${report.title}`, '', `Generated: ${report.generatedAt}`, ''];
        const sectionOrder = report.sectionOrder || [];
        const sections = report.sections;
        
        for (const key of sectionOrder) {
            if (key === 'sources') continue;
            const sectionTitle = SECTION_TITLES[key] || label(key);
            const content = sections[key];
            if (content == null) continue;
            
            lines.push(`## ${sectionTitle}`);
            
            if (key === 'actionPlan' && typeof content === 'object') {
                const printList = (listKey, subTitle) => {
                    const list = content[listKey] || [];
                    if (!list.length) return;
                    lines.push(`### ${subTitle}`);
                    list.forEach(item => {
                        const text = typeof item === 'object' ? item.text : item;
                        const completed = typeof item === 'object' ? Boolean(item.completed) : false;
                        const check = completed ? '[x]' : '[ ]';
                        lines.push(`- ${check} ${text}`);
                    });
                    lines.push('');
                };
                printList('sevenDaySprint', '7-Day Sprint');
                printList('thirtyDayRoadmap', '30-Day Roadmap');
                printList('validationChecklist', 'Validation Checklist');
                printList('nextAssets', 'Next Assets');
            } else if (Array.isArray(content)) {
                content.forEach(item => lines.push(`- ${item}`));
                lines.push('');
            } else {
                lines.push(String(content));
                lines.push('');
            }
        }
        
        if (sectionOrder.includes('sources')) {
            lines.push('## Sources');
            if (report.sources && report.sources.length) {
                report.sources.forEach((source, index) => {
                    lines.push(`${index + 1}. ${source.url ? `[${source.title}](${source.url})` : source.title} — ${source.summary}`);
                });
            } else {
                lines.push('No external sources available.');
            }
        }
        
        report.markdown = lines.join('\n');
    }

    function renderSection(key, content, sources, accentColor) {
        const title = SECTION_TITLES[key] || label(key);

        if (key === 'actionPlan' && typeof content === 'object') {
            return renderActionPlanSection(content, sources, accentColor);
        }

        if (Array.isArray(content)) {
            return `<article class="report-section" style="border-top: 2px solid ${accentColor}; margin-bottom: 14px;">
                <h3>${escapeHtml(title)}</h3>
                <ul>${content.map((item) => `<li>${parseCitations(escapeHtml(item), sources)}</li>`).join('')}</ul>
            </article>`;
        }

        return `<article class="report-section" style="border-top: 2px solid ${accentColor}; margin-bottom: 14px;">
            <h3>${escapeHtml(title)}</h3>
            <p>${parseCitations(escapeHtml(String(content)), sources)}</p>
        </article>`;
    }

    function renderActionPlanSection(plan, sources, accentColor) {
        let html = `<article class="report-section" style="border-top: 2px solid ${accentColor}; margin-bottom: 14px;">
            <h3>${escapeHtml(SECTION_TITLES.actionPlan)}</h3>`;

        const renderList = (listKey, title) => {
            const list = plan[listKey] || [];
            if (!list.length) return '';
            const total = list.length;
            const completedCount = list.filter(item => item && typeof item === 'object' && item.completed).length;
            const pct = Math.round((completedCount / total) * 100);

            let listHtml = `
                <div class="checklist-header-row">
                    <h4>${title}</h4>
                    <div class="progress-badge" data-progress-key="${listKey}">${completedCount}/${total} (${pct}%)</div>
                </div>
                <div class="checklist-progress-track">
                    <div class="checklist-progress-bar" data-bar-key="${listKey}" style="width: ${pct}%;"></div>
                </div>
                <ul class="interactive-checklist" data-list-key="${listKey}">`;
            listHtml += list.map((item, index) => {
                const text = (item && typeof item === 'object') ? item.text : item;
                const completed = (item && typeof item === 'object') ? Boolean(item.completed) : false;
                const checkedAttr = completed ? 'checked' : '';
                const completedClass = completed ? 'task-completed' : '';
                return `
                    <li class="checklist-item ${completedClass}" style="margin-bottom: 8px;">
                        <label class="checklist-label">
                            <input type="checkbox" class="task-checkbox" data-index="${index}" ${checkedAttr}>
                            <span class="task-text">${parseCitations(escapeHtml(text), sources)}</span>
                        </label>
                    </li>
                `;
            }).join('');
            listHtml += '</ul>';
            return listHtml;
        };

        html += renderList('sevenDaySprint', '7-Day Sprint');
        html += renderList('thirtyDayRoadmap', '30-Day Roadmap');
        html += renderList('validationChecklist', 'Validation Checklist');
        html += renderList('nextAssets', 'Next Assets');
        html += '</article>';
        return html;
    }

    /**
     * Parse [Source N] citations in text and render as clickable links.
     */
    function parseCitations(text, sources = []) {
        return text.replace(/\[Source\s+(\d+)\]/gi, (match, num) => {
            const index = parseInt(num, 10) - 1;
            const source = sources[index];
            if (!source) return match;
            if (source.url) {
                return `<a class="citation-ref" href="${escapeAttr(source.url)}" target="_blank" rel="noopener noreferrer" title="${escapeAttr(source.title)}">[${num}]</a>`;
            }
            return `<span class="citation-ref" title="${escapeAttr(source.title)}">[${num}]</span>`;
        });
    }

    function addToHistory(report) {
        if (state.user) {
            loadHistory();
            return;
        }

        const reportType = (report.founderContext && report.founderContext.reportOptions)
            ? report.founderContext.reportOptions.reportType
            : undefined;
        const historyEntry = {
            id: report.id,
            title: report.title,
            generatedAt: report.generatedAt,
            reportType,
            mode: report.mode,
            intelligenceMode: report.intelligenceMode,
            sections: report.sections,
            sectionOrder: report.sectionOrder,
            sources: report.sources,
            founderContext: report.founderContext,
            markdown: report.markdown
        };
        state.history = [historyEntry, ...state.history.filter((item) => item.id !== report.id)].slice(0, 12);
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
