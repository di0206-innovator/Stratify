const { createApp } = require('../server');
const { createLogger } = require('../lib/logger');

// Vercel serverless environment
const logger = createLogger({ env: process.env.NODE_ENV || 'production' });
const app = createApp({ logger });

module.exports = app;
