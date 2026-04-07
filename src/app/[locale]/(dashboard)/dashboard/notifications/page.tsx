"use client";

import { useEffect, useState } from "react";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/dashboard/notifications", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Failed to load notifications");
      }

      const data = await res.json();
      setItems(Array.isArray(data.notifications) ? data.notifications : []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAsRead = async (id?: string) => {
    await fetch("/api/dashboard/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id ? { id } : {}),
    });

    await loadNotifications();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Notifications</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Order and system alerts for your store.</p>
        </div>

        <button onClick={() => markAsRead()} className="rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white">
          Mark all as read
        </button>
      </div>

      {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      <section className="space-y-3">
        {loading && <p className="text-sm text-[var(--muted-foreground)]">Loading notifications...</p>}

        {!loading && items.length === 0 && (
          <div className="rounded-2xl bg-[var(--muted)]/35 p-6 text-sm text-[var(--muted-foreground)]">No notifications yet.</div>
        )}

        {items.map((item) => (
          <article key={item.id} className="rounded-2xl bg-[var(--background)] p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--primary)]">{item.title}</p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">{item.body}</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">{new Date(item.createdAt).toLocaleString()}</p>
              </div>

              {!item.isRead && (
                <button
                  onClick={() => markAsRead(item.id)}
                  className="rounded-full bg-[var(--muted)] px-3 py-1 text-xs font-semibold"
                >
                  Mark read
                </button>
              )}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
