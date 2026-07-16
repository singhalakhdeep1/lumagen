import { create } from 'zustand';

export interface MediaItem {
  id: string;
  url: string;
  prompt: string;
  style: string;
  createdAt: Date;
  tags: string[];
  metadata: {
    width?: number;
    height?: number;
    format?: string;
    size?: number;
  };
}

export interface MediaStore {
  items: MediaItem[];
  collections: { [key: string]: string[] };
  addItem: (item: Omit<MediaItem, 'id' | 'createdAt'>) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<MediaItem>) => void;
  createCollection: (name: string) => void;
  deleteCollection: (name: string) => void;
  addToCollection: (collectionName: string, itemId: string) => void;
  removeFromCollection: (collectionName: string, itemId: string) => void;
  searchItems: (query: string) => MediaItem[];
  filterByTag: (tag: string) => MediaItem[];
  getCollectionItems: (collectionName: string) => MediaItem[];
}

export const useMediaStore = create<MediaStore>((set, get) => ({
  items: [],
  collections: {},

  addItem: (item) => set((state) => ({
    items: [...state.items, { 
      ...item, 
      id: crypto.randomUUID(), 
      createdAt: new Date() 
    }],
  })),

  removeItem: (id) => set((state) => ({
    items: state.items.filter((item) => item.id !== id),
    collections: Object.fromEntries(
      Object.entries(state.collections).map(([name, itemIds]) => [
        name,
        itemIds.filter((itemId) => itemId !== id),
      ])
    ),
  })),

  updateItem: (id, updates) => set((state) => ({
    items: state.items.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    ),
  })),

  createCollection: (name) => set((state) => ({
    collections: { ...state.collections, [name]: [] },
  })),

  deleteCollection: (name) => set((state) => {
    const newCollections = { ...state.collections };
    delete newCollections[name];
    return { collections: newCollections };
  }),

  addToCollection: (collectionName, itemId) => set((state) => ({
    collections: {
      ...state.collections,
      [collectionName]: [
        ...(state.collections[collectionName] || []),
        itemId,
      ],
    },
  })),

  removeFromCollection: (collectionName, itemId) => set((state) => ({
    collections: {
      ...state.collections,
      [collectionName]: (state.collections[collectionName] || []).filter(
        (id) => id !== itemId
      ),
    },
  })),

  searchItems: (query) => {
    const state = get();
    const lowerQuery = query.toLowerCase();
    return state.items.filter(
      (item) =>
        item.prompt.toLowerCase().includes(lowerQuery) ||
        item.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  },

  filterByTag: (tag) => {
    const state = get();
    return state.items.filter((item) => item.tags.includes(tag));
  },

  getCollectionItems: (collectionName) => {
    const state = get();
    const itemIds = state.collections[collectionName] || [];
    return state.items.filter((item) => itemIds.includes(item.id));
  },
}));
