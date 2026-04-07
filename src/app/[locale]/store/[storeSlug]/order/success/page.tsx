"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { formatPrice } from "@/lib/utils";

interface OrderPayload {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
}

export default function OrderSuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const storeSlug = params?.storeSlug as string;
  const locale = (params?.locale as string) || "en";

  const orderId = searchParams.get("orderId") || "";
  const orderNumberFromQuery = searchParams.get("orderNumber") || "";

  const [order, setOrder] = useState<OrderPayload | null>(null);

  useEffect(() => {
    if (!orderId) {
      return;
    }

    const loadOrder = async () => {
      try {
        const res = await fetch(`/api/store/${storeSlug}/orders/${orderId}`, { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (data.order) {
          setOrder({
            id: data.order.id,
            orderNumber: data.order.orderNumber,
            status: data.order.status,
            totalAmount: data.order.totalAmount,
            currency: data.order.currency,
            createdAt: data.order.createdAt,
          });
        }
      } catch {
        // Keep lightweight success fallback.
      }
    };

    loadOrder();
  }, [orderId, storeSlug]);

  const basePath = `/${locale}/store/${storeSlug}`;
  const orderNumber = order?.orderNumber || orderNumberFromQuery || "Pending";

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center px-4 py-10">
      <div className="w-full rounded-3xl bg-[var(--muted)]/35 p-8 text-center md:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--primary)] text-white">
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m5 13 4 4L19 7" />
          </svg>
        </div>

        <h1 className="mt-6 text-4xl font-black tracking-tight text-[var(--primary)]">Thank you for your order</h1>
        <p className="mt-3 text-sm text-[var(--muted-foreground)]">Order number #{orderNumber}</p>

        {order && (
          <div className="mx-auto mt-8 max-w-md rounded-2xl bg-[var(--background)] p-5 text-left shadow-sm">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">Status</span>
              <span className="font-semibold text-[var(--primary)]">{order.status}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-[var(--muted-foreground)]">Total</span>
              <span className="font-semibold text-[var(--primary)]">{formatPrice(order.totalAmount, order.currency)}</span>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {orderId && (
            <Link
              href={`${basePath}/orders/${orderId}`}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--primary)] px-6 text-sm font-semibold text-white"
            >
              View Order
            </Link>
          )}
          <Link
            href={`${basePath}/shop`}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--border)] px-6 text-sm font-semibold"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
