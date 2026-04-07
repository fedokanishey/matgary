"use client";

import { FormEvent, useEffect, useState } from "react";

interface Coupon {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderAmount: number | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    minOrderAmount: "",
    usageLimit: "",
  });

  const loadCoupons = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/dashboard/coupons", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to load coupons");
      }
      const data = await res.json();
      setCoupons(Array.isArray(data.coupons) ? data.coupons : []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const createCoupon = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      const res = await fetch("/api/dashboard/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
          usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create coupon");
      }

      setForm({
        code: "",
        discountType: "PERCENTAGE",
        discountValue: "",
        minOrderAmount: "",
        usageLimit: "",
      });

      await loadCoupons();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
    }
  };

  const toggleCoupon = async (coupon: Coupon) => {
    await fetch("/api/dashboard/coupons", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: coupon.id,
        isActive: !coupon.isActive,
      }),
    });

    await loadCoupons();
  };

  const deleteCoupon = async (id: string) => {
    await fetch(`/api/dashboard/coupons?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    await loadCoupons();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Coupons</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Create and manage discount codes.</p>
      </div>

      {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      <form onSubmit={createCoupon} className="grid gap-3 rounded-2xl bg-[var(--background)] p-5 shadow-sm md:grid-cols-5">
        <input
          required
          placeholder="Code"
          value={form.code}
          onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
          className="h-10 rounded-lg bg-[var(--muted)] px-3 text-sm outline-none"
        />

        <select
          value={form.discountType}
          onChange={(event) => setForm((prev) => ({ ...prev, discountType: event.target.value }))}
          className="h-10 rounded-lg bg-[var(--muted)] px-3 text-sm outline-none"
        >
          <option value="PERCENTAGE">Percentage</option>
          <option value="FIXED">Fixed amount</option>
        </select>

        <input
          required
          type="number"
          min="0"
          step="0.01"
          placeholder="Discount"
          value={form.discountValue}
          onChange={(event) => setForm((prev) => ({ ...prev, discountValue: event.target.value }))}
          className="h-10 rounded-lg bg-[var(--muted)] px-3 text-sm outline-none"
        />

        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Min order"
          value={form.minOrderAmount}
          onChange={(event) => setForm((prev) => ({ ...prev, minOrderAmount: event.target.value }))}
          className="h-10 rounded-lg bg-[var(--muted)] px-3 text-sm outline-none"
        />

        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            placeholder="Limit"
            value={form.usageLimit}
            onChange={(event) => setForm((prev) => ({ ...prev, usageLimit: event.target.value }))}
            className="h-10 w-full rounded-lg bg-[var(--muted)] px-3 text-sm outline-none"
          />
          <button className="h-10 rounded-lg bg-[var(--primary)] px-4 text-sm font-semibold text-white">Add</button>
        </div>
      </form>

      <section className="rounded-2xl bg-[var(--background)] p-5 shadow-sm">
        {loading ? (
          <p className="text-sm text-[var(--muted-foreground)]">Loading coupons...</p>
        ) : coupons.length === 0 ? (
          <p className="text-sm text-[var(--muted-foreground)]">No coupons yet.</p>
        ) : (
          <div className="space-y-3">
            {coupons.map((coupon) => (
              <article key={coupon.id} className="rounded-xl bg-[var(--muted)]/45 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[var(--primary)]">{coupon.code}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}%` : coupon.discountValue} off • Used {coupon.usedCount}
                      {coupon.usageLimit ? `/${coupon.usageLimit}` : ""}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleCoupon(coupon)}
                      className="rounded-full bg-[var(--background)] px-3 py-1 text-xs font-semibold"
                    >
                      {coupon.isActive ? "Disable" : "Enable"}
                    </button>
                    <button
                      onClick={() => deleteCoupon(coupon.id)}
                      className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
