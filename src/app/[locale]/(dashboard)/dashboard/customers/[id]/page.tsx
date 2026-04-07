"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";

interface CustomerDetails {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
  addresses: Array<{
    id: string;
    label: string | null;
    addressLine1: string;
    city: string | null;
    country: string | null;
    isDefault: boolean;
  }>;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    createdAt: string;
  }>;
}

export default function DashboardCustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params?.id as string;

  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [currency, setCurrency] = useState("EGP");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;

    const loadCustomer = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/dashboard/customers/${customerId}`, { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Failed to load customer");
        }

        const data = await res.json();
        if (!canceled) {
          setCustomer(data.customer || null);
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

    loadCustomer();

    return () => {
      canceled = true;
    };
  }, [customerId]);

  if (loading) {
    return <p className="text-sm text-[var(--muted-foreground)]">Loading customer...</p>;
  }

  if (error || !customer) {
    return <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error || "Customer not found"}</div>;
  }

  const customerName = [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "Customer";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{customerName}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{customer.email}</p>
        </div>

        <button onClick={() => router.push("/dashboard/customers")} className="rounded-full bg-[var(--muted)] px-4 py-2 text-xs font-semibold">
          Back to customers
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article className="rounded-2xl bg-[var(--background)] p-5 shadow-sm">
          <p className="text-sm text-[var(--muted-foreground)]">Total orders</p>
          <p className="mt-2 text-2xl font-black text-[var(--primary)]">{customer.totalOrders}</p>
        </article>
        <article className="rounded-2xl bg-[var(--background)] p-5 shadow-sm">
          <p className="text-sm text-[var(--muted-foreground)]">Total spent</p>
          <p className="mt-2 text-2xl font-black text-[var(--primary)]">{formatPrice(customer.totalSpent, currency)}</p>
        </article>
        <article className="rounded-2xl bg-[var(--background)] p-5 shadow-sm">
          <p className="text-sm text-[var(--muted-foreground)]">Joined</p>
          <p className="mt-2 text-2xl font-black text-[var(--primary)]">{new Date(customer.createdAt).toLocaleDateString()}</p>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl bg-[var(--background)] p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Addresses</h2>
          <div className="mt-3 space-y-2 text-sm">
            {customer.addresses.length === 0 && <p className="text-[var(--muted-foreground)]">No saved addresses.</p>}
            {customer.addresses.map((address) => (
              <article key={address.id} className="rounded-xl bg-[var(--muted)]/45 p-3">
                <p className="font-semibold text-[var(--primary)]">
                  {address.label || "Address"}
                  {address.isDefault ? " • Default" : ""}
                </p>
                <p className="text-[var(--muted-foreground)]">{[address.addressLine1, address.city, address.country].filter(Boolean).join(", ")}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-[var(--background)] p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Recent orders</h2>
          <div className="mt-3 space-y-2 text-sm">
            {customer.orders.length === 0 && <p className="text-[var(--muted-foreground)]">No orders yet.</p>}
            {customer.orders.map((order) => (
              <article key={order.id} className="rounded-xl bg-[var(--muted)]/45 p-3">
                <p className="font-semibold text-[var(--primary)]">#{order.orderNumber}</p>
                <p className="text-[var(--muted-foreground)]">
                  {order.status} • {formatPrice(order.totalAmount, currency)}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
