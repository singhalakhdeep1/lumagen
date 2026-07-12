import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN || '',
})

export async function POST(request: NextRequest) {
    try {
        const { imageUrl } = await request.json()

        if (!imageUrl) {
            return NextResponse.json(
                { error: 'Image URL is required' },
                { status: 400 }
            )
        }

        // Using Real-ESRGAN for upscaling
        const output = await replicate.run(
            "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
            {
                input: {
                    image: imageUrl,
                    scale: 2,
                    face_enhance: true,
                }
            }
        ) as string

        return NextResponse.json({
            success: true,
            upscaledUrl: output,
        })
    } catch (error: any) {
        console.error('Upscale error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to upscale image' },
            { status: 500 }
        )
    }
}
