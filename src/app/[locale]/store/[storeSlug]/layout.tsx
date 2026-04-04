import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ThemeProvider } from "@/components/providers/theme-provider";

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
  const { storeSlug } = await params;

  const store = await db.store.findUnique({
    where: { slug: storeSlug },
    include: { themeSettings: true },
  });

  if (!store || !store.isActive) {
    notFound();
  }

  return (
    <ThemeProvider themeSettings={store.themeSettings}>
      {/* Storefront Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur-md">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {store.logoUrl && (
              <img src={store.logoUrl} alt={store.name} className="size-8 rounded-lg object-cover" />
            )}
            <span className="font-bold text-lg text-[var(--foreground)]">
              {store.name}
            </span>
          </div>

          <nav className="flex items-center gap-4 text-sm">
            <button className="relative p-2 hover:bg-[var(--muted)] rounded-lg transition-colors">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </button>
          </nav>
        </div>
      </header>

      {/* Page Content */}
      <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-6 text-center text-sm text-[var(--muted-foreground)]">
        <p>Powered by <strong>Matgary</strong></p>
      </footer>
    </ThemeProvider>
  );
}
