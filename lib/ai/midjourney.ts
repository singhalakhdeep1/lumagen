// Midjourney integration for lumagen. Midjourney has no first-party HTTP API; this targets the common third-party
// proxy contract (POST /imagine -> {id}, GET /image/:id -> {status, imageUrl}), configurable via MIDJOURNEY_BASE_URL
// so any compatible proxy (or a test double) can be used.
import type { GenerateInput, GenerateResult, ImageProvider } from './types'
import { ProviderNotConfiguredError } from './types'

export interface MidjourneyImageRequest {
  prompt: string
  aspect_ratio?: string
}

export interface MidjourneyImageResponse {
  id: string
  status: 'queued' | 'processing' | 'complete' | 'failed'
  imageUrl?: string
  progress?: number
  error?: string
}

export class Midjourney {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string, baseUrl = process.env.MIDJOURNEY_BASE_URL ?? 'https://api.midjourney.com/v1') {
    this.apiKey = apiKey
    this.baseUrl = baseUrl
  }

  async generateImage(request: MidjourneyImageRequest): Promise<MidjourneyImageResponse> {
    const response = await fetch(`${this.baseUrl}/imagine`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: request.prompt, aspect_ratio: request.aspect_ratio ?? '1:1' }),
    })
    if (!response.ok) throw new Error(`Midjourney error: ${response.status} ${response.statusText}`)
    return response.json()
  }

  async getImageStatus(imageId: string): Promise<MidjourneyImageResponse> {
    const response = await fetch(`${this.baseUrl}/image/${imageId}`, { headers: { Authorization: `Bearer ${this.apiKey}` } })
    if (!response.ok) throw new Error(`Midjourney error: ${response.status} ${response.statusText}`)
    return response.json()
  }

  async waitForCompletion(imageId: string, maxAttempts = 30, intervalMs = 2000): Promise<MidjourneyImageResponse> {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.getImageStatus(imageId)
      if (status.status === 'complete') return status
      if (status.status === 'failed') throw new Error(status.error ?? 'Midjourney generation failed')
      await new Promise((resolve) => setTimeout(resolve, intervalMs))
    }
    throw new Error('Image generation timed out')
  }
}

export class MidjourneyProvider implements ImageProvider {
  readonly name = 'midjourney' as const

  async generate(input: GenerateInput): Promise<GenerateResult> {
    const apiKey = process.env.MIDJOURNEY_API_KEY
    if (!apiKey) throw new ProviderNotConfiguredError('Midjourney', 'MIDJOURNEY_API_KEY')
    const client = new Midjourney(apiKey)
    const ratio = `${Math.round(input.width / 64)}:${Math.round(input.height / 64)}`
    const started = await client.generateImage({ prompt: input.prompt, aspect_ratio: ratio })
    const finished = await client.waitForCompletion(started.id, 60, 2000)
    if (!finished.imageUrl) throw new Error('Midjourney returned no image')
    return { imageUrl: finished.imageUrl, contentType: 'image/png', externalJobId: started.id }
  }
}

export const midjourneyProvider = new MidjourneyProvider()
