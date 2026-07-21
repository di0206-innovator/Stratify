import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import './index.css';

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

const FallbackComponent = () => (
  <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center text-text-primary">
    <h1 className="font-outfit font-black text-xl uppercase tracking-tight text-red-500 mb-2">
      An unexpected application error occurred
    </h1>
    <p className="text-xs text-text-secondary max-w-md mb-4 leading-relaxed font-inter">
      The system encountered an unhandled exception. Our error tracking service has logged this instance.
    </p>
    <button
      onClick={() => window.location.assign('/')}
      className="os-btn-accent text-xs px-4 py-2"
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
