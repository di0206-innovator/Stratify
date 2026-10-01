import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import './index.css';
import { initAnalytics } from './lib/analytics';

initAnalytics();

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration()
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

const FallbackComponent = ({ error }) => (
  <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center text-text-primary">
    <h1 className="font-outfit font-black text-xl uppercase tracking-tight text-red-500 mb-2">
      An unexpected application error occurred
    </h1>
    <p className="text-xs text-text-secondary max-w-md mb-2 leading-relaxed font-inter">
      The system encountered an unhandled exception:
    </p>
    {error && (
      <pre className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg text-xs font-mono max-w-xl overflow-auto mb-4 text-left">
        {error.message || String(error)}
        {error.stack && `\n\n${error.stack}`}
      </pre>
    )}
    <button
      onClick={() => window.location.assign('/')}
      className="px-4 py-2 bg-accent text-[#111] font-outfit font-bold text-xs uppercase tracking-wider rounded-lg hover:opacity-90 transition-all cursor-pointer"
    >
      Return to Dashboard
    </button>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<FallbackComponent />}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
