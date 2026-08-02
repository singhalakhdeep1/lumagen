// DALL-E 3 integration for lumagen

import OpenAI from 'openai';

export interface DalleImageRequest {
  prompt: string;
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
}

export interface DalleImageResponse {
  url: string;
  revisedPrompt?: string;
}

export class Dalle3 {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateImage(request: DalleImageRequest): Promise<DalleImageResponse> {
    const response = await this.client.images.generate({
      model: 'dall-e-3',
      prompt: request.prompt,
      size: request.size || '1024x1024',
      quality: request.quality || 'standard',
      style: request.style || 'vivid',
      n: 1,
    });

    return {
      url: response.data[0].url,
      revisedPrompt: response.data[0].revised_prompt,
    };
  }

  async generateImageBuffer(request: DalleImageRequest): Promise<Buffer> {
    const response = await this.generateImage(request);
    const imageResponse = await fetch(response.url);
    return Buffer.from(await imageResponse.arrayBuffer());
  }
}
