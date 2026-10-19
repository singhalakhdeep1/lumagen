/**
 * The single place that turns a generation request into a stored image + database row. Used by the synchronous
 * REST route, the async job route, and the GraphQL mutation, so rate limiting, caching, persistence and logging
 * can never be skipped on one path.
 */
import { z } from 'zod'
import type { GenerationStatus, Provider } from '@prisma/client'
import { prisma } from './db'
import { cache } from './services/cache/cache.service'
import { generationLimiter } from './services/rate-limiting/rate-limiting.service'
import { logger } from './logging'
import { getProvider, PROVIDER_NAMES } from './ai/provider'
import { styledPrompt } from './ai/replicate'
import { storeGeneratedImage } from './storage'
import { pubsub } from './pubsub'

export const AspectRatio = z.enum(['square', 'landscape', 'portrait'])
export type AspectRatioName = z.infer<typeof AspectRatio>

export const GenerateRequestSchema = z.object({
  prompt: z.string().trim().min(3, 'Prompt must be at least 3 characters').max(2000),
  style: z.string().max(40).optional().default('realistic'),
  aspectRatio: AspectRatio.optional().default('square'),
  provider: z.enum(PROVIDER_NAMES as [Provider, ...Provider[]]).optional().default('replicate_sdxl'),
})
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>

export class RateLimitedError extends Error {
  constructor(public retryAfter: number) {
    super('Too many generation requests, please wait before trying again')
    this.name = 'RateLimitedError'
  }
}

function dimensions(aspectRatio: AspectRatioName): { width: number; height: number } {
  if (aspectRatio === 'portrait') return { width: 832, height: 1216 }
  if (aspectRatio === 'landscape') return { width: 1216, height: 832 }
  return { width: 1024, height: 1024 }
}

/** Checks the per-IP generation rate limit; throws RateLimitedError when exceeded. */
export async function checkGenerationRateLimit(ipAddress: string): Promise<void> {
  const result = await generationLimiter.consume(ipAddress)
  if (!result.allowed) throw new RateLimitedError(result.retryAfter)
}

/**
 * Runs the full pipeline: validate, create a pending row, call the provider, store the result, update the row,
 * publish a GraphQL event. Identical prompt+style+aspectRatio+provider requests from the same IP within 15s reuse
 * the in-flight/most-recent result instead of spending provider credits twice (double-click / retry storms).
 */
export async function generateImage(input: GenerateRequest, ipAddress: string | undefined): Promise<{ generation: Awaited<ReturnType<typeof prisma.generation.create>> }> {
  const { width, height } = dimensions(input.aspectRatio)
  const enhancedPrompt = styledPrompt(input.prompt, input.style)
  const dedupeKey = `gen-dedupe:${ipAddress ?? 'anon'}:${input.provider}:${enhancedPrompt}:${input.aspectRatio}`

  const cachedId = await cache.get(dedupeKey)
  if (cachedId) {
    const existing = await prisma.generation.findUnique({ where: { id: cachedId } })
    if (existing && existing.status !== 'failed') {
      logger.logInformation('Reused recent identical generation', { generationId: existing.id })
      return { generation: existing }
    }
  }

  const row = await prisma.generation.create({
    data: {
      prompt: input.prompt,
      enhancedPrompt,
      style: input.style,
      aspectRatio: input.aspectRatio,
      provider: input.provider,
      status: 'pending' as GenerationStatus,
      width,
      height,
      ipAddress,
    },
  })
  logger.setGenerationId(row.id)
  await cache.set(dedupeKey, row.id, 15)

  await prisma.generation.update({ where: { id: row.id }, data: { status: 'processing' } })
  try {
    const provider = getProvider(input.provider)
    const result = await provider.generate({ prompt: input.prompt, width, height, style: input.style })
    const stored = await storeGeneratedImage(result, row.id)
    const completed = await prisma.generation.update({
      where: { id: row.id },
      data: {
        status: 'completed',
        imageUrl: stored.url,
        storageKey: stored.storageKey,
        externalJobId: result.externalJobId,
        completedAt: new Date(),
      },
    })
    logger.logAuditEvent('ImageGenerated', 'AI generated image', { generationId: row.id, provider: input.provider })
    pubsub.publish('IMAGE_GENERATED', { imageGenerated: completed })
    return { generation: completed }
  } catch (error) {
    const failed = await prisma.generation.update({
      where: { id: row.id },
      data: { status: 'failed', errorMessage: error instanceof Error ? error.message : String(error) },
    })
    logger.logError('Generation failed', error, { generationId: row.id, provider: input.provider })
    return { generation: failed }
  }
}

/** Fire-and-forget version for the async job route: returns the pending row immediately, finishes in the background. */
export async function generateImageAsync(input: GenerateRequest, ipAddress: string | undefined): Promise<{ id: string }> {
  const { width, height } = dimensions(input.aspectRatio)
  const row = await prisma.generation.create({
    data: {
      prompt: input.prompt,
      enhancedPrompt: styledPrompt(input.prompt, input.style),
      style: input.style,
      aspectRatio: input.aspectRatio,
      provider: input.provider,
      status: 'pending',
      width,
      height,
      ipAddress,
    },
  })
  void processAsync(row.id, input).catch((error) => logger.logError('Async generation crashed', error, { generationId: row.id }))
  return { id: row.id }
}

async function processAsync(id: string, input: GenerateRequest): Promise<void> {
  const { width, height } = dimensions(input.aspectRatio)
  await prisma.generation.update({ where: { id }, data: { status: 'processing' } })
  try {
    const provider = getProvider(input.provider)
    const result = await provider.generate({ prompt: input.prompt, width, height, style: input.style })
    const stored = await storeGeneratedImage(result, id)
    const completed = await prisma.generation.update({
      where: { id },
      data: { status: 'completed', imageUrl: stored.url, storageKey: stored.storageKey, externalJobId: result.externalJobId, completedAt: new Date() },
    })
    pubsub.publish('IMAGE_GENERATED', { imageGenerated: completed })
  } catch (error) {
    await prisma.generation.update({ where: { id }, data: { status: 'failed', errorMessage: error instanceof Error ? error.message : String(error) } })
  }
}
