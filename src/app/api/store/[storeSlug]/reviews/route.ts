import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStorefrontCustomer } from "@/lib/storefront-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId")?.trim();

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const store = await prisma.store.findUnique({
      where: { slug: storeSlug },
      select: { id: true, isActive: true, configuration: { select: { reviews: true } } },
    });

    if (!store || !store.isActive) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const reviews = await prisma.productReview.findMany({
      where: {
        storeId: store.id,
        productId,
        isApproved: true,
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const count = reviews.length;
    const average = count > 0 ? Number((reviews.reduce((sum, item) => sum + item.rating, 0) / count).toFixed(1)) : 0;

    return NextResponse.json({
      enabled: store.configuration?.reviews ?? false,
      summary: {
        count,
        average,
      },
      reviews,
    });
  } catch (error) {
    console.error("[STORE_REVIEWS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const { store, customer } = await getStorefrontCustomer(storeSlug);

    if (!store || !store.isActive) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    if (!customer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!store.configuration?.reviews) {
      return NextResponse.json({ error: "Reviews are disabled for this store." }, { status: 403 });
    }

    const body = await request.json();
    const productId = typeof body.productId === "string" ? body.productId.trim() : "";
    const rating = Number(body.rating);
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const comment = typeof body.comment === "string" ? body.comment.trim() : "";

    if (!productId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid review payload." }, { status: 400 });
    }

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        storeId: store.id,
        isArchived: false,
      },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const review = await prisma.productReview.upsert({
      where: {
        productId_customerId: {
          productId,
          customerId: customer.id,
        },
      },
      update: {
        rating,
        title: title || null,
        comment: comment || null,
        isApproved: true,
      },
      create: {
        storeId: store.id,
        productId,
        customerId: customer.id,
        rating,
        title: title || null,
        comment: comment || null,
        isApproved: true,
      },
      include: {
        customer: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("[STORE_REVIEWS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
