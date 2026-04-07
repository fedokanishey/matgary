import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toPositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("q")?.trim() || "";
    const categorySlug = searchParams.get("category")?.trim() || "";
    const featured = searchParams.get("featured") === "true";
    const sort = searchParams.get("sort") || "latest";
    const page = toPositiveInt(searchParams.get("page"), 1);
    const limit = Math.min(toPositiveInt(searchParams.get("limit"), 20), 60);
    const skip = (page - 1) * limit;

    const store = await prisma.store.findUnique({
      where: { slug: storeSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        currency: true,
        isActive: true,
      },
    });

    if (!store || !store.isActive) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const whereClause: {
      storeId: string;
      isArchived: boolean;
      category?: { slug: string };
      OR?: Array<{ name?: { contains: string; mode: "insensitive" }; description?: { contains: string; mode: "insensitive" } }>;
      isFeatured?: boolean;
    } = {
      storeId: store.id,
      isArchived: false,
    };

    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ];
    }

    if (categorySlug) {
      whereClause.category = { slug: categorySlug };
    }

    if (featured) {
      whereClause.isFeatured = true;
    }

    const orderBy =
      sort === "price-asc"
        ? { price: "asc" as const }
        : sort === "price-desc"
          ? { price: "desc" as const }
          : { createdAt: "desc" as const };

    const [products, total, categories] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          reviews: {
            select: { rating: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where: whereClause }),
      prisma.category.findMany({
        where: { storeId: store.id },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
        },
      }),
    ]);

    const normalizedProducts = products.map((product) => {
      const reviewCount = product.reviews.length;
      const rating =
        reviewCount > 0
          ? Number(
              (
                product.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
              ).toFixed(1)
            )
          : 0;

      return {
        ...product,
        rating,
        reviewCount,
      };
    });

    return NextResponse.json({
      store,
      categories,
      products: normalizedProducts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error("[STORE_PRODUCTS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
