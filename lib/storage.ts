import type { GenerateResult } from './ai/types'

export interface StoredImage {
  url: string
  storageKey?: string
}

export async function storeGeneratedImage(result: GenerateResult, _scope: string): Promise<StoredImage> {
  if (result.imageUrl) return { url: result.imageUrl };
  if (result.buffer) return { url: `data:${result.contentType};base64,${result.buffer.toString('base64')}` };
  throw new Error('Provider returned neither an image URL nor bytes');
}
