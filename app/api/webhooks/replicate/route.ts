/**
 * Receives Replicate prediction webhooks (configurable per-prediction by passing a `webhook` URL to the predictions
 * API; not wired into lib/ai/replicate.ts's synchronous `replicate.run()` calls, which already wait for completion).
 * Verifies the signature per Replicate's webhook spec (HMAC-SHA256 over "id.timestamp.body" with the signing secret
 * from GET /v1/webhooks/default/secret, prefixed "whsec_") when REPLICATE_WEBHOOK_SECRET is set.
 * Not reachable from the real Replicate service in this sandboxed environment; verified here against hand-built
 * signed requests (see the e2e script) matching the documented scheme.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logging'
import { storeGeneratedImage } from '@/lib/storage'

function verify(body: string, headers: Headers): boolean {
  const secret = process.env.REPLICATE_WEBHOOK_SECRET
  if (!secret) return true // not configured: accept (documented as insecure-by-default for local dev)
  const id = headers.get('webhook-id')
  const timestamp = headers.get('webhook-timestamp')
  const signatureHeader = headers.get('webhook-signature')
  if (!id || !timestamp || !signatureHeader) return false
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
  const expected = createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest('base64')
  return signatureHeader.split(' ').some((sig) => {
    const [, value] = sig.split(',')
    if (!value) return false
    const a = Buffer.from(value)
    const b = Buffer.from(expected)
    return a.length === b.length && timingSafeEqual(a, b)
  })
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  if (!verify(body, request.headers)) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })

  const payload = JSON.parse(body) as { id: string; status: string; output?: string[]; error?: string }
  const generation = await prisma.generation.findFirst({ where: { externalJobId: payload.id } })
  if (!generation) {
    logger.logWarning('Webhook for unknown prediction', { predictionId: payload.id })
    return NextResponse.json({ received: true })
  }

  if (payload.status === 'succeeded' && payload.output?.[0]) {
    const stored = await storeGeneratedImage({ imageUrl: payload.output[0], contentType: 'image/png' }, generation.id)
    await prisma.generation.update({ where: { id: generation.id }, data: { status: 'completed', imageUrl: stored.url, storageKey: stored.storageKey, completedAt: new Date() } })
  } else if (payload.status === 'failed' || payload.status === 'canceled') {
    await prisma.generation.update({ where: { id: generation.id }, data: { status: 'failed', errorMessage: payload.error ?? 'Replicate reported failure' } })
  }

  return NextResponse.json({ received: true })
}
