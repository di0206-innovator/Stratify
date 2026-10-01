import { inject } from '@vercel/analytics';

let isInitialized = false;

function canTrack() {
  try {
    const raw = localStorage.getItem('stratify_cookie_consent');
    if (!raw) return true; // Default allow until explicit opt-out
    const consent = JSON.parse(raw);
    return consent.choice !== 'essential_only';
  } catch {
    return true;
  }
}

export function initAnalytics() {
  if (isInitialized) return;
  try {
    if (typeof window !== 'undefined' && canTrack()) {
      inject({
        mode: import.meta.env.PROD ? 'production' : 'development'
      });
      isInitialized = true;
    }
  } catch (err) {
    // Graceful fallback if blocked by ad-blocker or offline
    console.debug('[Analytics] Failed to initialize:', err?.message || err);
  }
}

export function trackEvent(name, properties = {}) {
  if (!canTrack()) return;
  try {
    if (typeof window !== 'undefined' && window.va) {
      window.va('event', { name, data: properties });
    }
    // Also record in performance metrics
    if (window.performance && window.performance.mark) {
      window.performance.mark(`stratify_event_${name}`);
    }
  } catch {
    // Fail silently
  }
}

export function trackPageView(path) {
  if (!canTrack()) return;
  try {
    trackEvent('page_view', { path, referrer: document.referrer || 'direct' });
  } catch {
    // Fail silently
  }
}
