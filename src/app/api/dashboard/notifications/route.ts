import { NextRequest, NextResponse } from "next/server";
import { getDashboardStore } from "@/lib/dashboard-store";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { store } = await getDashboardStore();
    if (!store) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = notifications.filter((item) => !item.isRead).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("[DASHBOARD_NOTIFICATIONS_GET]", error);
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
    const id = typeof body.id === "string" ? body.id.trim() : "";

    if (id) {
      const existing = await prisma.notification.findFirst({
        where: {
          id,
          storeId: store.id,
        },
        select: { id: true },
      });

      if (!existing) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 });
      }

      const notification = await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });

      return NextResponse.json({ success: true, notification });
    }

    await prisma.notification.updateMany({
      where: {
        storeId: store.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DASHBOARD_NOTIFICATIONS_PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
