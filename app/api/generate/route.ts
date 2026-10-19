import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { withRequestContext, logger } from '@/lib/logging'
import { generateImage, GenerateRequestSchema, RateLimitedError, checkGenerationRateLimit } from '@/lib/generation'

function ip(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip') ?? '127.0.0.1'
}

export async function POST(request: NextRequest) {
  return withRequestContext(request, async () => {
    try {
      const body = await request.json()
      const input = GenerateRequestSchema.parse(body)
      const ipAddress = ip(request)

      await checkGenerationRateLimit(ipAddress)

      const { generation } = await generateImage(input, ipAddress)

      if (generation.status === 'failed') {
        return NextResponse.json({ error: generation.errorMessage || 'Failed to generate image' }, { status: 502 })
      }

      return NextResponse.json({
        success: true,
        id: generation.id,
        imageUrl: generation.imageUrl,
        prompt: generation.prompt,
        style: generation.style,
        provider: generation.provider,
      })
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json({ error: error.errors[0]?.message ?? 'Invalid request' }, { status: 400 })
      }
      if (error instanceof RateLimitedError) {
        return NextResponse.json({ error: error.message }, { status: 429, headers: { 'Retry-After': String(error.retryAfter) } })
      }
      logger.logError('Generation request error', error)
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to generate image' }, { status: 500 })
    }
  })
}
