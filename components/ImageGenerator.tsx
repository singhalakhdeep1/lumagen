'use client'

import { useState } from 'react'
import { Wand2, Loader2 } from 'lucide-react'
import { Button } from './ui/button'
import { useImageStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

const styles = [
    { value: 'realistic', label: 'Realistic', emoji: '📷' },
    { value: 'artistic', label: 'Artistic', emoji: '🎨' },
    { value: 'anime', label: 'Anime', emoji: '🎌' },
    { value: 'digital', label: 'Digital Art', emoji: '💻' },
    { value: '3d', label: '3D Render', emoji: '🎬' },
    { value: 'fantasy', label: 'Fantasy', emoji: '✨' },
    { value: 'cyberpunk', label: 'Cyberpunk', emoji: '🌃' },
    { value: 'watercolor', label: 'Watercolor', emoji: '🖌️' },
]

const aspectRatios = [
    { value: 'square', label: 'Square', size: '1:1' },
    { value: 'landscape', label: 'Landscape', size: '16:9' },
    { value: 'portrait', label: 'Portrait', size: '9:16' },
]

export function ImageGenerator() {
    const [prompt, setPrompt] = useState('')
    const [selectedStyle, setSelectedStyle] = useState('realistic')
    const [aspectRatio, setAspectRatio] = useState('square')
    const [isGenerating, setIsGenerating] = useState(false)

    const { addImage, addToQueue, updateQueueItem, removeFromQueue } = useImageStore()
    const { toast } = useToast()

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            toast({
                title: 'Error',
                description: 'Please enter a prompt',
                variant: 'destructive',
            })
            return
        }

        if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
            toast({
                title: 'Configuration Required',
                description: 'Please configure Firebase in your .env file',
                variant: 'destructive',
            })
            return
        }

        setIsGenerating(true)
        const queueId = addToQueue({ prompt, style: selectedStyle })
        updateQueueItem(queueId, { status: 'generating', progress: 20 })

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    style: selectedStyle,
                    aspectRatio,
                }),
            })

            const data = await response.json()

            if (data.success) {
                updateQueueItem(queueId, { status: 'completed', progress: 100, imageUrl: data.imageUrl })

                addImage({
                    id: `img-${Date.now()}`,
                    url: data.imageUrl,
                    prompt,
                    style: selectedStyle,
                    timestamp: Date.now(),
                })

                toast({
                    title: 'Success!',
                    description: 'Your image has been generated',
                })

                setTimeout(() => removeFromQueue(queueId), 2000)
                setPrompt('')
            } else {
                updateQueueItem(queueId, {
                    status: 'failed',
                    error: data.error || 'Generation failed',
                })
                toast({
                    title: 'Generation Failed',
                    description: data.error || 'Something went wrong',
                    variant: 'destructive',
                })
            }
        } catch (error: any) {
            updateQueueItem(queueId, {
                status: 'failed',
                error: error.message || 'Network error',
            })
            toast({
                title: 'Error',
                description: 'Failed to generate image',
                variant: 'destructive',
            })
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Wand2 className="w-6 h-6 text-primary" />
                    Generate AI Image
                </h2>

                {/* Prompt Input */}
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">
                        Describe your image
                    </label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="A serene landscape with mountains at sunset, highly detailed..."
                        className="w-full p-4 border rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:border-gray-600"
                        rows={4}
                    />
                    <p className="text-sm text-gray-500 mt-2">
                        Be specific and descriptive for best results
                    </p>
                </div>

                {/* Style Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-3">
                        Choose Style
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {styles.map((style) => (
                            <button
                                key={style.value}
                                onClick={() => setSelectedStyle(style.value)}
                                className={`p-4 rounded-lg border-2 transition-all ${selectedStyle === style.value
                                        ? 'border-primary bg-primary/10'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <div className="text-2xl mb-1">{style.emoji}</div>
                                <div className="text-sm font-medium">{style.label}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Aspect Ratio */}
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-3">
                        Aspect Ratio
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {aspectRatios.map((ratio) => (
                            <button
                                key={ratio.value}
                                onClick={() => setAspectRatio(ratio.value)}
                                className={`p-3 rounded-lg border-2 transition-all ${aspectRatio === ratio.value
                                        ? 'border-primary bg-primary/10'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <div className="font-medium text-sm">{ratio.label}</div>
                                <div className="text-xs text-gray-500">{ratio.size}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Generate Button */}
                <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="w-full h-12 text-lg"
                    size="lg"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Wand2 className="w-5 h-5 mr-2" />
                            Generate Image
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
