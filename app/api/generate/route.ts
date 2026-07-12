import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN || '',
})

export async function POST(request: NextRequest) {
    try {
        const { prompt, style, aspectRatio } = await request.json()

        if (!prompt) {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            )
        }

        // Style-specific prompt enhancements
        const stylePrompts: Record<string, string> = {
            realistic: 'ultra realistic, photorealistic, detailed, 8k resolution',
            artistic: 'artistic, painterly, expressive, vibrant colors',
            anime: 'anime style, manga art, vibrant, detailed anime artwork',
            digital: 'digital art, concept art, trending on artstation, highly detailed',
            '3d': '3d render, octane render, cinema 4d, unreal engine, highly detailed',
            fantasy: 'fantasy art, magical, ethereal, mystical, dreamy atmosphere',
            cyberpunk: 'cyberpunk, neon lights, futuristic, sci-fi, dystopian',
            watercolor: 'watercolor painting, soft colors, artistic, flowing, painterly',
        }

        const enhancedPrompt = `${prompt}, ${stylePrompts[style] || ''}`

        // Using SDXL model from Replicate
        const output = await replicate.run(
            "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            {
                input: {
                    prompt: enhancedPrompt,
                    negative_prompt: "ugly, deformed, noisy, blurry, distorted, low quality",
                    width: aspectRatio === 'square' ? 1024 : aspectRatio === 'portrait' ? 832 : 1216,
                    height: aspectRatio === 'square' ? 1024 : aspectRatio === 'portrait' ? 1216 : 832,
                    num_outputs: 1,
                    guidance_scale: 7.5,
                    num_inference_steps: 50,
                }
            }
        ) as string[]

        return NextResponse.json({
            success: true,
            imageUrl: output[0],
            prompt,
            style,
        })
    } catch (error: any) {
        console.error('Generation error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to generate image' },
            { status: 500 }
        )
    }
}
