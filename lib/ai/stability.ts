// Stability AI integration for lumagen (direct REST API, bypassing Replicate).
import type { GenerateInput, GenerateResult, ImageProvider } from './types'
import { ProviderNotConfiguredError } from './types'

export interface StabilityImageRequest {
  prompt: string
  width?: number
  height?: number
  steps?: number
  cfg_scale?: number
}

export interface StabilityImageResponse {
  artifacts: Array<{
    base64: string
    seed: number
    finishReason: string
  }>
}

export class StabilityAI {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string, baseUrl = process.env.STABILITY_API_BASE_URL ?? 'https://api.stability.ai/v1/generation') {
    this.apiKey = apiKey
    this.baseUrl = baseUrl
  }

  async generateImage(request: StabilityImageRequest): Promise<StabilityImageResponse> {
    const response = await fetch(`${this.baseUrl}/stable-diffusion-xl-1024-v1-0/text-to-image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        text_prompts: [{ text: request.prompt }],
        cfg_scale: request.cfg_scale ?? 7,
        height: request.height ?? 1024,
        width: request.width ?? 1024,
        steps: request.steps ?? 30,
        samples: 1,
      }),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new Error(`Stability AI error: ${response.status} ${response.statusText} ${body}`.trim())
    }

    return response.json()
  }

  async generateImageBuffer(request: StabilityImageRequest): Promise<Buffer> {
    const response = await this.generateImage(request)
    const base64 = response.artifacts[0]?.base64
    if (!base64) throw new Error('Stability AI returned no image')
    return Buffer.from(base64, 'base64')
  }
}

export class StabilityProvider implements ImageProvider {
  readonly name = 'stability' as const

  async generate(input: GenerateInput): Promise<GenerateResult> {
    const apiKey = process.env.STABILITY_AI_API_KEY
    if (!apiKey) throw new ProviderNotConfiguredError('Stability AI', 'STABILITY_AI_API_KEY')
    const client = new StabilityAI(apiKey)
    const buffer = await client.generateImageBuffer({ prompt: input.prompt, width: input.width, height: input.height })
    return { buffer, contentType: 'image/png' }
  }
}

export const stabilityProvider = new StabilityProvider()
