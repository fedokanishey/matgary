"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useCartStore } from "@/stores/use-cart-store";
import { useFavoritesStore } from "@/stores/use-favorites-store";
import { useCustomerAuthStore } from "@/stores/use-customer-auth-store";
import { cn } from "@/lib/utils";

interface StorefrontHeaderProps {
  store: {
    name: string;
    slug: string;
    logoUrl?: string | null;
  };
  locale: string;
  supportedLocales?: string[];
  darkModeEnabled?: boolean;
}

export function StorefrontHeader({ 
  store, 
  locale, 
  darkModeEnabled = true,
}: StorefrontHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  
  const cartStore = useCartStore(store.slug);
  const favoritesStore = useFavoritesStore(store.slug);
  const authStore = useCustomerAuthStore(store.slug);
  const customer = authStore((s) => s.customer);
  const setCustomer = authStore((s) => s.setCustomer);

  useEffect(() => {
    if (customer) return;

    let cancelled = false;

    const hydrateCustomer = async () => {
      try {
        let res = await fetch("/api/customer/me", { credentials: "include" });

        if (res.status === 401) {
          const refreshRes = await fetch("/api/customer/refresh", {
            method: "POST",
            credentials: "include",
          });

          if (refreshRes.ok) {
            res = await fetch("/api/customer/me", { credentials: "include" });
          }
        }

        if (!res.ok) {
          if (!cancelled) {
            setCustomer(null);
          }
          return;
        }

        const data = await res.json();
        if (cancelled) return;

        if (data.success && data.customer.store?.slug === store.slug) {
          setCustomer(data.customer);
        } else {
          setCustomer(null);
        }
      } catch {
        if (!cancelled) {
          setCustomer(null);
        }
      }
    };

    hydrateCustomer();

    return () => {
      cancelled = true;
    };
  }, [store.slug, customer, setCustomer]);
  
  const itemCount = cartStore((s) => s.getItemCount());
  const favCount = favoritesStore((s) => s.getFavoritesCount());
  const openCart = cartStore((s) => s.openCart);

  const fetchCart = cartStore((s) => s.fetchCart);
  const resetLocalCart = cartStore((s) => s.resetLocalCart);
  
  const fetchFavorites = favoritesStore((s) => s.fetchFavorites);
  const resetLocalFavorites = favoritesStore((s) => s.resetLocalFavorites);

  const basePath = `/${locale}/store/${store.slug}`;

  // Sync stores on customer login state change
  useEffect(() => {
    if (customer?.id) {
      fetchCart();
      fetchFavorites();
    } else {
      resetLocalCart();
      resetLocalFavorites();
    }
  }, [customer?.id, fetchCart, fetchFavorites, resetLocalCart, resetLocalFavorites]);

  // Initialize dark mode from localStorage
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem(`theme_${store.slug}`);
    if (savedTheme === "dark") {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, [store.slug]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem(`theme_${store.slug}`, "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem(`theme_${store.slug}`, "light");
    }
  };

  // Switch language
  const switchLanguage = (newLocale: string) => {
    if (pathname) {
      const newPath = pathname.replace(`/${locale}/`, `/${newLocale}/`);
      router.push(newPath);
    }
  };

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`${basePath}/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
    }
  };

  const navLinks = [
    { label: locale === "ar" ? "المتجر" : "Shop", href: basePath },
    { label: locale === "ar" ? "الأقسام" : "Categories", href: `${basePath}/categories` },
    { label: locale === "ar" ? "الأكثر مبيعاً" : "Best Sellers", href: `${basePath}?filter=best-sellers` },
    { label: locale === "ar" ? "وصل حديثاً" : "New Arrivals", href: `${basePath}?filter=new` },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-md">
        <div className="container mx-auto px-4">
          {/* Main Header Row */}
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Left: Mobile Menu + Logo */}
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors lg:hidden"
                aria-label="Toggle menu"
              >
                <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  )}
                </svg>
              </button>

              {/* Logo */}
              <Link href={basePath} className="flex items-center gap-2 shrink-0">
                {store.logoUrl ? (
                  <Image
                    src={store.logoUrl}
                    alt={store.name}
                    width={120}
                    height={48}
                    className="h-10 w-auto object-contain"
                    priority
                  />
                ) : (
                  <span className="text-xl font-bold text-[var(--foreground)]">
                    {store.name}
                  </span>
                )}
              </Link>
            </div>

            {/* Center: Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right: Search + Icons */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Desktop Search */}
              <form onSubmit={handleSearch} className="hidden md:flex items-center relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={locale === "ar" ? "ابحث عن منتجات..." : "Search products..."}
                  className="w-64 h-10 pl-10 pr-4 rounded-full border border-[var(--border)] bg-[var(--muted)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
                <svg className="absolute left-3 size-5 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </form>

              {/* Mobile Search Button */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors md:hidden"
                aria-label="Search"
              >
                <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </button>

              {/* Language Switcher - Direct Toggle */}
              {mounted ? (
                <button 
                  onClick={() => switchLanguage(locale === 'ar' ? 'en' : 'ar')} 
                  className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors text-sm font-medium uppercase min-w-[36px] flex items-center justify-center tracking-wide"
                >
                  {locale === 'ar' ? 'EN' : 'AR'}
                </button>
              ) : (
                <div className="w-9 h-9" />
              )}

              {/* Dark Mode Toggle */}
              {darkModeEnabled && (
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
                  aria-label="Toggle dark mode"
                >
                  {isDark ? (
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                    </svg>
                  ) : (
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                    </svg>
                  )}
                </button>
              )}

              {/* Favorites */}
              <Link
                href={`${basePath}/favorites`}
                className="relative p-2 rounded-lg hover:bg-[var(--muted)] transition-colors hidden sm:flex"
              >
                <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
                {mounted && favCount > 0 && (
                  <span className="absolute -top-1 -right-1 size-5 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full">
                    {favCount > 99 ? "99+" : favCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <button
                onClick={() => openCart()}
                className="relative p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
                aria-label="Open cart"
              >
                <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                {mounted && itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 size-5 flex items-center justify-center text-[10px] font-bold bg-[var(--primary)] text-white rounded-full">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </button>

              {/* Profile */}
              <Link
                href={`${basePath}/account`}
                className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors hidden sm:flex"
              >
                {customer ? (
                  <div className="size-6 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-xs font-bold">
                    {customer.firstName?.[0] || customer.email[0].toUpperCase()}
                  </div>
                ) : (
                  <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                )}
              </Link>
            </div>
          </div>

          {/* Mobile Search Bar */}
          {isSearchOpen && (
            <form onSubmit={handleSearch} className="pb-4 md:hidden">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={locale === "ar" ? "ابحث عن منتجات..." : "Search products..."}
                  autoFocus
                  className="w-full h-10 pl-10 pr-4 rounded-full border border-[var(--border)] bg-[var(--muted)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
            </form>
          )}
        </div>

        {/* Mobile Navigation Menu */}
        <div
          className={cn(
            "lg:hidden border-t border-[var(--border)] bg-[var(--background)] overflow-hidden transition-all duration-300",
            isMenuOpen ? "max-h-96" : "max-h-0"
          )}
        >
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="py-3 px-4 rounded-lg text-sm font-medium text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
    </>
  );
}
