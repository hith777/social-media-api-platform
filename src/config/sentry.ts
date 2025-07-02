import { env } from './env';

// Try to import Sentry, but make it optional
let Sentry: any = null;
try {
  Sentry = require('@sentry/node');
} catch (error) {
  console.warn('@sentry/node not installed, Sentry features disabled');
}

/**
 * Initialize Sentry for error tracking and monitoring
 */
export function initializeSentry(): void {
  if (!Sentry) {
    console.log('Sentry not available, skipping Sentry initialization');
    return;
  }
  
  if (!env.SENTRY_DSN) {
    console.log('Sentry DSN not provided, skipping Sentry initialization');
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV || 'development',
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
    ],
    beforeSend(event, hint) {
      // Filter out sensitive data
      if (event.request) {
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers.authorization;
        }
      }
      return event;
    },
  });
}

/**
 * Sentry error handler middleware
 */
export const sentryErrorHandler = Sentry
  ? Sentry.Handlers.errorHandler()
  : ((_req: any, _res: any, next: any) => next());

/**
 * Sentry request handler middleware
 */
export const sentryRequestHandler = Sentry
  ? Sentry.Handlers.requestHandler()
  : ((_req: any, _res: any, next: any) => next());

/**
 * Capture exception manually
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  if (!Sentry) return;
  
  if (context) {
    Sentry.withScope((scope) => {
      Object.keys(context).forEach((key) => {
        scope.setContext(key, context[key]);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Capture message manually
 */
export function captureMessage(message: string, level: any = 'info'): void {
  if (!Sentry) return;
  Sentry.captureMessage(message, level);
}

