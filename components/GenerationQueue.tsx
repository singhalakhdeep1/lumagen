'use client'

import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useImageStore } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'

export function GenerationQueue() {
    const { queue } = useImageStore()

    if (queue.length === 0) return null

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold mb-4">Generation Queue</h3>

                <AnimatePresence>
                    <div className="space-y-3">
                        {queue.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: 100 }}
                                className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                            >
                                {/* Status Icon */}
                                <div>
                                    {item.status === 'generating' && (
                                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                    )}
                                    {item.status === 'completed' && (
                                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                                    )}
                                    {item.status === 'failed' && (
                                        <XCircle className="w-6 h-6 text-red-500" />
                                    )}
                                    {item.status === 'pending' && (
                                        <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{item.prompt}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                            {item.style}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {item.status === 'generating' && 'Generating...'}
                                            {item.status === 'completed' && 'Completed'}
                                            {item.status === 'failed' && 'Failed'}
                                            {item.status === 'pending' && 'Pending'}
                                        </span>
                                    </div>
                                    {item.error && (
                                        <p className="text-xs text-red-500 mt-1">{item.error}</p>
                                    )}
                                </div>

                                {/* Progress */}
                                {item.status === 'generating' && (
                                    <div className="w-32">
                                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                            <div
                                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${item.progress}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 text-center">
                                            {item.progress}%
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </AnimatePresence>
            </div>
        </div>
    )
}
