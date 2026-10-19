/**
 * Structured Logging Service for Lumagen — re-exports the AsyncLocalStorage-based implementation in lib/logging.ts
 * (the original version here kept a single instance field for "current context", which leaked between concurrent
 * requests; fixed by moving the state into AsyncLocalStorage). Kept at this path so the HLD/LLD doc's location
 * reference stays correct.
 */
export { StructuredLoggingService, logger, withRequestContext, type LogContext } from '@/lib/logging'
