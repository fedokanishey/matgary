import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPushToAll, type PushPayload } from "@/lib/push";
import { formatPrice } from "@/lib/utils";

/**
 * POST /api/notifications/send
 * Trigger push notifications to the store owner when a new order is placed.
 *
 * Body: { storeId: string, orderId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { storeId, orderId } = await req.json();

    if (!storeId || !orderId) {
      return NextResponse.json(
        { error: "storeId and orderId are required" },
        { status: 400 }
      );
    }

    // Fetch the order with its items
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        store: { include: { user: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Create an in-app notification record
    await db.notification.create({
      data: {
        storeId,
        type: "NEW_ORDER",
        title: `🛒 New Order #${order.orderNumber}`,
        body: `${order.customerName} placed an order for ${formatPrice(order.totalAmount, order.currency)}`,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          totalAmount: order.totalAmount,
        },
      },
    });

    // Fetch the store owner's push subscriptions
    const subscriptions = await db.pushSubscription.findMany({
      where: { userId: order.store.userId },
    });

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Notification saved, but no push subscriptions found",
      });
    }

    // Send push notification to all owner devices
    const payload: PushPayload = {
      title: `🛒 New Order #${order.orderNumber}`,
      body: `${order.customerName} ordered ${order.items.length} item(s) — ${formatPrice(order.totalAmount, order.currency)}`,
      icon: order.store.logoUrl || "/icons/icon-192x192.png",
      url: `/en/dashboard/orders`,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    };

    await sendPushToAll(subscriptions, payload);

    return NextResponse.json({ success: true, sent: subscriptions.length });
  } catch (error) {
    console.error("[Send Notification] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
