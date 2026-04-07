"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";

interface OrderListItem {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  items: Array<{
    id: string;
    quantity: number;
    product: {
      id: string;
      name: string;
      images: string[];
    };
  }>;
}

export default function OrdersPage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = params?.storeSlug as string;
  const locale = (params?.locale as string) || "en";
  const basePath = `/${locale}/store/${storeSlug}`;

  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [currency, setCurrency] = useState("EGP");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;

    const loadOrders = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/store/${storeSlug}/orders`, { credentials: "include" });
        if (res.status === 401) {
          router.push(`${basePath}/auth/login`);
          return;
        }

        if (!res.ok) {
          throw new Error("Failed to load orders");
        }

        const data = await res.json();
        if (!canceled) {
          setOrders(Array.isArray(data.orders) ? data.orders : []);
          setCurrency(data.currency || "EGP");
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

    loadOrders();

    return () => {
      canceled = true;
    };
  }, [storeSlug, router, basePath]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[var(--primary)]">My Orders</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Track and review your purchases.</p>
        </div>
        <Link href={`${basePath}/shop`} className="text-sm font-semibold text-[var(--primary)]">
          Continue shopping
        </Link>
      </div>

      {loading && <p className="text-sm text-[var(--muted-foreground)]">Loading orders...</p>}
      {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      {!loading && !error && orders.length === 0 && (
        <div className="rounded-2xl bg-[var(--muted)]/35 p-8 text-center text-sm text-[var(--muted-foreground)]">
          You have no orders yet.
        </div>
      )}

      <div className="space-y-3">
        {orders.map((order) => (
          <article key={order.id} className="rounded-2xl bg-[var(--background)] p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Order #{order.orderNumber}</p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="text-right">
                <p className="text-lg font-bold text-[var(--primary)]">{formatPrice(order.totalAmount, order.currency || currency)}</p>
                <p className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">{order.status}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-[var(--muted-foreground)]">{order.items.length} items</p>
              <div className="flex gap-2">
                <Link
                  href={`${basePath}/orders/${order.id}`}
                  className="rounded-full bg-[var(--muted)] px-4 py-2 text-xs font-semibold"
                >
                  Details
                </Link>
                <Link
                  href={`${basePath}/orders/${order.id}/tracking`}
                  className="rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white"
                >
                  Tracking
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
