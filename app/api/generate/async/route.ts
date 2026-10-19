// Starts a generation job in the background and returns immediately; poll GET /api/generations/:id for the result.
// Demonstrates the job/webhook-friendly path without requiring a publicly reachable callback URL in local dev.
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { withRequestContext, logger } from '@/lib/logging'
import { generateImageAsync, GenerateRequestSchema, RateLimitedError, checkGenerationRateLimit } from '@/lib/generation'

function ip(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? '127.0.0.1'
}

export async function POST(request: NextRequest) {
  return withRequestContext(request, async () => {
    try {
      const input = GenerateRequestSchema.parse(await request.json())
      const ipAddress = ip(request)
      await checkGenerationRateLimit(ipAddress)
      const { id } = await generateImageAsync(input, ipAddress)
      return NextResponse.json({ success: true, id, status: 'pending' }, { status: 202 })
    } catch (error) {
      if (error instanceof ZodError) return NextResponse.json({ error: error.errors[0]?.message ?? 'Invalid request' }, { status: 400 })
      if (error instanceof RateLimitedError) return NextResponse.json({ error: error.message }, { status: 429, headers: { 'Retry-After': String(error.retryAfter) } })
      logger.logError('Async generation request error', error)
      return NextResponse.json({ error: 'Failed to start generation' }, { status: 500 })
    }
  })
}
