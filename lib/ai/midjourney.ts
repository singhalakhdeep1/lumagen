import type { GenerateInput, GenerateResult, ImageProvider } from './types'
import { ProviderNotConfiguredError } from './types'

export class MidjourneyProvider implements ImageProvider {
  readonly name = 'midjourney' as const

  async generate(input: GenerateInput): Promise<GenerateResult> {
    const apiKey = process.env.MIDJOURNEY_API_KEY
    if (!apiKey) throw new ProviderNotConfiguredError('Midjourney', 'MIDJOURNEY_API_KEY')

    const ratio =
      input.width === input.height ? '1:1'
      : input.width > input.height ? '16:9'
      : '9:16'

    const res = await fetch('https://api.userapi.ai/midjourney/v2/imagine', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        prompt: `${input.prompt} --ar ${ratio}`,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Midjourney API error ${res.status}: ${err}`)
    }

    const data = await res.json() as { result?: string; uri?: string; hash?: string }
    const url = data.result ?? data.uri
    if (!url) throw new Error('Midjourney returned no image URL')

    return { imageUrl: url, contentType: 'image/png', externalJobId: data.hash }
  }
}

export const midjourneyProvider = new MidjourneyProvider()
