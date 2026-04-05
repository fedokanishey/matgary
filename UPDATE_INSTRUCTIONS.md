# تعليمات التحديث - Storefront Redesign

## التغييرات المنفذة ✅

### 1. Database Schema
- تم تغيير `faviconUrl` إلى `heroImageUrl` في `prisma/schema.prisma`
- تم إضافة `StoreCustomer` model للمستخدمين الخاصين بكل متجر
- تم إضافة `CustomerAddress` model لعناوين التوصيل

### 2. الخطوات المطلوبة منك:

#### خطوة 1: تشغيل Prisma
```bash
cd D:\Projects\matgary
npx prisma generate
npx prisma db push
```

#### خطوة 2: إنشاء مجلد صفحة المنتج
```bash
mkdir -p "D:\Projects\matgary\src\app\[locale]\store\[storeSlug]\product\[productSlug]"
```

أو يدوياً عبر File Explorer:
1. انتقل إلى `src\app\[locale]\store\[storeSlug]`
2. أنشئ مجلد `product`
3. داخل `product` أنشئ مجلد `[productSlug]`

#### خطوة 3: إنشاء ملف صفحة المنتج
قم بإنشاء الملف التالي:
`D:\Projects\matgary\src\app\[locale]\store\[storeSlug]\product\[productSlug]\page.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/stores/use-cart-store";
import { useFavoritesStore } from "@/stores/use-favorites-store";
import { formatPrice, cn } from "@/lib/utils";
import { ProductCard } from "@/components/storefront/product-card";

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
  createdAt: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export default function ProductPage() {
  const params = useParams();
  const storeSlug = params?.storeSlug as string;
  const productSlug = params?.productSlug as string;
  const locale = (params?.locale as string) || "en";

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [currency, setCurrency] = useState("EGP");
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Cart & Favorites
  const cartStore = useCartStore(storeSlug);
  const favoritesStore = useFavoritesStore(storeSlug);
  const addToCart = cartStore((s) => s.addItem);
  const isFavorite = favoritesStore((s) => s.isFavorite);
  const toggleFavorite = favoritesStore((s) => s.toggleFavorite);

  // Fetch product data
  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/store/${storeSlug}/product/${productSlug}`);
        if (!res.ok) return;
        const data = await res.json();
        setProduct(data.product);
        setRelatedProducts(data.relatedProducts || []);
        setCurrency(data.currency);
      } catch (err) {
        console.error("Failed to load product:", err);
      } finally {
        setLoading(false);
      }
    }
    if (storeSlug && productSlug) {
      fetchProduct();
    }
  }, [storeSlug, productSlug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <svg className="size-20 mb-4 text-[var(--muted-foreground)] opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
        <p className="text-[var(--muted-foreground)]">Product not found</p>
        <Link
          href={`/${locale}/store/${storeSlug}`}
          className="mt-4 px-6 py-2 bg-[var(--primary)] text-white rounded-full font-medium"
        >
          Back to Store
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.inventory <= 0;
  const hasDiscount = product.compareAt && product.compareAt > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAt! - product.price) / product.compareAt!) * 100)
    : 0;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0] || "",
        currency,
      });
    }
  };

  const basePath = `/${locale}/store/${storeSlug}`;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] mb-6">
        <Link href={basePath} className="hover:text-[var(--primary)]">
          Home
        </Link>
        <span>/</span>
        {product.category && (
          <>
            <Link
              href={`${basePath}/category/${product.category.slug}`}
              className="hover:text-[var(--primary)]"
            >
              {product.category.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-[var(--foreground)] truncate max-w-[200px]">
          {product.name}
        </span>
      </nav>

      {/* Product Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--muted)]">
            {product.images[selectedImage] ? (
              <Image
                src={product.images[selectedImage]}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <svg className="size-20 text-[var(--muted-foreground)] opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909" />
                </svg>
              </div>
            )}
            
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {hasDiscount && (
                <span className="px-3 py-1 text-xs font-bold bg-red-500 text-white rounded-md">
                  -{discountPercent}% OFF
                </span>
              )}
              {isOutOfStock && (
                <span className="px-3 py-1 text-xs font-bold bg-gray-800 text-white rounded-md">
                  Out of Stock
                </span>
              )}
            </div>

            <button
              onClick={() => toggleFavorite(product.id)}
              className={cn(
                "absolute top-4 right-4 size-10 flex items-center justify-center rounded-full",
                "bg-white/90 backdrop-blur-sm shadow-md",
                "transition-all duration-200 hover:scale-110",
                isFavorite(product.id) ? "text-red-500" : "text-[var(--muted-foreground)]"
              )}
            >
              <svg
                className="size-6"
                fill={isFavorite(product.id) ? "currentColor" : "none"}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={isFavorite(product.id) ? 0 : 1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </button>
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={cn(
                    "relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border-2 transition-all",
                    selectedImage === idx
                      ? "border-[var(--primary)]"
                      : "border-transparent hover:border-[var(--border)]"
                  )}
                >
                  <Image src={img} alt={`${product.name} ${idx + 1}`} fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {product.category && (
            <Link href={`${basePath}/category/${product.category.slug}`} className="text-sm text-[var(--primary)] font-medium hover:underline">
              {product.category.name}
            </Link>
          )}

          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">{product.name}</h1>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-[var(--primary)]">{formatPrice(product.price, currency)}</span>
            {hasDiscount && (
              <span className="text-xl text-[var(--muted-foreground)] line-through">{formatPrice(product.compareAt!, currency)}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className={cn("size-2 rounded-full", isOutOfStock ? "bg-red-500" : product.inventory <= 5 ? "bg-yellow-500" : "bg-green-500")} />
            <span className="text-sm text-[var(--muted-foreground)]">
              {isOutOfStock ? "Out of Stock" : product.inventory <= 5 ? `Only ${product.inventory} left` : "In Stock"}
            </span>
          </div>

          {product.description && <p className="text-[var(--muted-foreground)]">{product.description}</p>}

          {!isOutOfStock && (
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-3 border border-[var(--border)] rounded-full px-4 py-2 w-fit">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="size-8 flex items-center justify-center rounded-full hover:bg-[var(--muted)]" disabled={quantity <= 1}>
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                </button>
                <span className="w-8 text-center font-semibold">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.inventory, quantity + 1))} className="size-8 flex items-center justify-center rounded-full hover:bg-[var(--muted)]" disabled={quantity >= product.inventory}>
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </button>
              </div>

              <button onClick={handleAddToCart} className="flex-1 sm:flex-none px-8 py-3 bg-[var(--primary)] text-white font-semibold rounded-full hover:opacity-90 flex items-center justify-center gap-2">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" /></svg>
                Add to Cart
              </button>
            </div>
          )}
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {relatedProducts.slice(0, 4).map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                slug={p.slug}
                name={p.name}
                price={p.price}
                compareAt={p.compareAt}
                images={p.images}
                currency={currency}
                inventory={p.inventory}
                isFeatured={p.isFeatured}
                categoryName={p.category?.name}
                storeSlug={storeSlug}
                locale={locale}
                isFavorite={isFavorite(p.id)}
                onToggleFavorite={toggleFavorite}
                onAddToCart={(id) => {
                  addToCart({ id, name: p.name, price: p.price, image: p.images[0] || "", currency });
                }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

#### خطوة 4: إنشاء Product API Route
أنشئ الملف:
`D:\Projects\matgary\src\app\api\store\[storeSlug]\product\[productSlug]\route.ts`

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeSlug: string; productSlug: string }> }
) {
  try {
    const { storeSlug, productSlug } = await params;

    const store = await db.store.findUnique({
      where: { slug: storeSlug },
      select: { id: true, currency: true, isActive: true },
    });

    if (!store || !store.isActive) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const product = await db.product.findFirst({
      where: { slug: productSlug, storeId: store.id, isArchived: false },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Get related products from same category
    const relatedProducts = product.categoryId
      ? await db.product.findMany({
          where: {
            storeId: store.id,
            categoryId: product.categoryId,
            id: { not: product.id },
            isArchived: false,
          },
          include: { category: { select: { name: true } } },
          take: 4,
        })
      : [];

    return NextResponse.json({
      product,
      relatedProducts,
      currency: store.currency,
    });
  } catch (error) {
    console.error("[PRODUCT_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

## المميزات الجديدة ✨

### 1. تصميم جديد للمتجر
- Header مع قائمة تنقل ، بحث، مفضلات، سلة
- Hero Banner بصورة من قاعدة البيانات
- Category Cards بتصميم حديث
- Product Cards مع زر المفضلة ونجوم التقييم
- Mobile Bottom Navigation
- Footer شامل

### 2. سلة التسوق
- Cart Sidebar منزلق من اليمين
- إضافة وحذف وتعديل الكمية
- حفظ السلة في localStorage لكل متجر

### 3. المفضلات
- إضافة وإزالة من المفضلات بنقرة واحدة
- حفظ المفضلات في localStorage لكل متجر

### 4. صفحة المنتج
- معرض صور مع thumbnails
- اختيار الكمية
- إضافة للسلة والمفضلات
- منتجات مشابهة

### 5. مستخدمي المتجر
- StoreCustomer model جديد
- كل متجر له مستخدمين خاصين
- عناوين توصيل متعددة

## الملفات المُنشأة/المُحدثة

### Components الجديدة:
- `src/components/storefront/header.tsx`
- `src/components/storefront/footer.tsx`
- `src/components/storefront/mobile-bottom-nav.tsx`
- `src/components/storefront/hero-banner.tsx`
- `src/components/storefront/category-card.tsx`
- `src/components/storefront/cart-sidebar.tsx`

### Stores المُحدثة:
- `src/stores/use-cart-store.ts` - دعم متاجر متعددة
- `src/stores/use-favorites-store.ts` - جديد

### API Routes:
- `src/app/api/store/[storeSlug]/route.ts` - جديد

## اختبار التحديثات 🧪

1. شغل Prisma:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

2. شغل التطبيق:
   ```bash
   npm run dev
   ```

3. افتح صفحة المتجر: `http://localhost:3000/en/store/[your-store-slug]`

4. اختبر:
   - Hero Banner
   - Categories
   - إضافة للسلة
   - إضافة للمفضلات
   - صفحة المنتج
   - Mobile view

## ملاحظات مهمة 📌

1. تأكد من وجود `heroImageUrl` في بيانات المتجر (Settings page)
2. PWA جاهز ومُعد للعمل (manifest.ts موجود)
3. جميع الألوان تعتمد على ThemeSettings الخاص بكل متجر
