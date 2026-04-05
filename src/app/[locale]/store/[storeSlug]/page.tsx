"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { HeroBanner } from "@/components/storefront/hero-banner";
import { CategoryCard } from "@/components/storefront/category-card";
import { ProductCard } from "@/components/storefront/product-card";
import { useCartStore } from "@/stores/use-cart-store";
import { useFavoritesStore } from "@/stores/use-favorites-store";

interface StoreData {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  heroImageUrl?: string | null; // Keep it as optional since component expects it
  currency: string;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    imageUrl?: string | null;
  }>;
  products: Array<{
    id: string;
    name: string;
    slug: string;
    price: number;
    compareAt?: number | null;
    images: string[];
    inventory: number;
    isFeatured: boolean;
    createdAt: string;
    category?: { name: string } | null;
  }>;
}

export default function StoreHomePage() {
  const params = useParams();
  const storeSlug = params?.storeSlug as string;
  const locale = (params?.locale as string) || "en";

  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cart & Favorites
  const cartStore = useCartStore(storeSlug);
  const favoritesStore = useFavoritesStore(storeSlug);
  const addToCart = cartStore((s) => s.addItem);
  const favorites = favoritesStore((s) => s.favorites);
  const toggleFavorite = favoritesStore((s) => s.toggleFavorite);

  // Fetch store data
  useEffect(() => {
    async function fetchStore() {
      try {
        const res = await fetch(`/api/store/${storeSlug}`);
        if (!res.ok) throw new Error("Store not found");
        const data = await res.json();
        setStore(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load store");
      } finally {
        setLoading(false);
      }
    }
    if (storeSlug) {
      fetchStore();
    }
  }, [storeSlug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <svg className="size-20 mb-4 text-[var(--muted-foreground)] opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
        </svg>
        <p className="text-[var(--muted-foreground)]">{error || "Store not found"}</p>
      </div>
    );
  }

  // Check if products are new (less than 7 days old)
  const isNewProduct = (createdAt: string) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return new Date(createdAt) > sevenDaysAgo;
  };

  // Featured products
  const featuredProducts = store.products.filter((p) => p.isFeatured);
  const newArrivals = store.products.filter((p) => isNewProduct(p.createdAt)).slice(0, 4);
  const basePath = `/${locale}/store/${storeSlug}`;

  return (
    <div className="pb-8">
      {/* Hero Banner */}
      <HeroBanner
        imageUrl={store.heroImageUrl}
        storeName={store.name}
        title={store.description ? undefined : `Welcome to ${store.name}`}
        subtitle={store.description || "Discover amazing products at great prices"}
        ctaLink="#products"
      />

      {/* Categories Section */}
      {store.categories.length > 0 && (
        <section id="categories" className="container mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[var(--foreground)]">
              Shop by Category
            </h2>
            <Link
              href={`${basePath}/categories`}
              className="text-sm font-medium text-[var(--primary)] hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {store.categories.map((category) => (
              <CategoryCard
                key={category.id}
                name={category.name}
                slug={category.slug}
                imageUrl={category.imageUrl}
                href={`${basePath}/category/${category.slug}`}
              />
            ))}
          </div>
        </section>
      )}

      {/* Featured Products Section */}
      {featuredProducts.length > 0 && (
        <section className="container mx-auto px-4 py-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[var(--foreground)]">
              Featured Products
            </h2>
            <Link
              href={`${basePath}?filter=featured`}
              className="text-sm font-medium text-[var(--primary)] hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.slice(0, 8).map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                slug={product.slug}
                name={product.name}
                price={product.price}
                compareAt={product.compareAt}
                images={product.images}
                currency={store.currency}
                inventory={product.inventory}
                isFeatured={product.isFeatured}
                isNew={isNewProduct(product.createdAt)}
                categoryName={product.category?.name}
                storeSlug={storeSlug}
                locale={locale}
                isFavorite={favorites.includes(product.id)}
                onToggleFavorite={toggleFavorite}
                onAddToCart={(id) => {
                  addToCart({
                    id,
                    name: product.name,
                    price: product.price,
                    image: product.images[0] || "",
                    currency: store.currency,
                  });
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* New Arrivals Section */}
      {newArrivals.length > 0 && (
        <section className="container mx-auto px-4 py-10 bg-[var(--muted)]/30 -mx-4 px-8 sm:mx-0 sm:px-4 sm:rounded-3xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[var(--foreground)]">
              New Arrivals
            </h2>
            <Link
              href={`${basePath}?filter=new`}
              className="text-sm font-medium text-[var(--primary)] hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {newArrivals.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                slug={product.slug}
                name={product.name}
                price={product.price}
                compareAt={product.compareAt}
                images={product.images}
                currency={store.currency}
                inventory={product.inventory}
                isFeatured={product.isFeatured}
                isNew={true}
                categoryName={product.category?.name}
                storeSlug={storeSlug}
                locale={locale}
                isFavorite={favorites.includes(product.id)}
                onToggleFavorite={toggleFavorite}
                onAddToCart={(id) => {
                  addToCart({
                    id,
                    name: product.name,
                    price: product.price,
                    image: product.images[0] || "",
                    currency: store.currency,
                  });
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* All Products Section */}
      <section id="products" className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">
            All Products
          </h2>
        </div>
        {store.products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {store.products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                slug={product.slug}
                name={product.name}
                price={product.price}
                compareAt={product.compareAt}
                images={product.images}
                currency={store.currency}
                inventory={product.inventory}
                isFeatured={product.isFeatured}
                isNew={isNewProduct(product.createdAt)}
                categoryName={product.category?.name}
                storeSlug={storeSlug}
                locale={locale}
                isFavorite={favorites.includes(product.id)}
                onToggleFavorite={toggleFavorite}
                onAddToCart={(id) => {
                  addToCart({
                    id,
                    name: product.name,
                    price: product.price,
                    image: product.images[0] || "",
                    currency: store.currency,
                  });
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <svg className="size-16 mx-auto mb-4 opacity-20 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            <p className="text-[var(--muted-foreground)]">
              No products available yet. Check back soon!
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
