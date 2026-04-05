"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useFavoritesStore } from "@/stores/use-favorites-store";
import { useCartStore } from "@/stores/use-cart-store";
import { ProductCard } from "@/components/storefront/product-card";

interface Product {
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
}

export default function FavoritesPage({
  params,
}: {
  params: Promise<{ locale: string; storeSlug: string }>;
}) {
  const { locale, storeSlug } = use(params);
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(true);

  const cartStore = useCartStore(storeSlug);
  const favoritesStore = useFavoritesStore(storeSlug);
  const items = favoritesStore((s) => s.favorites);
  const toggleFavorite = favoritesStore((s) => s.toggleFavorite);
  const addToCart = cartStore((s) => s.addItem);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchStore() {
      try {
        const res = await fetch(`/api/store/${storeSlug}`);
        if (!res.ok) throw new Error("Store not found");
        const data = await res.json();
        setProducts(data.products || []);
        setCurrency(data.currency || "USD");
      } catch (err) {
        console.error("Failed to load store data", err);
      } finally {
        setLoading(false);
      }
    }
    if (storeSlug) {
      fetchStore();
    }
  }, [storeSlug]);

  if (!mounted) {
    return <div className="h-[60vh] flex items-center justify-center animate-pulse bg-gray-50/50">...</div>;
  }

  const isAr = locale === "ar";
  const basePath = `/${locale}/store/${storeSlug}`;

  if (!items || items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center flex flex-col items-center justify-center h-[60vh]">
        <svg className="size-20 text-gray-300 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          {isAr ? "قائمة المفضلة فارغة" : "Your Wishlist is Empty"}
        </h1>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          {isAr 
            ? "لم تقم بإضافة أي منتجات إلى قائمة المفضلة الخاصة بك بعد. تصفح المتجر وأضف ما يعجبك بضغطة زر!" 
            : "You haven't added any products to your wishlist yet. Browse the store and add your favorites!"}
        </p>
        <Link 
          href={basePath}
          className="px-8 py-3 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 transition-colors shadow-sm font-medium"
        >
          {isAr ? "تصفح المنتجات" : "Browse Products"}
        </Link>
      </div>
    );
  }

  const isNewProduct = (createdAt: string) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return new Date(createdAt) > sevenDaysAgo;
  };

  const favoriteProducts = products.filter(p => items.includes(p.id));

  return (
    <div className="container mx-auto px-4 py-12 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3 border-b pb-6">
        <svg className="size-8 text-red-500 fill-red-500" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
        {isAr ? "المفضلة" : "My Wishlist"} <span className="text-gray-400 text-lg ml-2 font-normal">({items.length})</span>
      </h1>
      
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
        </div>
      ) : favoriteProducts.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          {isAr ? "جميع المنتجات المفضلة لم تعد متوفرة." : "All favorite products are no longer available."}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {favoriteProducts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              slug={product.slug}
              name={product.name}
              price={product.price}
              compareAt={product.compareAt}
              images={product.images}
              currency={currency}
              inventory={product.inventory}
              isFeatured={product.isFeatured}
              isNew={isNewProduct(product.createdAt)}
              categoryName={product.category?.name}
              storeSlug={storeSlug}
              locale={locale}
              isFavorite={items.includes(product.id)}
              onToggleFavorite={toggleFavorite}
              onAddToCart={(id) => {
                addToCart({
                  id,
                  name: product.name,
                  price: product.price,
                  image: product.images[0] || "",
                  currency: currency,
                });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}