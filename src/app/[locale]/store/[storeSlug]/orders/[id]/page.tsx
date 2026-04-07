"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";

interface OrderDetails {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  discountAmount: number;
  currency: string;
  createdAt: string;
  shippingAddress: string | null;
  trackingNumber: string | null;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    total: number;
    product: {
      id: string;
      name: string;
      images: string[];
      slug: string;
    };
  }>;
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = params?.storeSlug as string;
  const locale = (params?.locale as string) || "en";
  const id = params?.id as string;
  const basePath = `/${locale}/store/${storeSlug}`;

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;

    const loadOrder = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/store/${storeSlug}/orders/${id}`, { credentials: "include" });
        if (res.status === 401) {
          router.push(`${basePath}/auth/login`);
          return;
        }

        if (!res.ok) {
          throw new Error("Failed to load order");
        }

        const data = await res.json();
        if (!canceled) {
          setOrder(data.order || null);
        }
      } catch (requestError) {
        if (!canceled) {
          setError(requestError instanceof Error ? requestError.message : "Unexpected error");
        }
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    };

    loadOrder();

    return () => {
      canceled = true;
    };
  }, [storeSlug, id, router, basePath]);

  if (loading) {
    return <div className="px-4 py-8 text-sm text-[var(--muted-foreground)]">Loading order...</div>;
  }

  if (error || !order) {
    return <div className="mx-auto max-w-xl rounded-xl bg-red-50 p-4 text-sm text-red-600">{error || "Order not found"}</div>;
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[var(--primary)]">Order #{order.orderNumber}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
        </div>

        <Link href={`${basePath}/orders/${order.id}/tracking`} className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white">
          Track
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-3">
          {order.items.map((item) => (
            <article key={item.id} className="rounded-2xl bg-[var(--background)] p-4 shadow-sm">
              <div className="flex gap-4">
                <div className="relative h-24 w-20 overflow-hidden rounded-xl bg-[var(--muted)]">
                  {item.product.images[0] && (
                    <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="80px" />
                  )}
                </div>

                <div className="flex flex-1 items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--primary)]">{item.product.name}</p>
                    <p className="text-sm text-[var(--muted-foreground)]">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-[var(--primary)]">{formatPrice(item.total, order.currency)}</p>
                </div>
              </div>
            </article>
          ))}
        </section>

        <aside className="rounded-3xl bg-[var(--muted)]/35 p-5">
          <h2 className="text-lg font-bold text-[var(--primary)]">Order summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-[var(--muted-foreground)]">
              <span>Status</span>
              <span>{order.status}</span>
            </div>
            <div className="flex justify-between text-[var(--muted-foreground)]">
              <span>Discount</span>
              <span>{formatPrice(order.discountAmount || 0, order.currency)}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="font-semibold text-[var(--primary)]">Total</span>
              <span className="font-bold text-[var(--primary)]">{formatPrice(order.totalAmount, order.currency)}</span>
            </div>
          </div>

          {order.shippingAddress && (
            <div className="mt-5 rounded-xl bg-[var(--background)] p-3 text-sm text-[var(--muted-foreground)]">
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--primary)]">Shipping address</p>
              <p>{order.shippingAddress}</p>
            </div>
          )}

          {order.trackingNumber && (
            <div className="mt-3 rounded-xl bg-[var(--background)] p-3 text-sm text-[var(--muted-foreground)]">
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--primary)]">Tracking number</p>
              <p>{order.trackingNumber}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
