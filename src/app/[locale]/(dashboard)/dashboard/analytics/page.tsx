"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";

interface AnalyticsData {
  currency: string;
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    totalCustomers: number;
  };
  statusCounts: Record<string, number>;
  topProducts: Array<{
    productId: string;
    name: string;
    image: string | null;
    quantity: number;
    revenue: number;
  }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/dashboard/analytics", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Failed to load analytics");
        }

        const payload = (await res.json()) as AnalyticsData;
        if (!canceled) {
          setData(payload);
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

    load();

    return () => {
      canceled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-sm text-[var(--muted-foreground)]">Loading analytics...</p>;
  }

  if (error || !data) {
    return <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error || "Analytics unavailable"}</div>;
  }

  const cards = [
    { label: "Revenue", value: formatPrice(data.summary.totalRevenue, data.currency) },
    { label: "Orders", value: String(data.summary.totalOrders) },
    { label: "Products", value: String(data.summary.totalProducts) },
    { label: "Customers", value: String(data.summary.totalCustomers) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Analytics</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Sales, order velocity, and best performing products.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="rounded-2xl bg-[var(--background)] p-5 shadow-sm">
            <p className="text-sm text-[var(--muted-foreground)]">{card.label}</p>
            <p className="mt-2 text-2xl font-black text-[var(--primary)]">{card.value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl bg-[var(--background)] p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Order status</h2>
          <div className="mt-4 space-y-2">
            {Object.entries(data.statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted-foreground)]">{status}</span>
                <span className="font-semibold text-[var(--primary)]">{count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-[var(--background)] p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Top products</h2>
          <div className="mt-4 space-y-3">
            {data.topProducts.map((product) => (
              <div key={product.productId} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-[var(--foreground)]">{product.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Sold: {product.quantity}</p>
                </div>
                <p className="font-semibold text-[var(--primary)]">{formatPrice(product.revenue, data.currency)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
