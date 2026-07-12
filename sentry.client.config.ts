import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: "https://f385754208fbdaa129bc23050c54b2f5@o4511506161860608.ingest.us.sentry.io/4511525836619776",
  
  tracesSampleRate: 1.0,        // Capture 100% of transactions (good for demo)
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  ignoreErrors: [
    'Minified React error #418',
    'Hydration failed because the server rendered',
  ],

  debug: process.env.NODE_ENV === 'development',
});