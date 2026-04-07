import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyCustomerToken } from "@/lib/customer-auth";

interface CustomerSession {
  customerId: string;
  storeId: string;
}

export async function getStoreBySlug(storeSlug: string) {
  return prisma.store.findUnique({
    where: { slug: storeSlug },
    include: {
      configuration: true,
      themeSettings: true,
    },
  });
}

async function getCustomerSessionFromCookies(): Promise<CustomerSession | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("customer_access_token")?.value;
  const refreshToken = cookieStore.get("customer_refresh_token")?.value;

  if (accessToken) {
    try {
      const payload = await verifyCustomerToken(accessToken);
      if (payload.customerId && payload.storeId) {
        return { customerId: payload.customerId, storeId: payload.storeId };
      }
    } catch {
      // Try refresh token fallback.
    }
  }

  if (refreshToken) {
    try {
      const payload = await verifyCustomerToken(refreshToken);
      if (payload.customerId && payload.storeId) {
        return { customerId: payload.customerId, storeId: payload.storeId };
      }
    } catch {
      return null;
    }
  }

  return null;
}

export async function getStorefrontCustomer(storeSlug: string) {
  const store = await getStoreBySlug(storeSlug);
  if (!store || !store.isActive) {
    return { store: null, customer: null };
  }

  const session = await getCustomerSessionFromCookies();
  if (!session || session.storeId !== store.id) {
    return { store, customer: null };
  }

  const customer = await prisma.storeCustomer.findFirst({
    where: {
      id: session.customerId,
      storeId: store.id,
      isActive: true,
    },
  });

  return { store, customer };
}
