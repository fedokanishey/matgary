import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AccountClientPage } from "./client-page";
import { cookies } from "next/headers";
import { verifyCustomerToken } from "@/lib/customer-auth";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string; storeSlug: string }>;
}) {
  const { locale, storeSlug } = await params;
  const store = await prisma.store.findUnique({
    where: { slug: storeSlug },
  });

  if (!store) {
    redirect(`/${locale}`);
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("customer_access_token")?.value;
  const refreshToken = cookieStore.get("customer_refresh_token")?.value;

  if (!accessToken && !refreshToken) {
    redirect(`/${locale}/store/${storeSlug}/auth/login`);
  }

  let customerId = null;

  if (accessToken) {
    try {
      const payload = await verifyCustomerToken(accessToken);
      customerId = payload.customerId;
    } catch {
      // access token valid or expired
    }
  }
  
  if (!customerId && refreshToken) {
    try {
      const payload = await verifyCustomerToken(refreshToken);
      customerId = payload.customerId;
    } catch {
      redirect(`/${locale}/store/${storeSlug}/auth/login`);
    }
  }

  if (!customerId) {
    redirect(`/${locale}/store/${storeSlug}/auth/login`);
  }

  const dbCustomer = await prisma.storeCustomer.findUnique({
    where: { id: customerId },
  });

  if (!dbCustomer || dbCustomer.storeId !== store.id) {
    redirect(`/${locale}/store/${storeSlug}/auth/login`);
  }

  return (
    <AccountClientPage 
      locale={locale} 
      storeSlug={storeSlug}
      storeId={store.id}
      user={{
        id: dbCustomer.id,
        email: dbCustomer.email,
        firstName: dbCustomer.firstName,
        lastName: dbCustomer.lastName,
        phone: dbCustomer.phone,
      }}
    />
  );
}