import { NextResponse } from "next/server";
import { getDashboardStore } from "@/lib/dashboard-store";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { store } = await getDashboardStore();
    if (!store) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [totalOrders, totalProducts, totalCustomers, orders, orderItems] = await Promise.all([
      prisma.order.count({ where: { storeId: store.id } }),
      prisma.product.count({ where: { storeId: store.id, isArchived: false } }),
      prisma.storeCustomer.count({ where: { storeId: store.id } }),
      prisma.order.findMany({
        where: { storeId: store.id },
        select: {
          id: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          customerName: true,
          orderNumber: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.orderItem.findMany({
        where: {
          order: {
            storeId: store.id,
          },
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              images: true,
            },
          },
        },
      }),
    ]);

    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    const statusCounts = orders.reduce<Record<string, number>>((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    const productStats = new Map<
      string,
      { productId: string; name: string; image: string | null; quantity: number; revenue: number }
    >();

    for (const item of orderItems) {
      const existing = productStats.get(item.productId) || {
        productId: item.productId,
        name: item.product?.name || "Unknown product",
        image: item.product?.images?.[0] || null,
        quantity: 0,
        revenue: 0,
      };

      existing.quantity += item.quantity;
      existing.revenue += item.total;
      productStats.set(item.productId, existing);
    }

    const topProducts = Array.from(productStats.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return NextResponse.json({
      currency: store.currency,
      summary: {
        totalRevenue,
        totalOrders,
        totalProducts,
        totalCustomers,
      },
      statusCounts,
      topProducts,
      recentOrders: orders,
    });
  } catch (error) {
    console.error("[DASHBOARD_ANALYTICS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
