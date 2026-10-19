/**
 * Structured Logging Service for Lumagen.
 * One JSON line per event, with the request's correlation id carried through AsyncLocalStorage so concurrent
 * requests never mix context (the earlier instance-field version leaked context across concurrent requests).
 */
import { AsyncLocalStorage } from 'node:async_hooks'

export interface LogContext {
  correlationId: string
  ipAddress?: string
  generationId?: string
  [key: string]: unknown
}

const storage = new AsyncLocalStorage<LogContext>()

export class StructuredLoggingService {
  static createCorrelationId(): string {
    return crypto.randomUUID()
  }

  runWithContext<T>(context: LogContext, fn: () => T): T {
    return storage.run(context, fn)
  }

  getContext(): LogContext | undefined {
    return storage.getStore()
  }

  setGenerationId(id: string): void {
    const ctx = storage.getStore()
    if (ctx) ctx.generationId = id
  }

  private entry(level: string, message: string, extra?: Record<string, unknown>, error?: unknown) {
    const ctx = storage.getStore() ?? { correlationId: StructuredLoggingService.createCorrelationId() }
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: ctx,
      ...(extra && { additionalContext: extra }),
      ...(error !== undefined && { error: error instanceof Error ? { name: error.name, message: error.message } : String(error) }),
    }
  }

  logInformation(message: string, extra?: Record<string, unknown>): void {
    console.log(JSON.stringify(this.entry('Information', message, extra)))
  }

  logWarning(message: string, extra?: Record<string, unknown>): void {
    console.warn(JSON.stringify(this.entry('Warning', message, extra)))
  }

  logError(message: string, error?: unknown, extra?: Record<string, unknown>): void {
    console.error(JSON.stringify(this.entry('Error', message, extra, error)))
  }

  logAuditEvent(eventType: string, description: string, extra?: Record<string, unknown>): void {
    console.log(JSON.stringify(this.entry('Audit', `AUDIT: ${description}`, { ...extra, auditEventType: eventType })))
  }
}

export const logger = new StructuredLoggingService()

/** Express/Next middleware-style helper: runs `fn` with a fresh correlation id (or the caller's X-Request-Id). */
export function withRequestContext<T>(request: Request, fn: () => Promise<T>): Promise<T> {
  const incoming = request.headers.get('x-request-id')
  const correlationId = incoming && /^[\w-]{8,64}$/.test(incoming) ? incoming : StructuredLoggingService.createCorrelationId()
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? undefined
  return storage.run({ correlationId, ipAddress }, fn)
}
