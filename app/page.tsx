'use client'

import { useState } from 'react'
import { ImageGenerator } from '@/components/ImageGenerator'
import { Gallery } from '@/components/Gallery'
import { Header } from '@/components/Header'
import { GenerationQueue } from '@/components/GenerationQueue'
import { useImageStore } from '@/lib/store'

export default function Home() {
    const [activeTab, setActiveTab] = useState<'generate' | 'gallery'>('generate')
    const { queue } = useImageStore()

    return (
        <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
            <Header />

            <div className="container mx-auto px-4 py-8">
                {/* Tab Navigation */}
                <div className="flex gap-4 mb-8 justify-center">
                    <button
                        onClick={() => setActiveTab('generate')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'generate'
                                ? 'bg-primary text-white shadow-lg'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-md'
                            }`}
                    >
                        Generate
                    </button>
                    <button
                        onClick={() => setActiveTab('gallery')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === 'gallery'
                                ? 'bg-primary text-white shadow-lg'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-md'
                            }`}
                    >
                        Gallery
                    </button>
                </div>

                {/* Generation Queue - Show if there are active generations */}
                {queue.length > 0 && (
                    <div className="mb-8">
                        <GenerationQueue />
                    </div>
                )}

                {/* Content */}
                {activeTab === 'generate' ? (
                    <ImageGenerator />
                ) : (
                    <Gallery />
                )}
            </div>
        </main>
    )
}
