const test = require('node:test');
const assert = require('node:assert/strict');
const {
    normalizeFounderProfile,
    validateFounderContext,
    summarizeFounder
} = require('../lib/founderProfile');

test('normalizeFounderProfile uses default values for missing fields', () => {
    const profile = normalizeFounderProfile({});

    assert.equal(profile.founderType, 'solo');
    assert.equal(profile.startupStage, 'idea');
    assert.equal(profile.industry, '');
    assert.equal(profile.geography, '');
});

test('normalizeFounderProfile sanitizes inputs correctly', () => {
    const profile = normalizeFounderProfile({
        founderType: 'technical',
        startupStage: 'mvp',
        industry: '   fintech   software  ',
        geography: 'India\nBengaluru'
    });

    assert.equal(profile.founderType, 'technical');
    assert.equal(profile.startupStage, 'mvp');
    assert.equal(profile.industry, 'fintech software');
    assert.equal(profile.geography, 'India Bengaluru');
});

test('validateFounderContext identifies missing mandatory fields', () => {
    const invalidProfile = {
        industry: '',
        geography: '',
        product: '',
        targetCustomer: '',
        currentGoal: ''
    };
    const options = {
        reportType: 'idea_validation',
        audience: 'founder',
        timeHorizon: '30_days'
    };

    const errors = validateFounderContext(invalidProfile, options);
    assert.ok(errors.length > 0);
    assert.ok(errors.some(err => err.includes('industry')));
    assert.ok(errors.some(err => err.includes('geography')));
    assert.ok(errors.some(err => err.includes('product')));
});

test('summarizeFounder formats profile details correctly', () => {
    const profile = {
        founderType: 'repeat_founder',
        startupStage: 'scaling',
        industry: 'AI CleanTech',
        geography: 'San Francisco',
        product: 'EV carbon tracking',
        targetCustomer: 'fleet managers'
    };

    const summary = summarizeFounder(profile);
    assert.equal(summary, 'repeat founder founder · scaling stage · AI CleanTech · San Francisco · building EV carbon tracking · for fleet managers');
});
