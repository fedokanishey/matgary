import { NextRequest, NextResponse } from "next/server";
import { getStorefrontCustomer } from "@/lib/storefront-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeSlug: string; id: string }> }
) {
  try {
    const { storeSlug, id } = await params;
    const { store, customer } = await getStorefrontCustomer(storeSlug);

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    if (!customer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const order = await prisma.order.findFirst({
      where: {
        id,
        storeId: store.id,
        customerId: customer.id,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                slug: true,
              },
            },
          },
        },
        coupon: {
          select: {
            id: true,
            code: true,
            discountType: true,
            discountValue: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order, currency: store.currency });
  } catch (error) {
    console.error("[STORE_ORDER_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ storeSlug: string; id: string }> }
) {
  try {
    const { storeSlug, id } = await params;
    const { store, customer } = await getStorefrontCustomer(storeSlug);

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    if (!customer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const notes = typeof body.notes === "string" ? body.notes.trim() : null;

    const existing = await prisma.order.findFirst({
      where: {
        id,
        storeId: store.id,
        customerId: customer.id,
      },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { notes },
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error("[STORE_ORDER_PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
