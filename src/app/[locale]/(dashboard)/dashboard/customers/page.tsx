"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { formatPrice } from "@/lib/utils";

interface DashboardCustomer {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

export default function CustomersPage() {
  const t = useTranslations("dashboard.customers");
  const [customers, setCustomers] = useState<DashboardCustomer[]>([]);
  const [currency, setCurrency] = useState("EGP");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let canceled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/dashboard/customers", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Failed to load customers");
        }

        const data = await res.json();
        if (!canceled) {
          setCustomers(Array.isArray(data.customers) ? data.customers : []);
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

  const filteredCustomers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return customers;

    return customers.filter((customer) => {
      const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(" ").toLowerCase();
      return fullName.includes(normalized) || customer.email.toLowerCase().includes(normalized);
    });
  }, [customers, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or email"
          className="h-10 w-full rounded-lg bg-(--muted) px-3 text-sm outline-none sm:w-72"
        />
      </div>

      {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      <div className="overflow-hidden rounded-2xl border border-(--border) bg-background">
        {loading ? (
          <p className="p-6 text-sm text-(--muted-foreground)">Loading customers...</p>
        ) : filteredCustomers.length === 0 ? (
          <p className="p-6 text-sm text-(--muted-foreground)">{t("empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-(--muted)/50 text-xs uppercase tracking-wider text-(--muted-foreground)">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Orders</th>
                  <th className="px-4 py-3">Spent</th>
                  <th className="px-4 py-3">Last order</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => {
                  const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "Customer";

                  return (
                    <tr key={customer.id} className="border-t border-(--border)">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">{fullName}</p>
                        <p className="text-xs text-(--muted-foreground)">{customer.email}</p>
                      </td>
                      <td className="px-4 py-3 text-(--muted-foreground)">{new Date(customer.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">{customer.totalOrders}</td>
                      <td className="px-4 py-3 font-semibold text-(--primary)">{formatPrice(customer.totalSpent, currency)}</td>
                      <td className="px-4 py-3 text-(--muted-foreground)">
                        {customer.lastOrderAt ? new Date(customer.lastOrderAt).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/customers/${customer.id}`} className="text-xs font-semibold text-(--primary) hover:underline">
                          View details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
