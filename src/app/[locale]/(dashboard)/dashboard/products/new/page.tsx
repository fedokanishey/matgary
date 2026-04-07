"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
}

export default function NewProductPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    compareAt: "",
    inventory: "0",
    categoryId: "",
    imagesText: "",
    isFeatured: false,
    isArchived: false,
  });

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch("/api/notifications/products", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setCategories(Array.isArray(data.categories) ? data.categories : []);
      } catch {
        // Keep page usable even if categories fail.
      }
    };

    loadCategories();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const images = form.imagesText
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean);

      const res = await fetch("/api/notifications/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          price: form.price,
          compareAt: form.compareAt,
          inventory: form.inventory,
          categoryId: form.categoryId || null,
          images,
          isFeatured: form.isFeatured,
          isArchived: form.isArchived,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create product");
      }

      router.push("/dashboard/products");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Create Product</h1>
        <p className="text-sm text-(--muted-foreground)">Add a new product to your store catalog.</p>
      </div>

      {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      <form onSubmit={submit} className="space-y-4 rounded-2xl bg-background p-5 shadow-sm">
        <input
          required
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          placeholder="Product name"
          className="h-11 w-full rounded-lg bg-(--muted) px-3 text-sm outline-none"
        />

        <textarea
          value={form.description}
          onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          placeholder="Description"
          className="min-h-28 w-full rounded-lg bg-(--muted) px-3 py-2 text-sm outline-none"
        />

        <div className="grid gap-3 md:grid-cols-3">
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
            placeholder="Price"
            className="h-11 rounded-lg bg-(--muted) px-3 text-sm outline-none"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.compareAt}
            onChange={(event) => setForm((prev) => ({ ...prev, compareAt: event.target.value }))}
            placeholder="Compare at"
            className="h-11 rounded-lg bg-(--muted) px-3 text-sm outline-none"
          />
          <input
            type="number"
            min="0"
            value={form.inventory}
            onChange={(event) => setForm((prev) => ({ ...prev, inventory: event.target.value }))}
            placeholder="Inventory"
            className="h-11 rounded-lg bg-(--muted) px-3 text-sm outline-none"
          />
        </div>

        <select
          aria-label="Category"
          value={form.categoryId}
          onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))}
          className="h-11 w-full rounded-lg bg-(--muted) px-3 text-sm outline-none"
        >
          <option value="">No category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <textarea
          value={form.imagesText}
          onChange={(event) => setForm((prev) => ({ ...prev, imagesText: event.target.value }))}
          placeholder="Image URLs, one per line"
          className="min-h-24 w-full rounded-lg bg-(--muted) px-3 py-2 text-sm outline-none"
        />

        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2 text-(--muted-foreground)">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(event) => setForm((prev) => ({ ...prev, isFeatured: event.target.checked }))}
            />
            Featured
          </label>
          <label className="flex items-center gap-2 text-(--muted-foreground)">
            <input
              type="checkbox"
              checked={form.isArchived}
              onChange={(event) => setForm((prev) => ({ ...prev, isArchived: event.target.checked }))}
            />
            Archived
          </label>
        </div>

        <div className="flex gap-2">
          <button disabled={loading} className="h-11 rounded-xl bg-(--primary) px-6 text-sm font-semibold text-white disabled:opacity-50">
            {loading ? "Creating..." : "Create product"}
          </button>
          <button type="button" onClick={() => router.push("/dashboard/products")} className="h-11 rounded-xl bg-(--muted) px-6 text-sm font-semibold">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
