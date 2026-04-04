"use client";

import Image from "next/image";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  compareAt?: number | null;
  images: string[];
  currency?: string;
  inventory: number;
  isFeatured?: boolean;
  categoryName?: string;
  className?: string;
  onAddToCart?: (id: string) => void;
  onView?: (id: string) => void;
}

export function ProductCard({
  id,
  name,
  price,
  compareAt,
  images,
  currency = "EGP",
  inventory,
  isFeatured,
  categoryName,
  className,
  onAddToCart,
  onView,
}: ProductCardProps) {
  const isOutOfStock = inventory <= 0;
  const hasDiscount = compareAt && compareAt > price;
  const discountPercent = hasDiscount
    ? Math.round(((compareAt - price) / compareAt) * 100)
    : 0;

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden",
        "rounded-[var(--radius,0.5rem)]",
        "border border-[var(--border,#e2e8f0)]",
        "bg-[var(--background,#ffffff)]",
        "transition-all duration-300 ease-in-out",
        "hover:shadow-lg hover:shadow-[var(--primary,#6366f1)]/10",
        "hover:-translate-y-1",
        className
      )}
    >
      {/* Image Container */}
      <div
        className="relative aspect-square overflow-hidden bg-[var(--muted,#f1f5f9)] cursor-pointer"
        onClick={() => onView?.(id)}
      >
        {images[0] ? (
          <Image
            src={images[0]}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-[var(--muted-foreground,#64748b)]">
            <svg className="size-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 start-2 flex flex-col gap-1">
          {isFeatured && (
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-[var(--accent,#f59e0b)] text-white rounded-full">
              Featured
            </span>
          )}
          {hasDiscount && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full">
              -{discountPercent}%
            </span>
          )}
          {isOutOfStock && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-gray-800 text-white rounded-full">
              Out of Stock
            </span>
          )}
        </div>

        {/* Quick Add Overlay */}
        {!isOutOfStock && (
          <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <Button
              size="sm"
              className="w-full backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart?.(id);
              }}
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add to Cart
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5 p-4">
        {categoryName && (
          <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted-foreground,#64748b)]">
            {categoryName}
          </span>
        )}
        <h3
          className="text-sm font-semibold text-[var(--foreground,#0f172a)] line-clamp-2 cursor-pointer hover:text-[var(--primary,#6366f1)] transition-colors"
          onClick={() => onView?.(id)}
        >
          {name}
        </h3>
        <div className="flex items-center gap-2 mt-auto pt-1">
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
}
