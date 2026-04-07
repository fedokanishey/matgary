"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";

interface OrderDetails {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  shippingAddress: string | null;
  trackingNumber: string | null;
  items: Array<{
    id: string;
    quantity: number;
    total: number;
    product: {
      id: string;
      name: string;
    };
  }>;
}

const statusOptions = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];

export default function DashboardOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [status, setStatus] = useState("PENDING");
  const [trackingNumber, setTrackingNumber] = useState("");

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/dashboard/orders/${orderId}`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to load order");
      }

      const data = await res.json();
      setOrder(data.order || null);
      setStatus(data.order?.status || "PENDING");
      setTrackingNumber(data.order?.trackingNumber || "");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const saveStatus = async () => {
    if (!order) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/dashboard/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          status,
          trackingNumber: trackingNumber || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update order");
      }

      await loadOrder();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-[var(--muted-foreground)]">Loading order...</p>;
  }

  if (error || !order) {
    return <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error || "Order not found"}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Order #{order.orderNumber}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{order.customerName} • {order.customerEmail}</p>
        </div>

        <button onClick={() => router.push("/dashboard/orders")} className="rounded-full bg-[var(--muted)] px-4 py-2 text-xs font-semibold">
          Back to orders
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-3">
          {order.items.map((item) => (
            <article key={item.id} className="rounded-2xl bg-[var(--background)] p-4 shadow-sm">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-semibold text-[var(--primary)]">{item.product.name}</p>
                  <p className="text-[var(--muted-foreground)]">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold text-[var(--primary)]">{formatPrice(item.total, order.currency)}</p>
              </div>
            </article>
          ))}
        </section>

        <aside className="space-y-3 rounded-2xl bg-[var(--background)] p-5 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Total</p>
            <p className="text-2xl font-black text-[var(--primary)]">{formatPrice(order.totalAmount, order.currency)}</p>
          </div>

          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Status</label>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 w-full rounded-lg bg-[var(--muted)] px-3 text-sm outline-none">
            {statusOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>

          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Tracking number</label>
          <input
            value={trackingNumber}
            onChange={(event) => setTrackingNumber(event.target.value)}
            placeholder="Optional"
            className="h-10 w-full rounded-lg bg-[var(--muted)] px-3 text-sm outline-none"
          />

          <button onClick={saveStatus} disabled={saving} className="h-10 w-full rounded-lg bg-[var(--primary)] text-sm font-semibold text-white disabled:opacity-50">
            {saving ? "Saving..." : "Save changes"}
          </button>

          {order.shippingAddress && (
            <div className="rounded-xl bg-[var(--muted)]/35 p-3 text-sm text-[var(--muted-foreground)]">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">Shipping</p>
              <p>{order.shippingAddress}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
