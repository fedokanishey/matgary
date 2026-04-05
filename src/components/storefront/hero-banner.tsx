"use client";

import Image from "next/image";
import Link from "next/link";

interface HeroBannerProps {
  imageUrl?: string | null;
  storeName: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
}

export function HeroBanner({
  imageUrl,
  storeName,
  title,
  subtitle,
  ctaText = "Shop Now",
  ctaLink = "#products",
}: HeroBannerProps) {
  // Default gradient background if no image
  const defaultGradient = "from-[var(--primary)] via-[var(--secondary)] to-[var(--accent)]";

  return (
    <section className="relative w-full overflow-hidden">
      {/* Background */}
      <div className="relative h-[50vh] min-h-[400px] max-h-[600px] w-full">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={storeName}
            fill
            className="object-cover"
            priority
            quality={90}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
            unoptimized={imageUrl.includes('cloudinary.com')}
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${defaultGradient}`} />
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center text-white">
              {/* Title */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                {title || `Welcome to ${storeName}`}
              </h1>

              {/* Subtitle */}
              {subtitle && (
                <p className="text-lg sm:text-xl md:text-2xl mb-8 opacity-90">
                  {subtitle}
                </p>
              )}

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href={ctaLink}
                  className="inline-flex items-center justify-center px-8 py-3 text-base font-semibold rounded-full bg-white text-[var(--primary)] hover:bg-white/90 transition-colors"
                >
                  {ctaText}
                </Link>
                <Link
                  href="#categories"
                  className="inline-flex items-center justify-center px-8 py-3 text-base font-semibold rounded-full border-2 border-white text-white hover:bg-white/10 transition-colors"
                >
                  Browse Categories
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Gradient Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[var(--background)] to-transparent" />
      </div>
    </section>
  );
}
