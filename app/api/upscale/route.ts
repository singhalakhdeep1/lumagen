import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'
import { z } from 'zod'
import { withRequestContext, logger } from '@/lib/logging'
import { prisma } from '@/lib/db'
import { upscaleLimiter } from '@/lib/services/rate-limiting/rate-limiting.service'
import { UPSCALE_MODEL } from '@/lib/ai/replicate'
import { storeGeneratedImage } from '@/lib/storage'

const Body = z.object({
  imageUrl: z.string().url(),
  generationId: z.string().optional(),
  faceEnhance: z.boolean().optional().default(false),
  scale: z.number().int().min(2).max(4).optional().default(2),
})

export async function POST(request: NextRequest) {
  return withRequestContext(request, async () => {
    try {
      const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
      const limit = await upscaleLimiter.consume(ipAddress)
      if (!limit.allowed) return NextResponse.json({ error: 'Too many upscale requests' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } })

      const { imageUrl, generationId, faceEnhance, scale } = Body.parse(await request.json())

      const auth = process.env.REPLICATE_API_TOKEN
      if (!auth) return NextResponse.json({ error: 'REPLICATE_API_TOKEN is not configured' }, { status: 503 })
      const replicate = new Replicate({ auth, baseUrl: process.env.REPLICATE_API_BASE_URL })
      const output = (await replicate.run(UPSCALE_MODEL, { input: { image: imageUrl, scale, face_enhance: faceEnhance } })) as unknown
      const url = typeof output === 'string' ? output : Array.isArray(output) ? (output[0] as string) : undefined
      if (!url) throw new Error('Replicate returned no upscaled image')

      const stored = await storeGeneratedImage({ imageUrl: url, contentType: 'image/png' }, generationId ?? 'upscale')

      if (generationId) {
        await prisma.upscale.create({ data: { generationId, imageUrl: stored.url, storageKey: stored.storageKey, scale, faceEnhance } }).catch((error) => {
          // the generation row may not exist (e.g. a client-side-only image): log but still return the upscaled image
          logger.logWarning('Could not record upscale (unknown generationId)', { generationId, error: String(error) })
        })
      }

      return NextResponse.json({ success: true, upscaledUrl: stored.url })
    } catch (error) {
      if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors[0]?.message ?? 'Invalid request' }, { status: 400 })
      logger.logError('Upscale error', error)
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to upscale image' }, { status: 500 })
    }
  })
}
