export type ProviderName = 'replicate_sdxl' | 'stability' | 'dalle' | 'midjourney'

export interface GenerateInput {
  prompt: string
  negativePrompt?: string
  width: number
  height: number
  style?: string
}

export interface GenerateResult {
  /** A URL the browser can load directly, OR a buffer to store ourselves. One of the two is always set. */
  imageUrl?: string
  buffer?: Buffer
  contentType: string
  /** Provider-side job/prediction id, when the provider exposes one. */
  externalJobId?: string
}

export interface ImageProvider {
  readonly name: ProviderName
  generate(input: GenerateInput): Promise<GenerateResult>
}

export class ProviderNotConfiguredError extends Error {
  constructor(provider: string, envVar: string) {
    super(`${provider} is not configured: set ${envVar}`)
    this.name = 'ProviderNotConfiguredError'
  }
}
