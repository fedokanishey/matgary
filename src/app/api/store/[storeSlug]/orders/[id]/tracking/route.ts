import { NextResponse } from "next/server";
import { getStorefrontCustomer } from "@/lib/storefront-auth";
import { prisma } from "@/lib/prisma";

const statusOrder = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

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
      select: {
        id: true,
        orderNumber: true,
        status: true,
        trackingNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const currentIndex = statusOrder.indexOf(order.status as (typeof statusOrder)[number]);
    const timeline = statusOrder.map((status, index) => ({
      status,
      completed: currentIndex >= index,
      active: currentIndex === index,
    }));

    return NextResponse.json({
      order,
      timeline,
    });
  } catch (error) {
    console.error("[STORE_ORDER_TRACKING_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
