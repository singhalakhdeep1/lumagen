// Stability AI SDXL through Replicate (the original, default provider). Extracted from app/api/generate/route.ts so
// REST, the async job path and GraphQL share one implementation.
import Replicate from 'replicate'
import type { GenerateInput, GenerateResult, ImageProvider } from './types'
import { ProviderNotConfiguredError } from './types'

const STYLE_SUFFIXES: Record<string, string> = {
  realistic: 'ultra realistic, photorealistic, detailed, 8k resolution',
  artistic: 'artistic, painterly, expressive, vibrant colors',
  anime: 'anime style, manga art, vibrant, detailed anime artwork',
  digital: 'digital art, concept art, trending on artstation, highly detailed',
  '3d': '3d render, octane render, cinema 4d, unreal engine, highly detailed',
  fantasy: 'fantasy art, magical, ethereal, mystical, dreamy atmosphere',
  cyberpunk: 'cyberpunk, neon lights, futuristic, sci-fi, dystopian',
  watercolor: 'watercolor painting, soft colors, artistic, flowing, painterly',
}

export function styledPrompt(prompt: string, style?: string): string {
  const suffix = style ? STYLE_SUFFIXES[style] : undefined
  return suffix ? `${prompt}, ${suffix}` : prompt
}

const MODEL = 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b' as const
export const UPSCALE_MODEL = 'nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46a' as const

function client(): Replicate {
  const auth = process.env.REPLICATE_API_TOKEN
  if (!auth) throw new ProviderNotConfiguredError('Replicate', 'REPLICATE_API_TOKEN')
  return new Replicate({ auth, baseUrl: process.env.REPLICATE_API_BASE_URL })
}

export class ReplicateSdxlProvider implements ImageProvider {
  readonly name = 'replicate_sdxl' as const

  async generate(input: GenerateInput): Promise<GenerateResult> {
    const output = (await client().run(MODEL, {
      input: {
        prompt: styledPrompt(input.prompt, input.style),
        negative_prompt: input.negativePrompt ?? 'ugly, deformed, noisy, blurry, distorted, low quality',
        width: input.width,
        height: input.height,
        num_outputs: 1,
        guidance_scale: 7.5,
        num_inference_steps: 50,
      },
    })) as string[]
    if (!output?.[0]) throw new Error('Replicate returned no image')
    return { imageUrl: output[0], contentType: 'image/png' }
  }
}

/** Real-ESRGAN upscale (2x, optional face enhance), used by /api/upscale. */
export async function upscaleWithReplicate(imageUrl: string, faceEnhance: boolean, scale = 2): Promise<string> {
  const output = (await client().run(UPSCALE_MODEL, { input: { image: imageUrl, scale, face_enhance: faceEnhance } })) as unknown
  const url = typeof output === 'string' ? output : Array.isArray(output) ? (output[0] as string) : undefined
  if (!url) throw new Error('Replicate returned no upscaled image')
  return url
}

export const replicateSdxlProvider = new ReplicateSdxlProvider()
