const FOUNDER_TYPES = ['technical', 'business', 'solo', 'student', 'domain_expert', 'repeat_founder'];
const STARTUP_STAGES = ['idea', 'validating', 'mvp', 'launched', 'raising', 'scaling'];
const REPORT_TYPES = ['market_pulse', 'idea_validation', 'competitor_brief', 'gtm_strategy', 'investor_memo', 'risk_radar', 'execution_plan'];
const AUDIENCES = ['founder', 'investor', 'operator', 'executive'];
const TIME_HORIZONS = ['7_days', '30_days', '90_days', '12_months'];

function normalizeFounderProfile(value = {}) {
    const profile = value && typeof value === 'object' && !Array.isArray(value) ? value : {};

    return {
        founderType: enumOrDefault(profile.founderType, FOUNDER_TYPES, 'solo'),
        startupStage: enumOrDefault(profile.startupStage, STARTUP_STAGES, 'idea'),
        industry: clean(profile.industry || ''),
        geography: clean(profile.geography || ''),
        product: clean(profile.product || ''),
        targetCustomer: clean(profile.targetCustomer || ''),
        teamSize: clean(profile.teamSize || ''),
        budget: clean(profile.budget || ''),
        timeline: clean(profile.timeline || ''),
        currentGoal: clean(profile.currentGoal || '')
    };
}

function normalizeReportOptions(value = {}) {
    const options = value && typeof value === 'object' && !Array.isArray(value) ? value : {};

    return {
        reportType: enumOrDefault(options.reportType, REPORT_TYPES, 'idea_validation'),
        audience: enumOrDefault(options.audience, AUDIENCES, 'founder'),
        timeHorizon: enumOrDefault(options.timeHorizon, TIME_HORIZONS, '30_days')
    };
}

function validateFounderContext(profile, options) {
    const errors = [];

    if (!profile.industry) errors.push('Founder profile needs an industry.');
    if (!profile.geography) errors.push('Founder profile needs a geography.');
    if (!profile.product) errors.push('Founder profile needs a product or startup idea.');
    if (!profile.targetCustomer) errors.push('Founder profile needs a target customer.');
    if (!profile.currentGoal) errors.push('Founder profile needs a current goal.');

    if (!REPORT_TYPES.includes(options.reportType)) errors.push('Unsupported report type.');
    if (!AUDIENCES.includes(options.audience)) errors.push('Unsupported audience.');
    if (!TIME_HORIZONS.includes(options.timeHorizon)) errors.push('Unsupported time horizon.');

    return errors;
}

function summarizeFounder(profile) {
    return [
        `${label(profile.founderType)} founder`,
        `${label(profile.startupStage)} stage`,
        profile.industry,
        profile.geography,
        `building ${profile.product}`,
        `for ${profile.targetCustomer}`
    ].filter(Boolean).join(' · ');
}

function clean(value) {
    return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, 300) : '';
}

function enumOrDefault(value, allowed, fallback) {
    return allowed.includes(value) ? value : fallback;
}

function label(value) {
    return String(value || '').replace(/_/g, ' ');
}

module.exports = {
    FOUNDER_TYPES,
    STARTUP_STAGES,
    REPORT_TYPES,
    AUDIENCES,
    TIME_HORIZONS,
    normalizeFounderProfile,
    normalizeReportOptions,
    validateFounderContext,
    summarizeFounder
};
