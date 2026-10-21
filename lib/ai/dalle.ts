import type { GenerateInput, GenerateResult, ImageProvider } from './types'
import { ProviderNotConfiguredError } from './types'

export class DalleProvider implements ImageProvider {
  readonly name = 'dalle' as const

  async generate(input: GenerateInput): Promise<GenerateResult> {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new ProviderNotConfiguredError('DALL-E', 'OPENAI_API_KEY')

    const size =
      input.width === input.height ? '1024x1024'
      : input.width > input.height ? '1792x1024'
      : '1024x1792'

    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: input.prompt,
        n: 1,
        size,
        response_format: 'url',
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`OpenAI DALL-E error ${res.status}: ${err}`)
    }

    const data = await res.json() as { data: { url: string }[] }
    const url = data.data[0]?.url
    if (!url) throw new Error('DALL-E returned no image')

    return { imageUrl: url, contentType: 'image/png' }
  }
}

export const dalleProvider = new DalleProvider()
