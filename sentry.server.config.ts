import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: "https://f385754208fbdaa129bc23050c54b2f5@o4511506161860608.ingest.us.sentry.io/4511525836619776",
  tracesSampleRate: 1.0,
});