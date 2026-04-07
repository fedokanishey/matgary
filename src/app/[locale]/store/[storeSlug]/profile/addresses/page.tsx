"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

interface Address {
  id: string;
  label: string | null;
  fullName: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  state: string | null;
  addressLine1: string;
  addressLine2: string | null;
  postalCode: string | null;
  isDefault: boolean;
}

export default function ProfileAddressesPage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = params?.storeSlug as string;
  const locale = (params?.locale as string) || "en";
  const basePath = `/${locale}/store/${storeSlug}`;

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    label: "",
    fullName: "",
    phone: "",
    country: "",
    city: "",
    state: "",
    addressLine1: "",
    addressLine2: "",
    postalCode: "",
    isDefault: false,
  });

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/store/${storeSlug}/customer/addresses`, {
        credentials: "include",
      });

      if (res.status === 401) {
        router.push(`${basePath}/auth/login`);
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to load addresses");
      }

      const data = await res.json();
      setAddresses(Array.isArray(data.addresses) ? data.addresses : []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }, [storeSlug, router, basePath]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const submitAddress = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    try {
      const res = await fetch(`/api/store/${storeSlug}/customer/addresses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save address");
      }

      setForm({
        label: "",
        fullName: "",
        phone: "",
        country: "",
        city: "",
        state: "",
        addressLine1: "",
        addressLine2: "",
        postalCode: "",
        isDefault: false,
      });

      await loadAddresses();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
    }
  };

  const markDefault = async (address: Address) => {
    try {
      await fetch(`/api/store/${storeSlug}/customer/addresses`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...address, isDefault: true }),
      });

      await loadAddresses();
    } catch {
      setError("Failed to update default address.");
    }
  };

  const removeAddress = async (id: string) => {
    try {
      await fetch(`/api/store/${storeSlug}/customer/addresses?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      await loadAddresses();
    } catch {
      setError("Failed to delete address.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[var(--primary)]">Saved Addresses</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Manage your delivery locations.</p>
        </div>
        <Link href={`${basePath}/account`} className="text-sm font-semibold text-[var(--primary)]">
          Back to account
        </Link>
      </div>

      {error && <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl bg-[var(--background)] p-5 shadow-sm">
          <h2 className="text-lg font-bold text-[var(--primary)]">Add new address</h2>
          <form className="mt-4 grid gap-3" onSubmit={submitAddress}>
            <input
              required
              value={form.label}
              onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))}
              placeholder="Label (Home, Office...)"
              className="h-10 rounded-lg bg-[var(--muted)] px-3 text-sm outline-none"
            />
            <input
              required
              value={form.fullName}
              onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
              placeholder="Full name"
              className="h-10 rounded-lg bg-[var(--muted)] px-3 text-sm outline-none"
            />
            <input
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              placeholder="Phone"
              className="h-10 rounded-lg bg-[var(--muted)] px-3 text-sm outline-none"
            />
            <input
              required
              value={form.addressLine1}
              onChange={(event) => setForm((prev) => ({ ...prev, addressLine1: event.target.value }))}
              placeholder="Address line 1"
              className="h-10 rounded-lg bg-[var(--muted)] px-3 text-sm outline-none"
            />
            <input
              value={form.addressLine2}
              onChange={(event) => setForm((prev) => ({ ...prev, addressLine2: event.target.value }))}
              placeholder="Address line 2"
              className="h-10 rounded-lg bg-[var(--muted)] px-3 text-sm outline-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={form.city}
                onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                placeholder="City"
                className="h-10 rounded-lg bg-[var(--muted)] px-3 text-sm outline-none"
              />
              <input
                value={form.state}
                onChange={(event) => setForm((prev) => ({ ...prev, state: event.target.value }))}
                placeholder="State"
                className="h-10 rounded-lg bg-[var(--muted)] px-3 text-sm outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={form.country}
                onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))}
                placeholder="Country"
                className="h-10 rounded-lg bg-[var(--muted)] px-3 text-sm outline-none"
              />
              <input
                value={form.postalCode}
                onChange={(event) => setForm((prev) => ({ ...prev, postalCode: event.target.value }))}
                placeholder="Postal code"
                className="h-10 rounded-lg bg-[var(--muted)] px-3 text-sm outline-none"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(event) => setForm((prev) => ({ ...prev, isDefault: event.target.checked }))}
              />
              Set as default
            </label>

            <button className="mt-1 h-11 rounded-xl bg-[var(--primary)] text-sm font-semibold text-white">
              Save Address
            </button>
          </form>
        </section>

        <section className="rounded-3xl bg-[var(--muted)]/35 p-5">
          <h2 className="text-lg font-bold text-[var(--primary)]">Your addresses</h2>

          {loading && <p className="mt-4 text-sm text-[var(--muted-foreground)]">Loading...</p>}

          {!loading && addresses.length === 0 && (
            <p className="mt-4 text-sm text-[var(--muted-foreground)]">No addresses saved yet.</p>
          )}

          <div className="mt-4 space-y-3">
            {addresses.map((address) => (
              <article key={address.id} className="rounded-2xl bg-[var(--background)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--primary)]">
                      {address.label || "Address"}
                      {address.isDefault && (
                        <span className="ml-2 rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--primary)]">
                          Default
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      {[address.fullName, address.addressLine1, address.city, address.country]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!address.isDefault && (
                      <button
                        onClick={() => markDefault(address)}
                        className="rounded-full bg-[var(--muted)] px-3 py-1 text-xs font-semibold"
                      >
                        Set default
                      </button>
                    )}
                    <button
                      onClick={() => removeAddress(address.id)}
                      className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
