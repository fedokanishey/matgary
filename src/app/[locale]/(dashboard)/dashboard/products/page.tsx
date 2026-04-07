"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Package,
  Edit2,
  Trash2,
  Star,
  Archive,
  Loader2,
  X,
  Save,
  ImageIcon,
  DollarSign,
  Tag,
  Boxes,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { GenericInput } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MultiImageUpload } from "@/components/ui/multi-image-upload";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compareAt: number | null;
  images: string[];
  inventory: number;
  isFeatured: boolean;
  isArchived: boolean;
  categoryId: string | null;
  category: Category | null;
  createdAt: string;
}

interface FormData {
  name: string;
  description: string;
  price: string;
  compareAt: string;
  images: string[];
  inventory: string;
  categoryId: string;
  isFeatured: boolean;
  isArchived: boolean;
}

const defaultFormData: FormData = {
  name: "",
  description: "",
  price: "",
  compareAt: "",
  images: [],
  inventory: "0",
  categoryId: "",
  isFeatured: false,
  isArchived: false,
};

export default function ProductsPage() {
  const t = useTranslations("dashboard.products");
  const commonT = useTranslations("common");
  const queryClient = useQueryClient();

  // State
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Fetch products with React Query for caching
  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/notifications/products");
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });

  const products = data?.products || [];
  const categories = data?.categories || [];

  // Filter products
  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || product.categoryId === filterCategory;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "featured" && product.isFeatured) ||
      (filterStatus === "archived" && product.isArchived) ||
      (filterStatus === "active" && !product.isArchived);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Open dialog for new product
  const handleAddNew = () => {
    setEditingProduct(null);
    setFormData(defaultFormData);
    setShowDialog(true);
  };

  // Open dialog for editing
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      compareAt: product.compareAt?.toString() || "",
      images: product.images || [],
      inventory: product.inventory.toString(),
      categoryId: product.categoryId || "",
      isFeatured: product.isFeatured,
      isArchived: product.isArchived,
    });
    setShowDialog(true);
  };

  // Save product
  const handleSave = async () => {
    if (!formData.name.trim()) return;

    setIsSaving(true);
    try {
      const method = editingProduct ? "PUT" : "POST";
      const body = editingProduct
        ? { id: editingProduct.id, ...formData }
        : formData;

      const res = await fetch("/api/notifications/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        // Invalidate and refetch products
        queryClient.invalidateQueries({ queryKey: ["products"] });
        setShowDialog(false);
        setFormData(defaultFormData);
        setEditingProduct(null);
      }
    } catch (error) {
      console.error("Failed to save product:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete product
  const handleDelete = async (productId: string) => {
    try {
      const res = await fetch(`/api/notifications/products?id=${productId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["products"] });
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{t("title")}</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            {products.length} {products.length === 1 ? "product" : "products"} in your store
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleAddNew} className="gap-2">
            <Plus className="w-4 h-4" />
            {t("add")}
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/dashboard/products/new">
              <Plus className="w-4 h-4" />
              New page
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
              <input
                type="text"
                placeholder={commonT("search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            </div>

            {/* Category filter */}
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat: Category) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product: Product) => (
            <Card
              key={product.id}
              className={cn(
                "group overflow-hidden transition-all hover:shadow-lg",
                product.isArchived && "opacity-60"
              )}
            >
              {/* Product Image */}
              <div className="relative aspect-square bg-[var(--muted)]">
                {product.images && product.images.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-[var(--muted-foreground)]" />
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {product.isFeatured && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500 text-white flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Featured
                    </span>
                  )}
                  {product.isArchived && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-500 text-white flex items-center gap-1">
                      <Archive className="w-3 h-3" />
                      Archived
                    </span>
                  )}
                </div>

                {/* Sale badge */}
                {product.compareAt && product.compareAt > product.price && (
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500 text-white">
                      {Math.round((1 - product.price / product.compareAt) * 100)}% OFF
                    </span>
                  </div>
                )}

                {/* Hover actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleEdit(product)}
                    className="gap-1"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleteConfirm(product.id)}
                    className="gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Product Info */}
              <CardContent className="p-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-[var(--foreground)] truncate">
                    {product.name}
                  </h3>

                  {product.category && (
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {product.category.name}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-[var(--primary)]">
                        ${product.price.toFixed(2)}
                      </span>
                      {product.compareAt && product.compareAt > product.price && (
                        <span className="text-sm text-[var(--muted-foreground)] line-through">
                          ${product.compareAt.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded",
                        product.inventory > 0
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      )}
                    >
                      {product.inventory > 0 ? `${product.inventory} in stock` : "Out of stock"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-[var(--muted-foreground)]">
              <Package className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">{t("empty")}</p>
              <p className="text-sm mt-1">Click &quot;Add Product&quot; to get started</p>
              <Button onClick={handleAddNew} className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                {t("add")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Product Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[var(--primary)]" />
              {editingProduct ? "Edit Product" : t("add")}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Update your product details"
                : "Add a new product to your store"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Product Images */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Product Images
              </Label>
              <MultiImageUpload
                value={formData.images}
                onChange={(urls) => setFormData({ ...formData, images: urls })}
                maxImages={5}
                description="Add up to 5 images. First image will be the main photo."
                cropAspect={1}
              />
            </div>

            <Separator />

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GenericInput
                label={t("name")}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Product name"
                required
                startIcon={<Tag className="w-4 h-4" />}
              />

              <div className="space-y-2">
                <Label>{t("category")}</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categoryId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No category</SelectItem>
                    {categories.map((cat: Category) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your product..."
              helperText="This will appear on the product page"
            />

            <Separator />

            {/* Pricing */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Pricing
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <GenericInput
                  label={t("price")}
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  required
                />
                <GenericInput
                  label="Compare at price"
                  type="number"
                  value={formData.compareAt}
                  onChange={(e) => setFormData({ ...formData, compareAt: e.target.value })}
                  placeholder="Original price (for sale display)"
                  helperText="Set higher than price to show discount"
                />
              </div>
            </div>

            {/* Inventory */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Boxes className="w-4 h-4" />
                Inventory
              </Label>
              <GenericInput
                label={t("inventory")}
                type="number"
                value={formData.inventory}
                onChange={(e) => setFormData({ ...formData, inventory: e.target.value })}
                placeholder="0"
                helperText="Number of items in stock"
              />
            </div>

            <Separator />

            {/* Status toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-[var(--border)]">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    {t("featured")}
                  </Label>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Featured products appear on the homepage
                  </p>
                </div>
                <Switch
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isFeatured: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-[var(--border)]">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Archive className="w-4 h-4" />
                    {t("archived")}
                  </Label>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Archived products are hidden from your store
                  </p>
                </div>
                <Switch
                  checked={formData.isArchived}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isArchived: checked })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isSaving}
            >
              <X className="w-4 h-4 mr-2" />
              {commonT("cancel")}
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !formData.name.trim()}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {editingProduct ? "Update" : commonT("create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              {commonT("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {commonT("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
