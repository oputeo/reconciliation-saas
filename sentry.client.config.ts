import * as Sentry from '@sentry/nextjs';

// Client Sentry disabled — Session Replay and early trace-meta DOM mutations
// were triggering React hydration error #418 on every authenticated page.
// Server-side Sentry (sentry.server.config.ts) still captures API errors.
void Sentry;