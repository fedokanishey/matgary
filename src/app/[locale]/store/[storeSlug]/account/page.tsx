import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AccountClientPage } from "./client-page";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string; storeSlug: string }>;
}) {
  const { locale, storeSlug } = await params;
  
  // 1. Get Clerk user (Server-side auth check)
  const { userId } = await auth();
  
  if (!userId) {
    redirect(`/${locale}/store/${storeSlug}/auth/login`);
  }
  
  const clerkUser = await currentUser();
  if (!clerkUser) {
    redirect(`/${locale}/store/${storeSlug}/auth/login`);
  }

  const primaryEmail = clerkUser.emailAddresses.find(
    (e) => e.id === clerkUser.primaryEmailAddressId
  )?.emailAddress || clerkUser.emailAddresses[0]?.emailAddress;

  // Render client component and pass user info!
  return (
    <AccountClientPage 
      locale={locale} 
      storeSlug={storeSlug}
      user={{
        id: userId,
        email: primaryEmail || "",
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        phone: null,
      }}
    />
  );
}