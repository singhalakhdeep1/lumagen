import { replicateSdxlProvider } from './replicate'
import { stabilityProvider } from './stability'
import { dalleProvider } from './dalle'
import { midjourneyProvider } from './midjourney'
import type { ImageProvider, ProviderName } from './types'

export const PROVIDERS: Record<ProviderName, ImageProvider> = {
  replicate_sdxl: replicateSdxlProvider,
  stability: stabilityProvider,
  dalle: dalleProvider,
  midjourney: midjourneyProvider,
}

export const PROVIDER_NAMES = Object.keys(PROVIDERS) as ProviderName[]

export function getProvider(name: string): ImageProvider {
  const provider = PROVIDERS[name as ProviderName]
  if (!provider) throw new Error(`Unknown provider "${name}". Known providers: ${PROVIDER_NAMES.join(', ')}`)
  return provider
}

/** Which providers have their required environment variable set. */
export function configuredProviders(): ProviderName[] {
  const check: Record<ProviderName, boolean> = {
    replicate_sdxl: Boolean(process.env.REPLICATE_API_TOKEN),
    stability: Boolean(process.env.STABILITY_AI_API_KEY),
    dalle: Boolean(process.env.OPENAI_API_KEY),
    midjourney: Boolean(process.env.MIDJOURNEY_API_KEY),
  }
  return PROVIDER_NAMES.filter((n) => check[n])
}

export type { ImageProvider, ProviderName, GenerateInput, GenerateResult } from './types'
