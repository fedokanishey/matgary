import { NextRequest, NextResponse } from "next/server";
import { getDashboardStore } from "@/lib/dashboard-store";
import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@prisma/client";

const allowedStatuses: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export async function GET() {
  try {
    const { store } = await getDashboardStore();
    if (!store) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { storeId: store.id },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders, currency: store.currency });
  } catch (error) {
    console.error("[DASHBOARD_ORDERS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { store } = await getDashboardStore();
    if (!store) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const orderId = String(body.orderId || "").trim();
    const status = String(body.status || "").toUpperCase() as OrderStatus;
    const trackingNumber = typeof body.trackingNumber === "string" ? body.trackingNumber.trim() : null;

    if (!orderId || !allowedStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const existing = await prisma.order.findFirst({
      where: { id: orderId, storeId: store.id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        trackingNumber,
      },
    });

    await prisma.notification.create({
      data: {
        storeId: store.id,
        type: "ORDER_STATUS",
        title: `Order ${order.orderNumber} updated`,
        body: `Order status changed to ${status}`,
        data: {
          orderId: order.id,
          status,
        },
      },
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("[DASHBOARD_ORDERS_PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
