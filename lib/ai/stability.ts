import type { GenerateInput, GenerateResult, ImageProvider } from './types'
import { ProviderNotConfiguredError } from './types'

export class StabilityProvider implements ImageProvider {
  readonly name = 'stability' as const

  async generate(input: GenerateInput): Promise<GenerateResult> {
    const apiKey = process.env.STABILITY_AI_API_KEY
    if (!apiKey) throw new ProviderNotConfiguredError('Stability AI', 'STABILITY_AI_API_KEY')

    const res = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        text_prompts: [
          { text: input.prompt, weight: 1 },
          { text: input.negativePrompt ?? 'ugly, deformed, noisy, blurry', weight: -1 },
        ],
        cfg_scale: 7,
        width: input.width,
        height: input.height,
        steps: 30,
        samples: 1,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Stability AI error ${res.status}: ${err}`)
    }

    const data = await res.json() as { artifacts: { base64: string; finishReason: string }[] }
    const artifact = data.artifacts[0]
    if (!artifact?.base64) throw new Error('Stability AI returned no image')

    return {
      buffer: Buffer.from(artifact.base64, 'base64'),
      contentType: 'image/png',
    }
  }
}

export const stabilityProvider = new StabilityProvider()
