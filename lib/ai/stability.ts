// Stability AI integration for lumagen

export interface StabilityImageRequest {
  prompt: string;
  style?: string;
  width?: number;
  height?: number;
  steps?: number;
  cfg_scale?: number;
}

export interface StabilityImageResponse {
  artifacts: Array<{
    base64: string;
    seed: number;
    finishReason: string;
  }>;
}

export class StabilityAI {
  private apiKey: string;
  private baseUrl: string = 'https://api.stability.ai/v1/generation';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateImage(request: StabilityImageRequest): Promise<StabilityImageResponse> {
    const response = await fetch(
      `${this.baseUrl}/stable-diffusion-xl-1024-v1-0/text-to-image`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text_prompts: [{ text: request.prompt }],
          cfg_scale: request.cfg_scale || 7,
          height: request.height || 1024,
          width: request.width || 1024,
          steps: request.steps || 30,
          samples: 1,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Stability AI error: ${response.statusText}`);
    }

    return response.json();
  }

  async generateImageBuffer(request: StabilityImageRequest): Promise<Buffer> {
    const response = await this.generateImage(request);
    const base64 = response.artifacts[0].base64;
    return Buffer.from(base64, 'base64');
  }
}
