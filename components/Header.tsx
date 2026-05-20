'use client'

import { Sparkles } from 'lucide-react'

export function Header() {
    return (
        <header className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            AI Image Generator
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Create stunning AI art with advanced models
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        Powered by Replicate AI
                    </span>
                </div>
            </div>
        </header>
    )
}
