import { create } from "zustand";
import { getCustomerAuthStore } from "./use-customer-auth-store";

interface FavoritesStore {
  favorites: string[]; // Product IDs
  storeSlug: string | null;
  isLoading: boolean;
  setStoreSlug: (slug: string) => void;
  fetchFavorites: () => Promise<void>;
  syncFavorite: (productId: string, action: 'add' | 'remove') => Promise<boolean>;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => Promise<void>;
  addFavorite: (productId: string) => Promise<void>;
  removeFavorite: (productId: string) => Promise<void>;
  clearFavorites: () => void;
  resetLocalFavorites: () => void;
  getFavoritesCount: () => number;
}

// Create store-specific favorites stores
const favoritesStores = new Map<string, ReturnType<typeof createFavoritesStore>>();

function createFavoritesStore(storeSlug: string) {
  const requestWithRefresh = async (url: string, init?: RequestInit) => {
    const config: RequestInit = {
      ...init,
      credentials: "include",
    };

    let res = await fetch(url, config);
    if (res.status === 401) {
      const refreshRes = await fetch("/api/customer/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (refreshRes.ok) {
        res = await fetch(url, config);
      }
    }

    return res;
  };

  return create<FavoritesStore>()((set, get) => ({
    favorites: [],
    storeSlug,
    isLoading: false,

    setStoreSlug: (slug) => set({ storeSlug: slug }),

    fetchFavorites: async () => {
      set({ isLoading: true });
      try {
        const res = await requestWithRefresh(`/api/store/${storeSlug}/customer/favorites`);
        if (res.ok) {
          const data = await res.json();
          set({ favorites: data.favorites || [] });
        } else {
          if (res.status === 401) {
            getCustomerAuthStore(storeSlug).getState().setCustomer(null);
          }
          set({ favorites: [] });
        }
      } catch (error) {
        console.error("Failed to fetch favorites", error);
      } finally {
        set({ isLoading: false });
      }
    },

    syncFavorite: async (productId, action) => {
      try {
        const res = await requestWithRefresh(`/api/store/${storeSlug}/customer/favorites`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ productId, action })
        });

        if (!res.ok) {
          if (res.status === 401) {
            getCustomerAuthStore(storeSlug).getState().setCustomer(null);
          }
          return false;
        }

        return true;
      } catch (error) {
        console.error(`Failed to sync favorite ${action}`, error);
        return false;
      }
    },

    isFavorite: (productId) => get().favorites.includes(productId),

    toggleFavorite: async (productId) => {
      const authStore = getCustomerAuthStore(storeSlug);
      if (!authStore.getState().customer) {
        const locale = typeof window !== "undefined" ? window.location.pathname.split("/")[1] : "en";
        if (typeof window !== "undefined") {
           window.location.href = `/${locale}/store/${storeSlug}/auth/login`;
        }
        return;
      }
      const isFav = get().isFavorite(productId);
      if (isFav) {
        await get().removeFavorite(productId);
      } else {
        await get().addFavorite(productId);
      }
    },

    addFavorite: async (productId) => {
      const authStore = getCustomerAuthStore(storeSlug);
      if (!authStore.getState().customer) return;

      const state = get();
      if (!state.favorites.includes(productId)) {
        const nextFavorites = [...state.favorites, productId];
        set({ favorites: nextFavorites });
        const synced = await get().syncFavorite(productId, 'add');
        if (!synced) {
          set({ favorites: state.favorites });
        }
      }
    },

    removeFavorite: async (productId) => {
      const state = get();
      if (state.favorites.includes(productId)) {
        const nextFavorites = state.favorites.filter((id) => id !== productId);
        set({ favorites: nextFavorites });
        const synced = await get().syncFavorite(productId, 'remove');
        if (!synced) {
          set({ favorites: state.favorites });
        }
      }
    },

    clearFavorites: () => set({ favorites: [] }),
    resetLocalFavorites: () => set({ favorites: [] }),

    getFavoritesCount: () => get().favorites.length,
  }));
}

export function useFavoritesStore(storeSlug: string) {
  if (!favoritesStores.has(storeSlug)) {
    favoritesStores.set(storeSlug, createFavoritesStore(storeSlug));
  }
  return favoritesStores.get(storeSlug)!;
}
