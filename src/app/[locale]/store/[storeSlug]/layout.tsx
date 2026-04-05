import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { StorefrontHeader } from "@/components/storefront/header";
import { StorefrontFooter } from "@/components/storefront/footer";
import { MobileBottomNav } from "@/components/storefront/mobile-bottom-nav";
import { CartSidebar } from "@/components/storefront/cart-sidebar";

/**
 * Storefront layout — fetches store data and applies dynamic branding.
 * Each store slug gets its own CSS variables injected via ThemeProvider.
 */
export default async function StorefrontLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; storeSlug: string }>;
}) {
  const { locale, storeSlug } = await params;

  const store = await db.store.findUnique({
    where: { slug: storeSlug },
    include: { themeSettings: true },
  });

  if (!store || !store.isActive) {
    notFound();
  }

  return (
    <ThemeProvider themeSettings={store.themeSettings}>
      {/* Header */}
      <StorefrontHeader store={store} locale={locale} />

      {/* Cart Sidebar */}
      <CartSidebar 
        storeSlug={storeSlug} 
        locale={locale} 
        currency={store.currency} 
      />

      {/* Page Content */}
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>

      {/* Footer */}
      <StorefrontFooter store={store} locale={locale} />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav storeSlug={storeSlug} locale={locale} />
    </ThemeProvider>
  );
}
