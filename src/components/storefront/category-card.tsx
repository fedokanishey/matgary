"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  name: string;
  slug: string;
  imageUrl?: string | null;
  href: string;
  className?: string;
}

export function CategoryCard({
  name,
  imageUrl,
  href,
  className,
}: CategoryCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex-shrink-0 overflow-hidden rounded-2xl",
        "w-36 h-44 sm:w-44 sm:h-52 md:w-52 md:h-64",
        "transition-transform duration-300 hover:scale-105",
        className
      )}
    >
      {/* Background Image or Gradient */}
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 640px) 144px, (max-width: 768px) 176px, 208px"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)]" />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-end p-4">
        <h3 className="text-white text-center font-semibold text-sm sm:text-base line-clamp-2">
          {name}
        </h3>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-[var(--primary)]/0 group-hover:bg-[var(--primary)]/10 transition-colors duration-300" />
    </Link>
  );
}
