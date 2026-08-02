// Midjourney integration for lumagen

export interface MidjourneyImageRequest {
  prompt: string;
  style?: string;
  aspect_ratio?: string;
}

export interface MidjourneyImageResponse {
  id: string;
  status: string;
  imageUrl?: string;
  progress?: number;
}

export class Midjourney {
  private apiKey: string;
  private baseUrl: string = 'https://api.midjourney.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateImage(request: MidjourneyImageRequest): Promise<MidjourneyImageResponse> {
    const response = await fetch(`${this.baseUrl}/imagine`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: request.prompt,
        aspect_ratio: request.aspect_ratio || '1:1',
      }),
    });

    if (!response.ok) {
      throw new Error(`Midjourney error: ${response.statusText}`);
    }

    return response.json();
  }

  async getImageStatus(imageId: string): Promise<MidjourneyImageResponse> {
    const response = await fetch(`${this.baseUrl}/image/${imageId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Midjourney error: ${response.statusText}`);
    }

    return response.json();
  }

  async waitForCompletion(imageId: string, maxAttempts: number = 30): Promise<MidjourneyImageResponse> {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.getImageStatus(imageId);
      if (status.status === 'complete') {
        return status;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    throw new Error('Image generation timed out');
  }
}
