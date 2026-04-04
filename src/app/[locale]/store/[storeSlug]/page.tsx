import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/storefront/product-card";

/**
 * Store homepage — shows featured products and categories.
 */
export default async function StoreHomePage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;

  const store = await db.store.findUnique({
    where: { slug: storeSlug },
    include: {
      products: {
        where: { isArchived: false },
        orderBy: { createdAt: "desc" },
        take: 12,
        include: { category: true },
      },
      categories: true,
    },
  });

  if (!store) notFound();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Store Hero */}
      <section className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">
          {store.name}
        </h1>
        {store.description && (
          <p className="text-[var(--muted-foreground)] max-w-lg mx-auto">
            {store.description}
          </p>
        )}
      </section>

      {/* Categories */}
      {store.categories.length > 0 && (
        <section className="mb-12">
          <div className="flex gap-3 overflow-x-auto pb-2">
            <button className="shrink-0 px-4 py-2 bg-[var(--primary)] text-white rounded-full text-sm font-medium">
              All
            </button>
            {store.categories.map((cat) => (
              <button
                key={cat.id}
                className="shrink-0 px-4 py-2 bg-[var(--muted)] text-[var(--foreground)] rounded-full text-sm font-medium hover:bg-[var(--primary)] hover:text-white transition-colors"
              >
                {cat.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Products Grid */}
      <section>
        {store.products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {store.products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                compareAt={product.compareAt}
                images={product.images}
                currency={store.currency}
                inventory={product.inventory}
                isFeatured={product.isFeatured}
                categoryName={product.category?.name}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <svg className="size-16 mx-auto mb-4 opacity-20 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            <p className="text-[var(--muted-foreground)]">
              No products available yet. Check back soon!
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
