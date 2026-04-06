import { create } from "zustand";
import { getCustomerAuthStore } from "./use-customer-auth-store";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  currency: string;
}

interface CartStore {
  items: CartItem[];
  storeSlug: string | null;
  isCartOpen: boolean;
  isLoading: boolean;
  setStoreSlug: (slug: string) => void;
  fetchCart: () => Promise<void>;
  syncCart: (items: CartItem[]) => Promise<boolean>;
  addItem: (item: Omit<CartItem, "quantity">) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  resetLocalCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  openCart: () => void;
  closeCart: () => void;
}

// Create store-specific cart stores
const cartStores = new Map<string, ReturnType<typeof createCartStore>>();

function createCartStore(storeSlug: string) {
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

  return create<CartStore>()((set, get) => ({
    items: [],
    storeSlug,
    isCartOpen: false,
    isLoading: false,

    setStoreSlug: (slug) => set({ storeSlug: slug }),

    fetchCart: async () => {
      set({ isLoading: true });
      try {
        const res = await requestWithRefresh(`/api/store/${storeSlug}/customer/cart`);
        if (res.ok) {
          const data = await res.json();
          set({ items: data });
        } else {
          if (res.status === 401) {
            getCustomerAuthStore(storeSlug).getState().setCustomer(null);
          }
          set({ items: [] });
        }
      } catch (error) {
        console.error("Failed to fetch cart", error);
      } finally {
        set({ isLoading: false });
      }
    },

    syncCart: async (itemsToSync) => {
      try {
        const res = await requestWithRefresh(`/api/store/${storeSlug}/customer/cart`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ items: itemsToSync })
        });

        if (!res.ok) {
          if (res.status === 401) {
            getCustomerAuthStore(storeSlug).getState().setCustomer(null);
          }
          return false;
        }

        return true;
      } catch (error) {
        console.error("Failed to sync cart", error);
        return false;
      }
    },

    addItem: async (item) => {
      const authStore = getCustomerAuthStore(storeSlug);
      if (!authStore.getState().customer) {
        const locale = typeof window !== "undefined" ? window.location.pathname.split("/")[1] : "en";
        if (typeof window !== "undefined") {
           window.location.href = `/${locale}/store/${storeSlug}/auth/login`;
        }
        return;
      }

      const state = get();
      const existing = state.items.find((i) => i.id === item.id);
      let newItems: CartItem[];
      
      if (existing) {
        newItems = state.items.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        newItems = [...state.items, { ...item, quantity: 1 }];
      }

      set({ items: newItems, isCartOpen: true });
      const synced = await get().syncCart(newItems);
      if (!synced) {
        set({ items: state.items });
      }
    },

    removeItem: async (id) => {
      const previousItems = get().items;
      const newItems = previousItems.filter((i) => i.id !== id);
      set({ items: newItems });
      const synced = await get().syncCart(newItems);
      if (!synced) {
        set({ items: previousItems });
      }
    },

    updateQuantity: async (id, quantity) => {
      if (quantity <= 0) {
        await get().removeItem(id);
        return;
      }
      
      const previousItems = get().items;
      const newItems = previousItems.map((i) =>
        i.id === id ? { ...i, quantity } : i
      );
      set({ items: newItems });
      const synced = await get().syncCart(newItems);
      if (!synced) {
        set({ items: previousItems });
      }
    },

    clearCart: async () => {
      const previousItems = get().items;
      const wasCartOpen = get().isCartOpen;
      set({ items: [], isCartOpen: false });
      const synced = await get().syncCart([]);
      if (!synced) {
        set({ items: previousItems, isCartOpen: wasCartOpen });
      }
    },

    resetLocalCart: () => {
      set({ items: [], isCartOpen: false });
    },

    getTotal: () => {
      return get().items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );
    },

    getItemCount: () => {
      return get().items.reduce((count, item) => count + item.quantity, 0);
    },

    openCart: () => set({ isCartOpen: true }),
    closeCart: () => set({ isCartOpen: false }),
  }));
}

export function useCartStore(storeSlug: string) {
  if (!cartStores.has(storeSlug)) {
    cartStores.set(storeSlug, createCartStore(storeSlug));
  }
  return cartStores.get(storeSlug)!;
}

// Legacy export for backward compatibility (uses default store)
export const useDefaultCartStore = create<CartStore>()((set, get) => ({
      items: [],
      storeSlug: null,
      isCartOpen: false,
      isLoading: false,

      setStoreSlug: (slug) => set({ storeSlug: slug }),

      fetchCart: async () => {},
      syncCart: async () => true,

      addItem: async (item) => {
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
              isCartOpen: true,
            };
          }
          return { 
            items: [...state.items, { ...item, quantity: 1 }],
            isCartOpen: true,
          };
        });
      },

      removeItem: async (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
      },

      updateQuantity: async (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: async () => set({ items: [], isCartOpen: false }),
      resetLocalCart: () => set({ items: [], isCartOpen: false }),

      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },

      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
}));
