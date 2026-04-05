# الصفحات والملفات الإضافية المطلوب إنشاؤها

## المجلدات المطلوب إنشاؤها أولاً

```bash
# Windows PowerShell
mkdir "D:\Projects\matgary\src\app\[locale]\store\[storeSlug]\auth\login"
mkdir "D:\Projects\matgary\src\app\[locale]\store\[storeSlug]\auth\register"
mkdir "D:\Projects\matgary\src\app\[locale]\store\[storeSlug]\account"
mkdir "D:\Projects\matgary\src\app\[locale]\store\[storeSlug]\favorites"
mkdir "D:\Projects\matgary\src\app\[locale]\store\[storeSlug]\search"
mkdir "D:\Projects\matgary\src\app\[locale]\store\[storeSlug]\checkout"
mkdir "D:\Projects\matgary\src\app\[locale]\store\[storeSlug]\product\[productSlug]"
mkdir "D:\Projects\matgary\src\app\api\store\[storeSlug]\product\[productSlug]"
```

---

## 1. صفحة تسجيل الدخول
`src/app/[locale]/store/[storeSlug]/auth/login/page.tsx`

```tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCustomerAuthStore } from "@/stores/use-customer-auth-store";

export default function LoginPage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = params?.storeSlug as string;
  const locale = (params?.locale as string) || "en";

  const authStore = useCustomerAuthStore(storeSlug);
  const setCustomer = authStore((s) => s.setCustomer);
  const setToken = authStore((s) => s.setToken);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const basePath = `/${locale}/store/${storeSlug}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/store/${storeSlug}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      setCustomer(data.customer);
      setToken(data.token);
      router.push(basePath);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Welcome Back</h1>
            <p className="text-[var(--muted-foreground)]">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 bg-[var(--primary)] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              Don&apos;t have an account?{" "}
              <Link href={`${basePath}/auth/register`} className="text-[var(--primary)] font-medium hover:underline">
                Create one
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link href={basePath} className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              ← Back to store
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 2. صفحة التسجيل
`src/app/[locale]/store/[storeSlug]/auth/register/page.tsx`

```tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCustomerAuthStore } from "@/stores/use-customer-auth-store";

export default function RegisterPage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = params?.storeSlug as string;
  const locale = (params?.locale as string) || "en";

  const authStore = useCustomerAuthStore(storeSlug);
  const setCustomer = authStore((s) => s.setCustomer);
  const setToken = authStore((s) => s.setToken);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const basePath = `/${locale}/store/${storeSlug}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/store/${storeSlug}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      setCustomer(data.customer);
      setToken(data.token);
      router.push(basePath);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Create Account</h1>
            <p className="text-[var(--muted-foreground)]">Join us and start shopping</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Confirm Password *</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 bg-[var(--primary)] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              Already have an account?{" "}
              <Link href={`${basePath}/auth/login`} className="text-[var(--primary)] font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 3. صفحة الحساب
`src/app/[locale]/store/[storeSlug]/account/page.tsx`

```tsx
"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCustomerAuthStore } from "@/stores/use-customer-auth-store";

export default function AccountPage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = params?.storeSlug as string;
  const locale = (params?.locale as string) || "en";

  const authStore = useCustomerAuthStore(storeSlug);
  const customer = authStore((s) => s.customer);
  const logout = authStore((s) => s.logout);

  const basePath = `/${locale}/store/${storeSlug}`;

  useEffect(() => {
    if (!customer) {
      router.push(`${basePath}/auth/login`);
    }
  }, [customer, router, basePath]);

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push(basePath);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">My Account</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="md:col-span-1">
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-2xl p-6">
            <div className="text-center">
              <div className="size-20 mx-auto mb-4 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-2xl font-bold">
                {customer.firstName?.[0] || customer.email[0].toUpperCase()}
              </div>
              <h2 className="font-semibold text-lg">
                {customer.firstName} {customer.lastName}
              </h2>
              <p className="text-sm text-[var(--muted-foreground)]">{customer.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full mt-6 py-2 px-4 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="md:col-span-2 space-y-4">
          <Link href={`${basePath}/account/orders`} className="block p-6 bg-[var(--background)] border border-[var(--border)] rounded-2xl hover:border-[var(--primary)] transition-colors">
            <h3 className="font-semibold mb-1">My Orders</h3>
            <p className="text-sm text-[var(--muted-foreground)]">View your order history and track shipments</p>
          </Link>

          <Link href={`${basePath}/favorites`} className="block p-6 bg-[var(--background)] border border-[var(--border)] rounded-2xl hover:border-[var(--primary)] transition-colors">
            <h3 className="font-semibold mb-1">Wishlist</h3>
            <p className="text-sm text-[var(--muted-foreground)]">View your saved items</p>
          </Link>

          <Link href={`${basePath}/account/addresses`} className="block p-6 bg-[var(--background)] border border-[var(--border)] rounded-2xl hover:border-[var(--primary)] transition-colors">
            <h3 className="font-semibold mb-1">Addresses</h3>
            <p className="text-sm text-[var(--muted-foreground)]">Manage your shipping addresses</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
```

---

## 4. صفحة المفضلات
`src/app/[locale]/store/[storeSlug]/favorites/page.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
  category?: { name: string } | null;
}

export default function FavoritesPage() {
  const params = useParams();
  const storeSlug = params?.storeSlug as string;
  const locale = (params?.locale as string) || "en";

  const favoritesStore = useFavoritesStore(storeSlug);
  const cartStore = useCartStore(storeSlug);
  
  const favorites = favoritesStore((s) => s.favorites);
  const isFavorite = favoritesStore((s) => s.isFavorite);
  const toggleFavorite = favoritesStore((s) => s.toggleFavorite);
  const addToCart = cartStore((s) => s.addItem);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState("EGP");

  const basePath = `/${locale}/store/${storeSlug}`;

  useEffect(() => {
    async function fetchProducts() {
      if (favorites.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/store/${storeSlug}`);
        if (!res.ok) return;
        const data = await res.json();
        setCurrency(data.currency);
        const favoriteProducts = data.products.filter((p: Product) => favorites.includes(p.id));
        setProducts(favoriteProducts);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [storeSlug, favorites]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">My Wishlist</h1>

      {products.length === 0 ? (
        <div className="text-center py-20">
          <svg className="size-20 mx-auto mb-4 text-[var(--muted-foreground)] opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          <p className="text-[var(--muted-foreground)] mb-4">Your wishlist is empty</p>
          <Link href={basePath} className="px-6 py-2 bg-[var(--primary)] text-white rounded-full font-medium">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
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
              categoryName={product.category?.name}
              storeSlug={storeSlug}
              locale={locale}
              isFavorite={isFavorite(product.id)}
              onToggleFavorite={toggleFavorite}
              onAddToCart={(id) => {
                addToCart({
                  id,
                  name: product.name,
                  price: product.price,
                  image: product.images[0] || "",
                  currency,
                });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 5. صفحة البحث
`src/app/[locale]/store/[storeSlug]/search/page.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
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
  category?: { name: string } | null;
}

export default function SearchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const storeSlug = params?.storeSlug as string;
  const locale = (params?.locale as string) || "en";
  const query = searchParams?.get("q") || "";

  const favoritesStore = useFavoritesStore(storeSlug);
  const cartStore = useCartStore(storeSlug);
  
  const isFavorite = favoritesStore((s) => s.isFavorite);
  const toggleFavorite = favoritesStore((s) => s.toggleFavorite);
  const addToCart = cartStore((s) => s.addItem);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState("EGP");
  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch(`/api/store/${storeSlug}`);
        if (!res.ok) return;
        const data = await res.json();
        setCurrency(data.currency);
        
        if (query) {
          const filtered = data.products.filter((p: Product) =>
            p.name.toLowerCase().includes(query.toLowerCase())
          );
          setProducts(filtered);
        } else {
          setProducts(data.products);
        }
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [storeSlug, query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `/${locale}/store/${storeSlug}/search?q=${encodeURIComponent(searchInput)}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
        <div className="relative">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search products..."
            className="w-full h-14 pl-12 pr-4 rounded-full border border-[var(--border)] bg-[var(--background)] text-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 size-6 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
      </form>

      {/* Results */}
      {query && (
        <p className="text-[var(--muted-foreground)] mb-6">
          {products.length} result{products.length !== 1 ? "s" : ""} for "{query}"
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[var(--muted-foreground)]">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
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
              categoryName={product.category?.name}
              storeSlug={storeSlug}
              locale={locale}
              isFavorite={isFavorite(product.id)}
              onToggleFavorite={toggleFavorite}
              onAddToCart={(id) => {
                addToCart({
                  id,
                  name: product.name,
                  price: product.price,
                  image: product.images[0] || "",
                  currency,
                });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 6. Product API Route
`src/app/api/store/[storeSlug]/product/[productSlug]/route.ts`

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

---

## 7. تثبيت الحزم المطلوبة

```bash
npm install bcryptjs jsonwebtoken
npm install -D @types/bcryptjs @types/jsonwebtoken
```

---

## 8. إضافة متغير JWT_SECRET في .env

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

---

## ملاحظات

1. **Dark Mode**: الدارك مود يعتمد على `darkMode` في `StoreConfiguration` - يحتاج تعديل في ThemeProvider
2. **اللغات**: i18n موجود بالفعل - الـ locale في الـ URL
3. **PWA**: manifest.ts موجود ومُعد

