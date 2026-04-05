import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface StoreCustomer {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
}

interface CustomerAuthStore {
  customer: StoreCustomer | null;
  token: string | null;
  isLoading: boolean;
  setCustomer: (customer: StoreCustomer | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

// Create store-specific auth stores
const authStores = new Map<string, ReturnType<typeof createAuthStore>>();

function createAuthStore(storeSlug: string) {
  return create<CustomerAuthStore>()(
    persist(
      (set) => ({
        customer: null,
        token: null,
        isLoading: false,

        setCustomer: (customer) => set({ customer }),
        setToken: (token) => set({ token }),
        setLoading: (isLoading) => set({ isLoading }),
        
        logout: () => set({ customer: null, token: null }),
      }),
      {
        name: `customer_auth_${storeSlug}`,
        storage: createJSONStorage(() => localStorage),
      }
    )
  );
}

export function useCustomerAuthStore(storeSlug: string) {
  if (!authStores.has(storeSlug)) {
    authStores.set(storeSlug, createAuthStore(storeSlug));
  }
  return authStores.get(storeSlug)!;
}
