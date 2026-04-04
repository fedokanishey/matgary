import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { slugify } from "@/lib/utils";

// GET all products for the user's store
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { stores: { take: 1 } },
    });

    if (!user?.stores[0]) return NextResponse.json({ error: "No store" }, { status: 404 });

    const products = await prisma.product.findMany({
      where: { storeId: user.stores[0].id },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    const categories = await prisma.category.findMany({
      where: { storeId: user.stores[0].id },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, products, categories });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// POST create a new product
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { stores: { take: 1 } },
    });

    if (!user?.stores[0]) return NextResponse.json({ error: "No store" }, { status: 404 });

    const storeId = user.stores[0].id;
    const data = await req.json();

    // Generate unique slug
    let baseSlug = slugify(data.name);
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
      const existing = await prisma.product.findUnique({
        where: { storeId_slug: { storeId, slug } },
      });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const product = await prisma.product.create({
      data: {
        storeId,
        name: data.name,
        slug,
        description: data.description || null,
        price: parseFloat(data.price) || 0,
        compareAt: data.compareAt ? parseFloat(data.compareAt) : null,
        images: data.images || [],
        inventory: parseInt(data.inventory) || 0,
        isFeatured: data.isFeatured || false,
        isArchived: data.isArchived || false,
        categoryId: data.categoryId || null,
      },
      include: { category: true },
    });

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

// PUT update a product
export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { stores: { take: 1 } },
    });

    if (!user?.stores[0]) return NextResponse.json({ error: "No store" }, { status: 404 });

    const storeId = user.stores[0].id;
    const data = await req.json();

    if (!data.id) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    // Verify product belongs to user's store
    const existing = await prisma.product.findUnique({
      where: { id: data.id },
    });

    if (!existing || existing.storeId !== storeId) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product = await prisma.product.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description || null,
        price: parseFloat(data.price) || 0,
        compareAt: data.compareAt ? parseFloat(data.compareAt) : null,
        images: data.images || [],
        inventory: parseInt(data.inventory) || 0,
        isFeatured: data.isFeatured ?? existing.isFeatured,
        isArchived: data.isArchived ?? existing.isArchived,
        categoryId: data.categoryId || null,
      },
      include: { category: true },
    });

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// DELETE a product
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { stores: { take: 1 } },
    });

    if (!user?.stores[0]) return NextResponse.json({ error: "No store" }, { status: 404 });

    const storeId = user.stores[0].id;
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("id");

    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    // Verify product belongs to user's store
    const existing = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existing || existing.storeId !== storeId) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
