// Decides where a generated image's bytes end up: S3 (when configured) or the provider's own hosted URL.
import { generateImageKey, s3Configured, uploadImage } from './aws/s3'
import { getCloudFrontUrl } from './aws/cloudfront'
import type { GenerateResult } from './ai/types'

export interface StoredImage {
  url: string
  storageKey?: string
}

/**
 * Persists a provider's output. When the provider already returned a hosted URL and S3 is not configured, that URL
 * is used as-is (no network round-trip). When S3 is configured, the bytes are fetched (if needed) and uploaded, so
 * generated images outlive the provider's own temporary hosting and are served through CloudFront when set up.
 */
export async function storeGeneratedImage(result: GenerateResult, scope: string): Promise<StoredImage> {
  if (!s3Configured()) {
    if (result.imageUrl) return { url: result.imageUrl }
    // no S3 configured and the provider only gave us bytes: data-URL fallback (works for small previews)
    if (result.buffer) return { url: `data:${result.contentType};base64,${result.buffer.toString('base64')}` }
    throw new Error('Provider returned neither an image URL nor bytes')
  }

  const buffer = result.buffer ?? (await (await fetch(result.imageUrl!)).arrayBuffer().then(Buffer.from))
  const key = generateImageKey(scope, Date.now())
  await uploadImage(key, buffer, result.contentType)
  const cloudFrontUrl = getCloudFrontUrl(key)
  return { url: cloudFrontUrl ?? `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${key}`, storageKey: key }
}
