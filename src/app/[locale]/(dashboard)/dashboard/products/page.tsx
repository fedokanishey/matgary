"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { GenericInput } from "@/components/ui/input";

interface Product {
  id: number;
  name: string;
  price: string;
  inventory: string;
  category: string;
}

export default function ProductsPage() {
  const t = useTranslations("dashboard.products");
  const commonT = useTranslations("common");
  const [showAddForm, setShowAddForm] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    inventory: "",
    category: "",
  });

  // Load products from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("storeProducts");
    if (saved) {
      try {
        setProducts(JSON.parse(saved));
      } catch (error) {
        console.error("Failed to parse products:", error);
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      if (editingId) {
        // Update existing product
        const updated = products.map((p) =>
          p.id === editingId ? { ...p, ...formData } : p
        );
        setProducts(updated);
        localStorage.setItem("storeProducts", JSON.stringify(updated));
        setEditingId(null);
      } else {
        // Add new product
        const newProduct: Product = { id: Date.now(), ...formData };
        const updated = [...products, newProduct];
        setProducts(updated);
        localStorage.setItem("storeProducts", JSON.stringify(updated));
      }
      setFormData({ name: "", price: "", inventory: "", category: "" });
      setShowAddForm(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setFormData({
      name: product.name,
      price: product.price,
      inventory: product.inventory,
      category: product.category,
    });
    setEditingId(product.id);
    setShowAddForm(true);
  };

  const handleDeleteProduct = (id: number) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    localStorage.setItem("storeProducts", JSON.stringify(updated));
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({ name: "", price: "", inventory: "", category: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t("add")}
        </Button>
      </div>

      {showAddForm && (
        <div className="rounded-2xl border border-[var(--border,#e2e8f0)] bg-[var(--background,#ffffff)] p-6 space-y-4">
          <h2 className="text-lg font-semibold">
            {editingId ? "تعديل المنتج" : t("add")}
          </h2>
          <form onSubmit={handleAddProduct} className="space-y-4">
            <GenericInput
              label={t("name")}
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder={t("name")}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <GenericInput
                label={t("price")}
                name="price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0.00"
              />
              <GenericInput
                label={t("inventory")}
                name="inventory"
                type="number"
                value={formData.inventory}
                onChange={handleInputChange}
                placeholder="0"
              />
            </div>
            <GenericInput
              label={t("category")}
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              placeholder={t("category")}
            />
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                {editingId ? "تحديث" : t("add")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleCancel}
              >
                {commonT("cancel")}
              </Button>
            </div>
          </form>
        </div>
      )}

      {products.length > 0 ? (
        <div className="space-y-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="rounded-2xl border border-[var(--border,#e2e8f0)] bg-[var(--background,#ffffff)] p-4 flex items-center justify-between"
            >
              <div className="flex-1">
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-sm text-[var(--muted-foreground,#64748b)]">
                  {product.category && `${product.category} • `}
                  {product.inventory && `Stock: ${product.inventory}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {product.price && (
                  <span className="text-lg font-bold text-[var(--primary,#6366f1)] min-w-fit">
                    ${product.price}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditProduct(product)}
                >
                  تعديل
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteProduct(product.id)}
                >
                  حذف
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : !showAddForm ? (
        <div className="rounded-2xl border border-[var(--border,#e2e8f0)] bg-[var(--background,#ffffff)] p-6">
          <div className="flex flex-col items-center justify-center py-16 text-[var(--muted-foreground,#64748b)]">
            <svg className="size-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            <p>{t("empty")}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
