"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCartStore } from "@/stores/use-cart-store";
import { useCustomerAuthStore } from "@/stores/use-customer-auth-store";
import { formatPrice } from "@/lib/utils";

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

interface CouponResponse {
  valid: boolean;
  discount?: {
    discountAmount: number;
    finalAmount: number;
    reason?: string;
  };
  error?: string;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();

  const storeSlug = params?.storeSlug as string;
  const locale = (params?.locale as string) || "en";

  const cartStore = useCartStore(storeSlug);
  const authStore = useCustomerAuthStore(storeSlug);
  const customer = authStore((state) => state.customer);

  const items = cartStore((state) => state.items);
  const fetchCart = cartStore((state) => state.fetchCart);
  const clearCart = cartStore((state) => state.clearCart);
  const getTotal = cartStore((state) => state.getTotal);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [currency, setCurrency] = useState("EGP");
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponFeedback, setCouponFeedback] = useState<string | null>(null);

  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    phone: "",
    country: "",
    city: "",
    state: "",
    addressLine1: "",
    addressLine2: "",
    postalCode: "",
  });

  const basePath = `/${locale}/store/${storeSlug}`;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        await fetchCart();

        const [storeRes, addressesRes] = await Promise.all([
          fetch(`/api/store/${storeSlug}`, { cache: "no-store" }),
          fetch(`/api/store/${storeSlug}/customer/addresses`, { credentials: "include" }),
        ]);

        if (storeRes.ok) {
          const storeData = await storeRes.json();
          if (!cancelled) {
            setCurrency(storeData.currency || "EGP");
          }
        }

        if (addressesRes.status === 401) {
          router.push(`${basePath}/auth/login`);
          return;
        }

        if (addressesRes.ok) {
          const data = await addressesRes.json();
          if (!cancelled) {
            const list = Array.isArray(data.addresses) ? (data.addresses as Address[]) : [];
            setAddresses(list);

            const defaultAddress = list.find((item) => item.isDefault) || list[0];
            if (defaultAddress) {
              setShippingAddress({
                fullName: defaultAddress.fullName || "",
                phone: defaultAddress.phone || "",
                country: defaultAddress.country || "",
                city: defaultAddress.city || "",
                state: defaultAddress.state || "",
                addressLine1: defaultAddress.addressLine1 || "",
                addressLine2: defaultAddress.addressLine2 || "",
                postalCode: defaultAddress.postalCode || "",
              });
            }
          }
        }
      } catch {
        if (!cancelled) {
          setError("Failed to initialize checkout.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [storeSlug, fetchCart, router, basePath]);

  const subtotal = getTotal();
  const total = useMemo(() => Math.max(0, subtotal - discountAmount), [subtotal, discountAmount]);

  const applyCoupon = async () => {
    setCouponFeedback(null);

    const normalizedCode = couponCode.trim().toUpperCase();

    if (!normalizedCode) {
      setAppliedCouponCode(null);
      setDiscountAmount(0);
      setCouponFeedback("Enter a coupon code first.");
      return;
    }

    try {
      const res = await fetch(`/api/store/${storeSlug}/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalizedCode, subtotal }),
      });

      const data = (await res.json()) as CouponResponse;
      if (!res.ok || !data.valid || !data.discount) {
        setAppliedCouponCode(null);
        setDiscountAmount(0);
        setCouponFeedback(data.error || "Coupon is not valid.");
        return;
      }

      setAppliedCouponCode(normalizedCode);
      setDiscountAmount(data.discount.discountAmount);
      setCouponFeedback(`Coupon applied: -${formatPrice(data.discount.discountAmount, currency)}`);
    } catch {
      setAppliedCouponCode(null);
      setDiscountAmount(0);
      setCouponFeedback("Failed to validate coupon.");
    }
  };

  const placeOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError("Cart is empty.");
      return;
    }

    if (!customer) {
      router.push(`${basePath}/auth/login`);
      return;
    }

    setPlacingOrder(true);

    try {
      const res = await fetch(`/api/store/${storeSlug}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          customerName: shippingAddress.fullName,
          customerPhone: shippingAddress.phone,
          shippingAddress,
          couponCode: appliedCouponCode,
          items: items.map((item) => ({ productId: item.id, quantity: item.quantity })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to place order");
      }

      await clearCart();
      router.push(
        `${basePath}/order/success?orderId=${encodeURIComponent(data.order.id)}&orderNumber=${encodeURIComponent(data.order.orderNumber)}`
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <form id="checkout-form" onSubmit={placeOrder} className="space-y-6">
          <div className="rounded-3xl bg-[var(--muted)]/40 p-6">
            <h1 className="text-3xl font-black text-[var(--primary)]">Secure Checkout</h1>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">Complete your shipping and payment details.</p>
          </div>

          {addresses.length > 0 && (
            <div className="rounded-2xl bg-[var(--background)] p-5 shadow-sm">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
                Saved addresses
              </label>
              <select
                aria-label="Saved addresses"
                title="Saved addresses"
                className="h-11 w-full rounded-lg bg-[var(--muted)] px-3 text-sm outline-none"
                onChange={(event) => {
                  const selected = addresses.find((item) => item.id === event.target.value);
                  if (!selected) return;
                  setShippingAddress({
                    fullName: selected.fullName || "",
                    phone: selected.phone || "",
                    country: selected.country || "",
                    city: selected.city || "",
                    state: selected.state || "",
                    addressLine1: selected.addressLine1 || "",
                    addressLine2: selected.addressLine2 || "",
                    postalCode: selected.postalCode || "",
                  });
                }}
              >
                <option value="">Choose an address</option>
                {addresses.map((address) => (
                  <option key={address.id} value={address.id}>
                    {address.label || address.addressLine1}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-4 rounded-2xl bg-[var(--background)] p-5 shadow-sm md:grid-cols-2">
            <input
              required
              value={shippingAddress.fullName}
              onChange={(event) => setShippingAddress((prev) => ({ ...prev, fullName: event.target.value }))}
              placeholder="Full name"
              className="h-11 rounded-lg bg-[var(--muted)] px-3 text-sm outline-none"
            />
            <input
              required
              value={shippingAddress.phone}
              onChange={(event) => setShippingAddress((prev) => ({ ...prev, phone: event.target.value }))}
              placeholder="Phone"
              className="h-11 rounded-lg bg-[var(--muted)] px-3 text-sm outline-none"
            />
            <input
              required
              value={shippingAddress.addressLine1}
              onChange={(event) => setShippingAddress((prev) => ({ ...prev, addressLine1: event.target.value }))}
              placeholder="Address line 1"
              className="h-11 rounded-lg bg-[var(--muted)] px-3 text-sm outline-none md:col-span-2"
            />
            <input
              value={shippingAddress.addressLine2}
              onChange={(event) => setShippingAddress((prev) => ({ ...prev, addressLine2: event.target.value }))}
              placeholder="Address line 2"
              className="h-11 rounded-lg bg-[var(--muted)] px-3 text-sm outline-none md:col-span-2"
            />
            <input
              required
              value={shippingAddress.city}
              onChange={(event) => setShippingAddress((prev) => ({ ...prev, city: event.target.value }))}
              placeholder="City"
              className="h-11 rounded-lg bg-[var(--muted)] px-3 text-sm outline-none"
            />
            <input
              value={shippingAddress.state}
              onChange={(event) => setShippingAddress((prev) => ({ ...prev, state: event.target.value }))}
              placeholder="State"
              className="h-11 rounded-lg bg-[var(--muted)] px-3 text-sm outline-none"
            />
            <input
              value={shippingAddress.country}
              onChange={(event) => setShippingAddress((prev) => ({ ...prev, country: event.target.value }))}
              placeholder="Country"
              className="h-11 rounded-lg bg-[var(--muted)] px-3 text-sm outline-none"
            />
            <input
              value={shippingAddress.postalCode}
              onChange={(event) => setShippingAddress((prev) => ({ ...prev, postalCode: event.target.value }))}
              placeholder="Postal code"
              className="h-11 rounded-lg bg-[var(--muted)] px-3 text-sm outline-none"
            />
          </div>

          {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>}
        </form>

        <aside>
          <div className="sticky top-24 rounded-3xl bg-[var(--muted)]/45 p-6">
            <h2 className="text-lg font-black uppercase tracking-[0.16em] text-[var(--primary)]">Order Summary</h2>

            <div className="mt-5 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span className="max-w-[70%] truncate text-[var(--muted-foreground)]">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-semibold text-[var(--primary)]">
                    {formatPrice(item.price * item.quantity, item.currency || currency)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex gap-2">
              <input
                value={couponCode}
                onChange={(event) => {
                  const nextCode = event.target.value;
                  setCouponCode(nextCode);

                  // Editing an applied code invalidates the current discount until re-validated.
                  if (appliedCouponCode && nextCode.trim().toUpperCase() !== appliedCouponCode) {
                    setAppliedCouponCode(null);
                    setDiscountAmount(0);
                  }
                }}
                placeholder="Promo code"
                className="h-10 w-full rounded-lg bg-[var(--background)] px-3 text-sm outline-none"
              />
              <button
                type="button"
                onClick={applyCoupon}
                className="h-10 rounded-lg bg-[var(--primary)] px-4 text-xs font-semibold text-white"
              >
                Apply
              </button>
            </div>

            {couponFeedback && (
              <p className="mt-2 text-xs text-[var(--muted-foreground)]">{couponFeedback}</p>
            )}

            <div className="mt-6 space-y-2 border-t border-[var(--border)] pt-5 text-sm">
              <div className="flex items-center justify-between text-[var(--muted-foreground)]">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal, currency)}</span>
              </div>
              <div className="flex items-center justify-between text-[var(--muted-foreground)]">
                <span>Discount</span>
                <span>{discountAmount > 0 ? `-${formatPrice(discountAmount, currency)}` : formatPrice(0, currency)}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-lg font-semibold text-[var(--primary)]">Total</span>
                <span className="text-3xl font-black text-[var(--primary)]">{formatPrice(total, currency)}</span>
              </div>
            </div>

            <button
              type="submit"
              form="checkout-form"
              disabled={placingOrder || items.length === 0}
              className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-[var(--primary)] text-sm font-semibold text-white disabled:opacity-50"
            >
              {placingOrder ? "Placing order..." : "Complete Purchase"}
            </button>

            {error && <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>}
          </div>
        </aside>
      </div>
    </div>
  );
}
