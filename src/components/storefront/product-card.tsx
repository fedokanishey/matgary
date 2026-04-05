"use client";

import Image from "next/image";
import Link from "next/link";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ProductCardProps {
  id: string;
  slug?: string;
  name: string;
  price: number;
  compareAt?: number | null;
  images: string[];
  currency?: string;
  inventory: number;
  isFeatured?: boolean;
  isNew?: boolean;
  rating?: number;
  reviewCount?: number;
  categoryName?: string;
  className?: string;
  storeSlug?: string;
  locale?: string;
  isFavorite?: boolean;
  onAddToCart?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  onView?: (id: string) => void;
}

export function ProductCard({
  id,
  slug,
  name,
  price,
  compareAt,
  images,
  currency = "EGP",
  inventory,
  isFeatured,
  isNew,
  rating,
  reviewCount,
  categoryName,
  className,
  storeSlug,
  locale = "en",
  isFavorite = false,
  onAddToCart,
  onToggleFavorite,
  onView,
}: ProductCardProps) {
  const isOutOfStock = inventory <= 0;
  const hasDiscount = compareAt && compareAt > price;
  const discountPercent = hasDiscount
    ? Math.round(((compareAt - price) / compareAt) * 100)
    : 0;

  const productLink = storeSlug && slug 
    ? `/${locale}/store/${storeSlug}/product/${slug}` 
    : undefined;

  // Star rating component
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={cn(
              "size-3",
              star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            )}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        {reviewCount !== undefined && (
          <span className="text-[10px] text-[var(--muted-foreground)] ml-1">
            ({reviewCount})
          </span>
        )}
      </div>
    );
  };

  const CardContent = (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden h-full",
        "rounded-2xl",
        "border border-[var(--border,#e2e8f0)]",
        "bg-[var(--background,#ffffff)]",
        "transition-all duration-300 ease-in-out",
        "hover:shadow-xl hover:shadow-[var(--primary,#6366f1)]/10",
        "hover:-translate-y-1",
        className
      )}
    >
      {/* Image Container */}
      <div
        className="relative aspect-square overflow-hidden bg-[var(--muted,#f1f5f9)] cursor-pointer"
        onClick={() => !productLink && onView?.(id)}
      >
        {images[0] ? (
          <Image
            src={images[0]}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-[var(--muted-foreground,#64748b)]">
            <svg className="size-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          </div>
        )}

        {/* Favorite Button */}
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite(id);
            }}
            className={cn(
              "absolute top-3 end-3 z-10 size-9 flex items-center justify-center rounded-full",
              "bg-white/90 backdrop-blur-sm shadow-md",
              "transition-all duration-200 hover:scale-110",
              isFavorite ? "text-red-500" : "text-[var(--muted-foreground)]"
            )}
          >
            <svg
              className="size-5"
              fill={isFavorite ? "currentColor" : "none"}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={isFavorite ? 0 : 1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
        )}

        {/* Badges */}
        <div className="absolute top-3 start-3 flex flex-col gap-1.5">
          {isNew && (
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase bg-[var(--primary)] text-white rounded-md">
              New
            </span>
          )}
          {isFeatured && !isNew && (
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase bg-[var(--accent,#f59e0b)] text-white rounded-md">
              Featured
            </span>
          )}
          {hasDiscount && (
            <span className="px-2.5 py-1 text-[10px] font-bold bg-red-500 text-white rounded-md">
              -{discountPercent}%
            </span>
          )}
          {isOutOfStock && (
            <span className="px-2.5 py-1 text-[10px] font-bold bg-gray-800 text-white rounded-md">
              Out of Stock
            </span>
          )}
        </div>

        {/* Quick Add Button - Circle button mimicking the screenshot */}
        {!isOutOfStock && onAddToCart && (
          <div className="absolute bottom-3 start-3 z-10 transition-transform duration-200 hover:scale-110 active:scale-95">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddToCart(id);
              }}
              className="flex size-[34px] items-center justify-center rounded-xl bg-white text-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100/50 hover:bg-gray-50 hover:text-black"
              aria-label="Add to Cart"
            >
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5 p-3 sm:p-4 flex-1">
        {/* Category */}
        {categoryName && (
          <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground,#64748b)]">
            {categoryName}
          </span>
        )}
        
        {/* Name */}
        <h3 className="text-sm font-semibold text-[var(--foreground,#0f172a)] line-clamp-2 hover:text-[var(--primary,#6366f1)] transition-colors">
          {name}
        </h3>

        {/* Rating */}
        {rating !== undefined && renderStars(rating)}

        {/* Price */}
        <div className="flex items-center gap-2 mt-auto pt-2">
          <span className="text-base font-bold text-[var(--primary,#6366f1)]">
            {formatPrice(price, currency)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-[var(--muted-foreground,#64748b)] line-through">
              {formatPrice(compareAt, currency)}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  // If we have a product link, wrap in Link
  if (productLink) {
    return <Link href={productLink} className="block h-full">{CardContent}</Link>;
  }

  return CardContent;
}
