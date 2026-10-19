// DALL-E 3 integration for lumagen

import OpenAI from 'openai'
import type { GenerateInput, GenerateResult, ImageProvider } from './types'
import { ProviderNotConfiguredError } from './types'

export interface DalleImageRequest {
  prompt: string
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792'
  quality?: 'standard' | 'hd'
  style?: 'vivid' | 'natural'
}

export interface DalleImageResponse {
  url: string
  revisedPrompt?: string
}

export class Dalle3 {
  private client: OpenAI

  constructor(apiKey: string, baseURL = process.env.OPENAI_BASE_URL) {
    this.client = new OpenAI({ apiKey, baseURL })
  }

  async generateImage(request: DalleImageRequest): Promise<DalleImageResponse> {
    const response = await this.client.images.generate({
      model: 'dall-e-3',
      prompt: request.prompt,
      size: request.size || '1024x1024',
      quality: request.quality || 'standard',
      style: request.style || 'vivid',
      n: 1,
    })

    const image = response.data?.[0]
    if (!image?.url) throw new Error('DALL-E returned no image URL')
    return { url: image.url, revisedPrompt: image.revised_prompt }
  }

  async generateImageBuffer(request: DalleImageRequest): Promise<Buffer> {
    const response = await this.generateImage(request)
    const imageResponse = await fetch(response.url)
    return Buffer.from(await imageResponse.arrayBuffer())
  }
}

/** Nearest DALL-E size for a requested aspect ratio. */
function nearestSize(width: number, height: number): DalleImageRequest['size'] {
  const ratio = width / height
  if (ratio > 1.3) return '1792x1024'
  if (ratio < 0.77) return '1024x1792'
  return '1024x1024'
}

export class DalleProvider implements ImageProvider {
  readonly name = 'dalle' as const

  async generate(input: GenerateInput): Promise<GenerateResult> {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new ProviderNotConfiguredError('DALL-E', 'OPENAI_API_KEY')
    const client = new Dalle3(apiKey)
    const result = await client.generateImage({ prompt: input.prompt, size: nearestSize(input.width, input.height) })
    return { imageUrl: result.url, contentType: 'image/png' }
  }
}

export const dalleProvider = new DalleProvider()
