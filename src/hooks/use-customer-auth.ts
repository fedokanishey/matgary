"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCustomerAuthStore } from "@/stores/use-customer-auth-store";

export interface Customer {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  storeId: string;
}

interface CustomerMeResponse {
  success: boolean;
  customer?: (Customer & { store?: { slug?: string } }) | null;
  error?: string;
}

interface AuthActionResponse {
  success: boolean;
  customer?: Customer;
  error?: string;
}

type RequestJsonResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  networkError: boolean;
};

export function useCustomerAuth(storeId: string, storeSlug: string) {
  const useAuthStore = useCustomerAuthStore(storeSlug);
  const customer = useAuthStore((s) => s.customer);
  const setCustomer = useAuthStore((s) => s.setCustomer);
  const isLoading = useAuthStore((s) => s.isLoading);
  const setIsLoading = useAuthStore((s) => s.setLoading);
  const router = useRouter();

  const requestJson = useCallback(async function <T>(url: string, init?: RequestInit): Promise<RequestJsonResult<T>> {
    try {
      const res = await fetch(url, {
        ...init,
        credentials: "include",
      });

      let data: T | null = null;
      try {
        data = (await res.json()) as T;
      } catch {
        data = null;
      }

      return {
        ok: res.ok,
        status: res.status,
        data,
        networkError: false,
      };
    } catch {
      return {
        ok: false,
        status: 0,
        data: null,
        networkError: true,
      };
    }
  }, []);

  const fetchCustomer = useCallback(async () => {
    try {
      const result = await requestJson<CustomerMeResponse>("/api/customer/me");

      if (
        result.ok &&
        result.data?.success &&
        result.data.customer &&
        result.data.customer.store?.slug === storeSlug
      ) {
        setCustomer(result.data.customer);
        return result.data.customer;
      }

      setCustomer(null);
    } catch {
      setCustomer(null);
    } finally {
      setIsLoading(false);
    }
  }, [requestJson, setCustomer, setIsLoading, storeSlug]);

  useEffect(() => {
    // Initial fetch, or silent login using refresh token if access token expired.
    // In production PWA, maybe intercepting fetch to handle 401 would be better, but this handles initial load.
    const initializeAuth = async () => {
      const meResult = await requestJson<CustomerMeResponse>("/api/customer/me");

      if (meResult.status === 401) {
        // Try refreshing token once
        const refreshResult = await requestJson<{ success: boolean; error?: string }>("/api/customer/refresh", {
          method: "POST",
        });

        if (refreshResult.ok) {
          await fetchCustomer(); // Re-fetch after successful refresh
        } else {
          setCustomer(null);
          setIsLoading(false);
        }
      } else if (meResult.ok) {
        if (
          meResult.data?.success &&
          meResult.data.customer &&
          meResult.data.customer.store?.slug === storeSlug
        ) {
          setCustomer(meResult.data.customer);
        } else {
          setCustomer(null);
        }

        setIsLoading(false);
      } else {
        setCustomer(null);
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [fetchCustomer, requestJson, setCustomer, setIsLoading, storeSlug]);

  const login = async (credentials: Record<string, unknown>) => {
    const result = await requestJson<AuthActionResponse>("/api/customer/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...(credentials as object), storeId }),
    });

    if (result.ok && result.data?.success && result.data.customer) {
      setCustomer(result.data.customer);
      return { success: true };
    }

    if (result.networkError) {
      return { success: false, error: "Network error. Please check your connection and try again." };
    }

    if (result.status === 401) {
      setCustomer(null);
    }

    return { success: false, error: result.data?.error || "Failed to login." };
  };

  const signUp = async (info: Record<string, unknown>) => {
    const result = await requestJson<AuthActionResponse>("/api/customer/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...(info as object), storeId }),
    });

    if (result.ok && result.data?.success && result.data.customer) {
      setCustomer(result.data.customer);
      return { success: true };
    }

    if (result.networkError) {
      return { success: false, error: "Network error. Please check your connection and try again." };
    }

    return { success: false, error: result.data?.error || "Failed to sign up." };
  };

  const logout = async () => {
    await requestJson<{ success: boolean; error?: string }>("/api/customer/logout", { method: "POST" });
    setCustomer(null);
    router.push(`/${window.location.pathname.split("/")[1]}/store/${storeSlug}`);
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return {
    customer,
    isLoading,
    login,
    signUp,
    logout,
  };
}
