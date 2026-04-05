import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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
  setStoreSlug: (slug: string) => void;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  openCart: () => void;
  closeCart: () => void;
}

// Create store-specific cart stores
const cartStores = new Map<string, ReturnType<typeof createCartStore>>();

function createCartStore(storeSlug: string) {
  return create<CartStore>()(
    persist(
      (set, get) => ({
        items: [],
        storeSlug,
        isCartOpen: false,

        setStoreSlug: (slug) => set({ storeSlug: slug }),

        addItem: (item) => {
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

        removeItem: (id) => {
          set((state) => ({
            items: state.items.filter((i) => i.id !== id),
          }));
        },

        updateQuantity: (id, quantity) => {
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

        clearCart: () => set({ items: [], isCartOpen: false }),

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
      }),
      {
        name: `cart_${storeSlug}`,
        storage: createJSONStorage(() => localStorage),
      }
    )
  );
}

export function useCartStore(storeSlug: string) {
  if (!cartStores.has(storeSlug)) {
    cartStores.set(storeSlug, createCartStore(storeSlug));
  }
  return cartStores.get(storeSlug)!;
}

// Legacy export for backward compatibility (uses default store)
export const useDefaultCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      storeSlug: null,
      isCartOpen: false,

      setStoreSlug: (slug) => set({ storeSlug: slug }),

      addItem: (item) => {
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

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
      },

      updateQuantity: (id, quantity) => {
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

      clearCart: () => set({ items: [], isCartOpen: false }),

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
    }),
    {
      name: "matgary-cart",
    }
  )
);
