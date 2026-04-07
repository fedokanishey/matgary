"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ProductCard } from "@/components/storefront/product-card";
import { DraggableScroll } from "@/components/storefront/draggable-scroll";
import { useCartStore } from "@/stores/use-cart-store";
import { useFavoritesStore } from "@/stores/use-favorites-store";
import { useCustomerAuthStore } from "@/stores/use-customer-auth-store";
import { cn, formatPrice } from "@/lib/utils";

interface ProductDetails {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compareAt: number | null;
  images: string[];
  inventory: number;
  isFeatured: boolean;
  category: { id: string; name: string; slug: string } | null;
  rating: number;
  reviewCount: number;
  reviews: Array<{
    id: string;
    rating: number;
    title: string | null;
    comment: string | null;
    createdAt: string;
    customer: {
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
  }>;
}

interface ProductResponse {
  store: {
    id: string;
    name: string;
    currency: string;
    reviewsEnabled: boolean;
  };
  product: ProductDetails;
  relatedProducts: Array<{
    id: string;
    slug: string;
    name: string;
    price: number;
    compareAt: number | null;
    images: string[];
    inventory: number;
    isFeatured: boolean;
    category: { id: string; name: string; slug: string } | null;
    rating: number;
    reviewCount: number;
  }>;
}

export default function ProductPage() {
  const params = useParams();
  const storeSlug = params?.storeSlug as string;
  const locale = (params?.locale as string) || "en";
  const id = params?.id as string;

  const cartStore = useCartStore(storeSlug);
  const favoritesStore = useFavoritesStore(storeSlug);
  const authStore = useCustomerAuthStore(storeSlug);
  const customer = authStore((state) => state.customer);
  const addToCart = cartStore((state) => state.addItem);
  const toggleFavorite = favoritesStore((state) => state.toggleFavorite);
  const favorites = favoritesStore((state) => state.favorites);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<ProductResponse | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const loadProduct = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/store/${storeSlug}/product/${id}`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to load product");
      }
      const data = (await res.json()) as ProductResponse;
      setPayload(data);
      setSelectedImage(0);
      setQuantity(1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }, [storeSlug, id]);

  useEffect(() => {
    if (storeSlug && id) {
      loadProduct();
    }
  }, [storeSlug, id, loadProduct]);

  const basePath = `/${locale}/store/${storeSlug}`;
  const product = payload?.product;
  const relatedRailCardClassName = "snap-start shrink-0 w-[220px] sm:w-[230px] md:w-[240px] lg:w-[250px]";

  const hasDiscount = useMemo(() => {
    if (!product?.compareAt) return false;
    return product.compareAt > product.price;
  }, [product]);

  const discountPercent = useMemo(() => {
    if (!product?.compareAt || !hasDiscount) return 0;
    return Math.round(((product.compareAt - product.price) / product.compareAt) * 100);
  }, [product, hasDiscount]);

  const submitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!product) return;

    setReviewLoading(true);
    setReviewError(null);

    try {
      const res = await fetch(`/api/store/${storeSlug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          rating: reviewRating,
          title: reviewTitle,
          comment: reviewComment,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      setReviewTitle("");
      setReviewComment("");
      await loadProduct();
    } catch (requestError) {
      setReviewError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (error || !payload || !product) {
    return (
      <div className="mx-auto mt-10 max-w-xl rounded-2xl bg-red-50 p-6 text-red-600">
        {error || "Product not found"}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <div className="mb-6 flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
        <Link href={basePath}>Home</Link>
        <span>/</span>
        <Link href={`${basePath}/shop`}>Shop</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link href={`${basePath}/category/${product.category.slug}`}>{product.category.name}</Link>
          </>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-[var(--muted)]">
            {product.images[selectedImage] ? (
              <Image
                src={product.images[selectedImage]}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : null}

            {hasDiscount && (
              <span className="absolute left-4 top-4 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white">
                -{discountPercent}%
              </span>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
              {product.images.map((image, index) => (
                <button
                  key={image + index}
                  onClick={() => setSelectedImage(index)}
                  className={cn(
                    "relative h-20 w-20 overflow-hidden rounded-xl ring-2",
                    selectedImage === index ? "ring-[var(--primary)]" : "ring-transparent"
                  )}
                >
                  <Image src={image} alt={`${product.name} ${index + 1}`} fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <h1 className="text-4xl font-black tracking-tight text-[var(--primary)]">{product.name}</h1>

          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-[var(--primary)]">
              {formatPrice(product.price, payload.store.currency)}
            </span>
            {hasDiscount && (
              <span className="text-lg text-[var(--muted-foreground)] line-through">
                {formatPrice(product.compareAt || 0, payload.store.currency)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
            <span>{product.rating.toFixed(1)} / 5</span>
            <span>({product.reviewCount} reviews)</span>
            <span>•</span>
            <span>{product.inventory > 0 ? `${product.inventory} in stock` : "Out of stock"}</span>
          </div>

          {product.description && (
            <p className="leading-relaxed text-[var(--muted-foreground)]">{product.description}</p>
          )}

          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-full bg-[var(--muted)] p-1">
              <button
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="h-8 w-8 rounded-full text-sm"
              >
                -
              </button>
              <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity((prev) => Math.min(product.inventory, prev + 1))}
                className="h-8 w-8 rounded-full text-sm"
              >
                +
              </button>
            </div>

            <button
              disabled={product.inventory <= 0}
              onClick={() => {
                for (let i = 0; i < quantity; i += 1) {
                  addToCart({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.images[0] || "",
                    currency: payload.store.currency,
                  });
                }
              }}
              className="rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              Add To Cart
            </button>

            <button
              onClick={() => toggleFavorite(product.id)}
              className={cn(
                "rounded-full px-4 py-3 text-sm font-semibold",
                favorites.includes(product.id)
                  ? "bg-red-100 text-red-600"
                  : "bg-[var(--muted)] text-[var(--muted-foreground)]"
              )}
            >
              Wishlist
            </button>
          </div>
        </div>
      </div>

      {payload.store.reviewsEnabled && (
        <section className="mt-14 rounded-3xl bg-[var(--muted)]/35 p-6 md:p-8">
          <h2 className="text-2xl font-black text-[var(--primary)]">Reviews</h2>

          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              {product.reviews.length === 0 && (
                <p className="text-sm text-[var(--muted-foreground)]">No reviews yet.</p>
              )}

              {product.reviews.map((review) => (
                <article key={review.id} className="rounded-2xl bg-[var(--background)] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[var(--primary)]">
                      {review.customer.firstName || review.customer.lastName
                        ? `${review.customer.firstName || ""} ${review.customer.lastName || ""}`.trim()
                        : review.customer.email}
                    </p>
                    <p className="text-sm text-[var(--muted-foreground)]">{review.rating}/5</p>
                  </div>
                  {review.title && <h3 className="mt-2 font-semibold">{review.title}</h3>}
                  {review.comment && <p className="mt-1 text-sm text-[var(--muted-foreground)]">{review.comment}</p>}
                </article>
              ))}
            </div>

            <div className="rounded-2xl bg-[var(--background)] p-5">
              <h3 className="text-lg font-bold text-[var(--primary)]">Write a review</h3>

              {!customer && (
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                  Please <Link className="font-semibold text-[var(--primary)]" href={`${basePath}/auth/login`}>sign in</Link> to post a review.
                </p>
              )}

              {customer && (
                <form className="mt-4 space-y-3" onSubmit={submitReview}>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
                      Rating
                    </label>
                    <select
                      value={reviewRating}
                      onChange={(event) => setReviewRating(Number(event.target.value))}
                      className="h-10 w-full rounded-lg bg-[var(--muted)] px-3 text-sm outline-none"
                    >
                      {[5, 4, 3, 2, 1].map((value) => (
                        <option key={value} value={value}>
                          {value} / 5
                        </option>
                      ))}
                    </select>
                  </div>

                  <input
                    value={reviewTitle}
                    onChange={(event) => setReviewTitle(event.target.value)}
                    placeholder="Review title"
                    className="h-10 w-full rounded-lg bg-[var(--muted)] px-3 text-sm outline-none"
                  />

                  <textarea
                    value={reviewComment}
                    onChange={(event) => setReviewComment(event.target.value)}
                    placeholder="Share your experience"
                    className="min-h-28 w-full rounded-lg bg-[var(--muted)] px-3 py-2 text-sm outline-none"
                  />

                  {reviewError && <p className="text-sm text-red-600">{reviewError}</p>}

                  <button
                    disabled={reviewLoading}
                    type="submit"
                    className="rounded-full bg-[var(--primary)] px-6 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {reviewLoading ? "Posting..." : "Post Review"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      )}

      {payload.relatedProducts.length > 0 && (
        <section className="mt-14">
          <h2 className="text-2xl font-black text-[var(--primary)]">Curated For You</h2>
          <DraggableScroll className="mt-5">
            {payload.relatedProducts.map((related) => (
              <ProductCard
                key={related.id}
                id={related.id}
                slug={related.slug}
                name={related.name}
                price={related.price}
                compareAt={related.compareAt}
                images={related.images}
                inventory={related.inventory}
                isFeatured={related.isFeatured}
                categoryName={related.category?.name}
                rating={related.rating}
                reviewCount={related.reviewCount}
                currency={payload.store.currency}
                locale={locale}
                storeSlug={storeSlug}
                className={relatedRailCardClassName}
                isFavorite={favorites.includes(related.id)}
                onToggleFavorite={toggleFavorite}
                onAddToCart={() =>
                  addToCart({
                    id: related.id,
                    name: related.name,
                    price: related.price,
                    image: related.images[0] || "",
                    currency: payload.store.currency,
                  })
                }
              />
            ))}
          </DraggableScroll>
        </section>
      )}
    </div>
  );
}
