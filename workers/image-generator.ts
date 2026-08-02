// Cloudflare Worker for lumagen image generation

export interface Env {
  STABILITY_AI_API_KEY: string;
  OPENAI_API_KEY: string;
  R2_BUCKET: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/generate' && request.method === 'POST') {
      return handleGenerate(request, env);
    }

    if (path === '/health' && request.method === 'GET') {
      return new Response(JSON.stringify({ status: 'healthy' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
};

async function handleGenerate(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json();
    const { prompt, model, style } = body;

    let imageUrl: string;

    switch (model) {
      case 'stability':
        imageUrl = await generateWithStability(prompt, style, env.STABILITY_AI_API_KEY);
        break;
      case 'dalle':
        imageUrl = await generateWithDalle(prompt, style, env.OPENAI_API_KEY);
        break;
      default:
        imageUrl = await generateWithStability(prompt, style, env.STABILITY_AI_API_KEY);
    }

    // Store in R2
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();
    const key = `images/${Date.now()}.png`;
    await env.R2_BUCKET.put(key, imageBlob);
    const r2Url = `${env.R2_BUCKET.name}/${key}`;

    return new Response(
      JSON.stringify({ success: true, imageUrl: r2Url, prompt, model }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function generateWithStability(prompt: string, style: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text_prompts: [{ text: prompt }],
      cfg_scale: 7,
      height: 1024,
      width: 1024,
      steps: 30,
      samples: 1,
    }),
  });

  const data = await response.json();
  return data.artifacts[0].base64;
}

async function generateWithDalle(prompt: string, style: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      n: 1,
      size: '1024x1024',
      model: 'dall-e-3',
    }),
  });

  const data = await response.json();
  return data.data[0].url;
}
