'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Download, Trash2, ZoomIn, ArrowUpCircle, Loader2 } from 'lucide-react'
import { Button } from './ui/button'
import { useImageStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { downloadImage } from '@/lib/utils'

export function Gallery() {
    const { images, removeImage, updateImageUpscale } = useImageStore()
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [upscaling, setUpscaling] = useState<string | null>(null)
    const { toast } = useToast()

    const handleDelete = (id: string) => {
        removeImage(id)
        toast({
            title: 'Deleted',
            description: 'Image removed from gallery',
        })
    }

    const handleUpscale = async (id: string, imageUrl: string) => {
        setUpscaling(id)
        try {
            const response = await fetch('/api/upscale', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl }),
            })

            const data = await response.json()

            if (data.success) {
                updateImageUpscale(id, data.upscaledUrl)
                toast({
                    title: 'Success!',
                    description: 'Image upscaled successfully',
                })
            } else {
                toast({
                    title: 'Upscale Failed',
                    description: data.error || 'Something went wrong',
                    variant: 'destructive',
                })
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to upscale image',
                variant: 'destructive',
            })
        } finally {
            setUpscaling(null)
        }
    }

    if (images.length === 0) {
        return (
            <div className="max-w-4xl mx-auto text-center py-20">
                <div className="text-6xl mb-4">🎨</div>
                <h3 className="text-2xl font-bold mb-2">No images yet</h3>
                <p className="text-gray-600 dark:text-gray-400">
                    Generate your first AI image to see it here
                </p>
            </div>
        )
    }

    return (
        <>
            <div className="max-w-7xl mx-auto">
                <h2 className="text-2xl font-bold mb-6">
                    Your Gallery ({images.length} images)
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {images.map((image) => (
                        <div
                            key={image.id}
                            className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all group"
                        >
                            {/* Image */}
                            <div className="relative aspect-square bg-gray-100 dark:bg-gray-700">
                                <Image
                                    src={image.upscaledUrl || image.url}
                                    alt={image.prompt}
                                    fill
                                    className="object-cover"
                                />
                                {image.upscaledUrl && (
                                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                        Upscaled
                                    </div>
                                )}
                                <button
                                    onClick={() => setSelectedImage(image.url)}
                                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                >
                                    <ZoomIn className="w-12 h-12 text-white" />
                                </button>
                            </div>

                            {/* Info */}
                            <div className="p-4">
                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">
                                    {image.prompt}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                    <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                                        {image.style}
                                    </span>
                                    <span>
                                        {new Date(image.timestamp).toLocaleDateString()}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() =>
                                            downloadImage(
                                                image.upscaledUrl || image.url,
                                                `ai-image-${image.id}.png`
                                            )
                                        }
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        <Download className="w-4 h-4 mr-1" />
                                        Download
                                    </Button>
                                    {!image.upscaledUrl && (
                                        <Button
                                            size="sm"
                                            onClick={() => handleUpscale(image.id, image.url)}
                                            disabled={upscaling === image.id}
                                            variant="outline"
                                            className="flex-1"
                                        >
                                            {upscaling === image.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <ArrowUpCircle className="w-4 h-4 mr-1" />
                                                    Upscale
                                                </>
                                            )}
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        onClick={() => handleDelete(image.id)}
                                        variant="destructive"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] w-full h-full">
                        <Image
                            src={selectedImage}
                            alt="Full size"
                            fill
                            className="object-contain"
                        />
                    </div>
                </div>
            )}
        </>
    )
}
