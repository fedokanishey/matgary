"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useCartStore } from "@/stores/use-cart-store";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const params = useParams();
  const storeSlug = params?.storeSlug as string;
  const locale = (params?.locale as string) || "en";

  const cartStore = useCartStore(storeSlug);
  const items = cartStore((state) => state.items);
  const fetchCart = cartStore((state) => state.fetchCart);
  const updateQuantity = cartStore((state) => state.updateQuantity);
  const removeItem = cartStore((state) => state.removeItem);
  const clearCart = cartStore((state) => state.clearCart);
  const getTotal = cartStore((state) => state.getTotal);

  const [currency, setCurrency] = useState("EGP");

  useEffect(() => {
    fetchCart();

    const loadCurrency = async () => {
      try {
        const res = await fetch(`/api/store/${storeSlug}`);
        if (res.ok) {
          const data = await res.json();
          if (data.currency) {
            setCurrency(data.currency);
          }
        }
      } catch {
        // Ignore currency fallback.
      }
    };

    loadCurrency();
  }, [storeSlug, fetchCart]);

  const basePath = `/${locale}/store/${storeSlug}`;
  const subtotal = getTotal();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section>
          <h1 className="text-4xl font-black tracking-tight text-[var(--primary)]">Shopping Cart</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            {items.length} {items.length === 1 ? "item" : "items"} in your collection
          </p>

          {items.length === 0 ? (
            <div className="mt-8 rounded-3xl bg-[var(--muted)]/35 p-8 text-center">
              <p className="text-[var(--muted-foreground)]">Your cart is empty.</p>
              <Link
                href={`${basePath}/shop`}
                className="mt-4 inline-flex rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {items.map((item) => (
                <article key={item.id} className="rounded-2xl bg-[var(--background)] p-4 shadow-sm">
                  <div className="flex gap-4">
                    <div className="relative h-28 w-24 overflow-hidden rounded-xl bg-[var(--muted)]">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="96px" />
                      ) : null}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="line-clamp-2 text-lg font-semibold text-[var(--primary)]">{item.name}</h2>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="rounded-full p-2 text-[var(--muted-foreground)] hover:bg-red-50 hover:text-red-500"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div className="flex items-center rounded-full bg-[var(--muted)] p-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="h-8 w-8 rounded-full text-sm"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-8 w-8 rounded-full text-sm"
                          >
                            +
                          </button>
                        </div>

                        <p className="text-lg font-bold text-[var(--primary)]">
                          {formatPrice(item.price * item.quantity, item.currency || currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside>
          <div className="sticky top-24 rounded-3xl bg-[var(--muted)]/45 p-6">
            <h2 className="text-lg font-black uppercase tracking-[0.16em] text-[var(--primary)]">Summary</h2>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center justify-between text-[var(--muted-foreground)]">
                <span>Subtotal</span>
                <span className="font-semibold text-[var(--primary)]">{formatPrice(subtotal, currency)}</span>
              </div>
              <div className="flex items-center justify-between text-[var(--muted-foreground)]">
                <span>Shipping</span>
                <span className="font-semibold text-[var(--primary)]">Calculated at checkout</span>
              </div>
            </div>

            <div className="mt-6 border-t border-[var(--border)] pt-5">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-[var(--primary)]">Total</span>
                <span className="text-3xl font-black text-[var(--primary)]">{formatPrice(subtotal, currency)}</span>
              </div>
            </div>

            <Link
              href={`${basePath}/checkout`}
              className="mt-6 flex h-12 items-center justify-center rounded-xl bg-[var(--primary)] text-sm font-semibold text-white"
            >
              Secure Checkout
            </Link>

            <button
              onClick={() => clearCart()}
              className="mt-3 flex h-11 w-full items-center justify-center rounded-xl border border-[var(--border)] text-sm font-semibold"
            >
              Clear Cart
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
