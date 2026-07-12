import * as Sentry from '@sentry/nextjs';

function initSentry() {
  Sentry.init({
    dsn: 'https://f385754208fbdaa129bc23050c54b2f5@o4511506161860608.ingest.us.sentry.io/4511525836619776',

    tracesSampleRate: 1.0,
    // Session Replay patches the DOM early and can trigger React hydration #418.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,

    ignoreErrors: [
      'Minified React error #418',
      'Minified React error #423',
      'Minified React error #425',
      'Hydration failed because the server rendered',
    ],

    debug: process.env.NODE_ENV === 'development',
  });
}

// Defer Sentry until after the first paint so trace-meta cleanup / replay
// hooks cannot mutate the document before React hydrates.
if (typeof window !== 'undefined') {
  const run = () => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => initSentry());
    } else {
      setTimeout(initSentry, 0);
    }
  };

  if (document.readyState === 'complete') {
    run();
  } else {
    window.addEventListener('load', run, { once: true });
  }
}