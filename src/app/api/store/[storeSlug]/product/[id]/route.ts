import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeSlug: string; id: string }> }
) {
  try {
    const { storeSlug, id } = await params;

    const store = await prisma.store.findUnique({
      where: { slug: storeSlug },
      select: {
        id: true,
        name: true,
        currency: true,
        isActive: true,
        configuration: {
          select: { reviews: true },
        },
      },
    });

    if (!store || !store.isActive) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const product = await prisma.product.findFirst({
      where: {
        storeId: store.id,
        isArchived: false,
        OR: [{ id }, { slug: id }],
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        reviews: {
          where: { isApproved: true },
          include: {
            customer: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const relatedProducts = await prisma.product.findMany({
      where: {
        storeId: store.id,
        isArchived: false,
        id: { not: product.id },
        ...(product.categoryId ? { categoryId: product.categoryId } : {}),
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        reviews: {
          select: { rating: true },
        },
      },
      take: 4,
      orderBy: { createdAt: "desc" },
    });

    const reviewCount = product.reviews.length;
    const avgRating =
      reviewCount > 0
        ? Number(
            (
              product.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
            ).toFixed(1)
          )
        : 0;

    return NextResponse.json({
      store: {
        id: store.id,
        name: store.name,
        currency: store.currency,
        reviewsEnabled: store.configuration?.reviews ?? false,
      },
      product: {
        ...product,
        rating: avgRating,
        reviewCount,
      },
      relatedProducts: relatedProducts.map((related) => {
        const count = related.reviews.length;
        const rating =
          count > 0
            ? Number((related.reviews.reduce((sum, review) => sum + review.rating, 0) / count).toFixed(1))
            : 0;

        return {
          ...related,
          rating,
          reviewCount: count,
        };
      }),
    });
  } catch (error) {
    console.error("[STORE_PRODUCT_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
