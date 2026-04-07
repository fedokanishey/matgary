"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface TrackingPayload {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    trackingNumber: string | null;
  };
  timeline: Array<{
    status: string;
    completed: boolean;
    active: boolean;
  }>;
}

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = params?.storeSlug as string;
  const locale = (params?.locale as string) || "en";
  const id = params?.id as string;
  const basePath = `/${locale}/store/${storeSlug}`;

  const [payload, setPayload] = useState<TrackingPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;

    const loadTracking = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/store/${storeSlug}/orders/${id}/tracking`, { credentials: "include" });
        if (res.status === 401) {
          router.push(`${basePath}/auth/login`);
          return;
        }

        if (!res.ok) {
          throw new Error("Failed to load tracking info");
        }

        const data = (await res.json()) as TrackingPayload;
        if (!canceled) {
          setPayload(data);
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

    loadTracking();

    return () => {
      canceled = true;
    };
  }, [storeSlug, id, router, basePath]);

  if (loading) {
    return <div className="px-4 py-8 text-sm text-[var(--muted-foreground)]">Loading tracking...</div>;
  }

  if (error || !payload) {
    return <div className="mx-auto max-w-xl rounded-xl bg-red-50 p-4 text-sm text-red-600">{error || "Tracking unavailable"}</div>;
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8">
      <div className="rounded-3xl bg-[var(--muted)]/35 p-6">
        <h1 className="text-3xl font-black text-[var(--primary)]">Order Tracking</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">Order #{payload.order.orderNumber}</p>
        {payload.order.trackingNumber && (
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Tracking no. {payload.order.trackingNumber}</p>
        )}
      </div>

      <div className="mt-6 rounded-2xl bg-[var(--background)] p-5 shadow-sm">
        <ol className="space-y-4">
          {payload.timeline.map((step, index) => (
            <li key={step.status} className="flex gap-3">
              <div className="mt-1 flex flex-col items-center">
                <span
                  className={cn(
                    "h-4 w-4 rounded-full border-2",
                    step.completed
                      ? "border-[var(--primary)] bg-[var(--primary)]"
                      : "border-[var(--border)] bg-transparent"
                  )}
                />
                {index < payload.timeline.length - 1 && (
                  <span className="mt-1 h-8 w-px bg-[var(--border)]" />
                )}
              </div>
              <div>
                <p className={cn("text-sm font-semibold", step.active ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]")}>
                  {step.status}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {step.completed ? "Completed" : "Waiting"}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-5 flex gap-2">
        <Link href={`${basePath}/orders/${id}`} className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white">
          Order details
        </Link>
        <Link href={`${basePath}/orders`} className="rounded-full bg-[var(--muted)] px-4 py-2 text-sm font-semibold text-[var(--muted-foreground)]">
          All orders
        </Link>
      </div>
    </div>
  );
}
