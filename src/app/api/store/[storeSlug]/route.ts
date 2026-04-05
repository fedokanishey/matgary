import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/store/[storeSlug]
 * Public API endpoint for storefront data
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;

    const store = await db.store.findUnique({
      where: { slug: storeSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        heroImageUrl: true,
        currency: true,
        isActive: true,
        categories: {
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
          },
          orderBy: { name: "asc" },
        },
        products: {
          where: { isArchived: false },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            price: true,
            compareAt: true,
            images: true,
            inventory: true,
            isFeatured: true,
            createdAt: true,
            category: {
              select: { name: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    if (!store || !store.isActive) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(store);
  } catch (error) {
    console.error("[STORE_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
