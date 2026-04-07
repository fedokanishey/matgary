"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { formatPrice } from "@/lib/utils";

interface DashboardAnalytics {
  currency: string;
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    totalCustomers: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    customerName: string;
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const [data, setData] = useState<DashboardAnalytics | null>(null);
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
          throw new Error("Failed to load dashboard analytics");
        }

        const payload = (await res.json()) as DashboardAnalytics;
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

  const currency = data?.currency || "EGP";
  const summary = data?.summary || {
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
  };

  const stats = [
    {
      key: "totalRevenue",
      value: formatPrice(summary.totalRevenue, currency),
      icon: (
        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      key: "totalOrders",
      value: summary.totalOrders.toString(),
      icon: (
        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      ),
    },
    {
      key: "totalProducts",
      value: summary.totalProducts.toString(),
      icon: (
        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
    },
    {
      key: "totalCustomers",
      value: summary.totalCustomers.toString(),
      icon: (
        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-(--muted-foreground)">{t("welcome")}</p>
      </div>

      {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.key} className="rounded-2xl border border-(--border) bg-background p-6 transition-all duration-200 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-(--primary)/10 p-3 text-(--primary)">{stat.icon}</div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-foreground">{loading ? "..." : stat.value}</p>
              <p className="text-sm text-(--muted-foreground)">{t(`stats.${stat.key}`)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-(--border) bg-background p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{t("orders.title")}</h2>
          <Link href="/dashboard/orders" className="text-xs font-semibold text-(--primary) hover:underline">
            View all
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-(--muted-foreground)">Loading recent orders...</p>
        ) : !data || data.recentOrders.length === 0 ? (
          <p className="text-sm text-(--muted-foreground)">{t("orders.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-(--muted)/50 text-xs uppercase tracking-wider text-(--muted-foreground)">
                <tr>
                  <th className="px-3 py-2">Order</th>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Total</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.slice(0, 6).map((order) => (
                  <tr key={order.id} className="border-t border-(--border)">
                    <td className="px-3 py-2 font-semibold text-foreground">#{order.orderNumber}</td>
                    <td className="px-3 py-2 text-(--muted-foreground)">{order.customerName}</td>
                    <td className="px-3 py-2 text-(--muted-foreground)">{order.status}</td>
                    <td className="px-3 py-2 font-semibold text-(--primary)">{formatPrice(order.totalAmount, currency)}</td>
                    <td className="px-3 py-2">
                      <Link href={`/dashboard/orders/${order.id}`} className="text-xs font-semibold text-(--primary) hover:underline">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
