"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compareAt: number | null;
  images: string[];
  inventory: number;
  categoryId: string | null;
  isFeatured: boolean;
  isArchived: boolean;
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    let canceled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/notifications/products", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Failed to load products");
        }

        const data = await res.json();
        const allProducts: Product[] = Array.isArray(data.products) ? data.products : [];
        const product = allProducts.find((item) => item.id === id);

        if (!product) {
          throw new Error("Product not found");
        }

        if (!canceled) {
          setCategories(Array.isArray(data.categories) ? data.categories : []);
          setForm({
            name: product.name,
            description: product.description || "",
            price: String(product.price),
            compareAt: product.compareAt !== null ? String(product.compareAt) : "",
            inventory: String(product.inventory),
            categoryId: product.categoryId || "",
            imagesText: product.images.join("\n"),
            isFeatured: product.isFeatured,
            isArchived: product.isArchived,
          });
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
  }, [id]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const images = form.imagesText
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean);

      const res = await fetch("/api/notifications/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
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
        throw new Error(data.error || "Failed to update product");
      }

      router.push("/dashboard/products");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-(--muted-foreground)">Loading product...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Edit Product</h1>
        <p className="text-sm text-(--muted-foreground)">Update product details and inventory.</p>
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
          <button disabled={saving} className="h-11 rounded-xl bg-(--primary) px-6 text-sm font-semibold text-white disabled:opacity-50">
            {saving ? "Saving..." : "Save product"}
          </button>
          <button type="button" onClick={() => router.push("/dashboard/products")} className="h-11 rounded-xl bg-(--muted) px-6 text-sm font-semibold">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
