"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { formatPrice } from "@/lib/utils";

interface DashboardOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  items: Array<{ id: string; quantity: number }>;
}

const statusClasses: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-blue-50 text-blue-700",
  PROCESSING: "bg-indigo-50 text-indigo-700",
  SHIPPED: "bg-cyan-50 text-cyan-700",
  DELIVERED: "bg-green-50 text-green-700",
  CANCELLED: "bg-rose-50 text-rose-700",
  REFUNDED: "bg-slate-100 text-slate-700",
};

export default function OrdersPage() {
  const t = useTranslations("dashboard.orders");
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [currency, setCurrency] = useState("EGP");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    let canceled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/dashboard/orders", { cache: "no-store" });
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

    load();

    return () => {
      canceled = true;
    };
  }, []);

  const statusLabels = {
    PENDING: t("status.PENDING"),
    CONFIRMED: t("status.CONFIRMED"),
    PROCESSING: t("status.PROCESSING"),
    SHIPPED: t("status.SHIPPED"),
    DELIVERED: t("status.DELIVERED"),
    CANCELLED: t("status.CANCELLED"),
    REFUNDED: t("status.REFUNDED"),
  };

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !query ||
        order.orderNumber.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.customerEmail.toLowerCase().includes(query);

      const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by order, customer, or email"
            className="h-10 w-full rounded-lg bg-(--muted) px-3 text-sm outline-none sm:w-72"
          />
          <select
            aria-label="Filter by status"
            title="Filter by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-10 rounded-lg bg-(--muted) px-3 text-sm outline-none"
          >
            <option value="ALL">All statuses</option>
            {Object.keys(statusLabels).map((status) => (
              <option key={status} value={status}>
                {statusLabels[status as keyof typeof statusLabels]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      <div className="overflow-hidden rounded-2xl border border-(--border) bg-background">
        {loading ? (
          <p className="p-6 text-sm text-(--muted-foreground)">Loading orders...</p>
        ) : filteredOrders.length === 0 ? (
          <p className="p-6 text-sm text-(--muted-foreground)">{t("empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-(--muted)/50 text-xs uppercase tracking-wider text-(--muted-foreground)">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-t border-(--border)">
                    <td className="px-4 py-3 font-semibold text-foreground">#{order.orderNumber}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{order.customerName || "Customer"}</p>
                      <p className="text-xs text-(--muted-foreground)">{order.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[order.status] || "bg-slate-100 text-slate-700"}`}>
                        {statusLabels[order.status as keyof typeof statusLabels] || order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-(--muted-foreground)">{order.items.length}</td>
                    <td className="px-4 py-3 font-semibold text-(--primary)">{formatPrice(order.totalAmount, currency)}</td>
                    <td className="px-4 py-3 text-(--muted-foreground)">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/orders/${order.id}`} className="text-xs font-semibold text-(--primary) hover:underline">
                        View details
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
