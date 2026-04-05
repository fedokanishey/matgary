import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface FavoritesStore {
  favorites: string[]; // Product IDs
  storeSlug: string | null;
  setStoreSlug: (slug: string) => void;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => void;
  addFavorite: (productId: string) => void;
  removeFavorite: (productId: string) => void;
  clearFavorites: () => void;
  getFavoritesCount: () => number;
}

// Create store-specific favorites stores
const favoritesStores = new Map<string, ReturnType<typeof createFavoritesStore>>();

function createFavoritesStore(storeSlug: string) {
  return create<FavoritesStore>()(
    persist(
      (set, get) => ({
        favorites: [],
        storeSlug,

        setStoreSlug: (slug) => set({ storeSlug: slug }),

        isFavorite: (productId) => get().favorites.includes(productId),

        toggleFavorite: (productId) => {
          set((state) => ({
            favorites: state.favorites.includes(productId)
              ? state.favorites.filter((id) => id !== productId)
              : [...state.favorites, productId],
          }));
        },

        addFavorite: (productId) => {
          set((state) => ({
            favorites: state.favorites.includes(productId)
              ? state.favorites
              : [...state.favorites, productId],
          }));
        },

        removeFavorite: (productId) => {
          set((state) => ({
            favorites: state.favorites.filter((id) => id !== productId),
          }));
        },

        clearFavorites: () => set({ favorites: [] }),

        getFavoritesCount: () => get().favorites.length,
      }),
      {
        name: `favorites_${storeSlug}`,
        storage: createJSONStorage(() => localStorage),
      }
    )
  );
}

export function useFavoritesStore(storeSlug: string) {
  if (!favoritesStores.has(storeSlug)) {
    favoritesStores.set(storeSlug, createFavoritesStore(storeSlug));
  }
  return favoritesStores.get(storeSlug)!;
}
