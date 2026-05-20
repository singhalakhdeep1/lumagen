import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface GeneratedImage {
  id: string
  url: string
  prompt: string
  style: string
  timestamp: number
  upscaledUrl?: string
}

export interface QueueItem {
  id: string
  prompt: string
  style: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
  progress: number
  imageUrl?: string
  error?: string
}

interface ImageStore {
  images: GeneratedImage[]
  queue: QueueItem[]
  addImage: (image: GeneratedImage) => void
  removeImage: (id: string) => void
  updateImageUpscale: (id: string, upscaledUrl: string) => void
  addToQueue: (item: Omit<QueueItem, 'id' | 'status' | 'progress'>) => string
  updateQueueItem: (id: string, updates: Partial<QueueItem>) => void
  removeFromQueue: (id: string) => void
  clearQueue: () => void
}

export const useImageStore = create<ImageStore>()(
  persist(
    (set) => ({
      images: [],
      queue: [],
      
      addImage: (image) =>
        set((state) => ({
          images: [image, ...state.images],
        })),
      
      removeImage: (id) =>
        set((state) => ({
          images: state.images.filter((img) => img.id !== id),
        })),
      
      updateImageUpscale: (id, upscaledUrl) =>
        set((state) => ({
          images: state.images.map((img) =>
            img.id === id ? { ...img, upscaledUrl } : img
          ),
        })),
      
      addToQueue: (item) => {
        const id = `queue-${Date.now()}-${Math.random()}`
        set((state) => ({
          queue: [
            ...state.queue,
            { ...item, id, status: 'pending', progress: 0 },
          ],
        }))
        return id
      },
      
      updateQueueItem: (id, updates) =>
        set((state) => ({
          queue: state.queue.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),
      
      removeFromQueue: (id) =>
        set((state) => ({
          queue: state.queue.filter((item) => item.id !== id),
        })),
      
      clearQueue: () => set({ queue: [] }),
    }),
    {
      name: 'ai-image-generator-storage',
      partialize: (state) => ({ images: state.images }),
    }
  )
)
