"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/storefront/product-card";
import { useCartStore } from "@/stores/use-cart-store";
import { useFavoritesStore } from "@/stores/use-favorites-store";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  compareAt?: number | null;
  images: string[];
  inventory: number;
  isFeatured: boolean;
  category?: { id: string; name: string; slug: string } | null;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

interface ProductsResponse {
  store: {
    name: string;
    currency: string;
  };
  categories: Category[];
  products: Product[];
  pagination: {
    page: number;
    pages: number;
    total: number;
  };
}

export default function ShopPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const storeSlug = params?.storeSlug as string;
  const locale = (params?.locale as string) || "en";

  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "latest";
  const page = searchParams.get("page") || "1";

  const [searchInput, setSearchInput] = useState(q);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ProductsResponse | null>(null);

  const cartStore = useCartStore(storeSlug);
  const favoritesStore = useFavoritesStore(storeSlug);
  const addToCart = cartStore((state) => state.addItem);
  const favorites = favoritesStore((state) => state.favorites);
  const toggleFavorite = favoritesStore((state) => state.toggleFavorite);

  const basePath = `/${locale}/store/${storeSlug}`;

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  useEffect(() => {
    let isCancelled = false;

    const loadProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const query = new URLSearchParams();
        if (q) query.set("q", q);
        if (category) query.set("category", category);
        if (sort) query.set("sort", sort);
        if (page) query.set("page", page);

        const res = await fetch(`/api/store/${storeSlug}/products?${query.toString()}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Failed to load products");
        }

        const payload = (await res.json()) as ProductsResponse;
        if (!isCancelled) {
          setData(payload);
        }
      } catch (requestError) {
        if (!isCancelled) {
          setError(requestError instanceof Error ? requestError.message : "Unexpected error");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    if (storeSlug) {
      loadProducts();
    }

    return () => {
      isCancelled = true;
    };
  }, [storeSlug, q, category, sort, page]);

  const updateParams = (entries: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(entries)) {
      if (!value) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }

    if (entries.category !== undefined || entries.q !== undefined || entries.sort !== undefined) {
      next.set("page", "1");
    }

    router.push(`${basePath}/shop?${next.toString()}`);
  };

  const title = useMemo(() => {
    if (q) {
      return `Results for "${q}"`;
    }

    if (category && data?.categories) {
      const selectedCategory = data.categories.find((item) => item.slug === category);
      if (selectedCategory) {
        return selectedCategory.name;
      }
    }

    return "Shop";
  }, [q, category, data?.categories]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <div className="rounded-3xl bg-[var(--muted)]/40 p-6 md:p-8">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Collections</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight text-[var(--primary)] md:text-5xl">{title}</h1>
        <p className="mt-3 max-w-xl text-sm text-[var(--muted-foreground)]">
          Discover curated pieces selected for clarity, comfort, and daily functionality.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-2xl bg-[var(--background)] p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            updateParams({ q: searchInput || null });
          }}
          className="flex w-full items-center gap-2 md:max-w-lg"
        >
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search in this store"
            className="h-11 w-full rounded-full bg-[var(--muted)] px-4 text-sm outline-none ring-[1px] ring-transparent transition focus:ring-[var(--primary)]"
          />
          <button
            type="submit"
            className="h-11 rounded-full bg-[var(--primary)] px-5 text-sm font-semibold text-white"
          >
            Search
          </button>
        </form>

        <select
          value={sort}
          onChange={(event) => updateParams({ sort: event.target.value })}
          className="h-11 rounded-full bg-[var(--muted)] px-4 text-sm outline-none"
        >
          <option value="latest">Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>

      {data?.categories && data.categories.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => updateParams({ category: null })}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider",
              !category
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--muted)] text-[var(--muted-foreground)]"
            )}
          >
            All
          </button>
          {data.categories.map((item) => (
            <button
              key={item.id}
              onClick={() => updateParams({ category: item.slug })}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider",
                category === item.slug
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--muted)] text-[var(--muted-foreground)]"
              )}
            >
              {item.name}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="mt-12 flex min-h-[30vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
        </div>
      )}

      {!loading && error && (
        <div className="mt-12 rounded-2xl bg-red-50 p-6 text-red-600">{error}</div>
      )}

      {!loading && !error && data && (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {data.products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                slug={product.slug}
                name={product.name}
                price={product.price}
                compareAt={product.compareAt}
                images={product.images}
                inventory={product.inventory}
                isFeatured={product.isFeatured}
                rating={product.rating}
                reviewCount={product.reviewCount}
                categoryName={product.category?.name}
                currency={data.store.currency}
                locale={locale}
                storeSlug={storeSlug}
                isFavorite={favorites.includes(product.id)}
                onToggleFavorite={toggleFavorite}
                onAddToCart={() =>
                  addToCart({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.images[0] || "",
                    currency: data.store.currency,
                  })
                }
              />
            ))}
          </div>

          {data.products.length === 0 && (
            <div className="mt-10 rounded-2xl bg-[var(--muted)]/40 p-8 text-center text-[var(--muted-foreground)]">
              No products match your current filters.
            </div>
          )}

          {data.pagination.pages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-3">
              <button
                onClick={() => updateParams({ page: String(Math.max(1, Number(page) - 1)) })}
                disabled={Number(page) <= 1}
                className="rounded-full bg-[var(--muted)] px-4 py-2 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-[var(--muted-foreground)]">
                Page {data.pagination.page} of {data.pagination.pages}
              </span>
              <button
                onClick={() => updateParams({ page: String(Math.min(data.pagination.pages, Number(page) + 1)) })}
                disabled={Number(page) >= data.pagination.pages}
                className="rounded-full bg-[var(--muted)] px-4 py-2 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
