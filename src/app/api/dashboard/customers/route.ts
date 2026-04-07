import { NextResponse } from "next/server";
import { getDashboardStore } from "@/lib/dashboard-store";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { store } = await getDashboardStore();
    if (!store) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customers = await prisma.storeCustomer.findMany({
      where: { storeId: store.id },
      include: {
        orders: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const normalized = customers.map((customer) => ({
      ...customer,
      totalOrders: customer.orders.length,
      totalSpent: customer.orders.reduce((sum, order) => sum + order.totalAmount, 0),
      lastOrderAt: customer.orders[0]?.createdAt || null,
    }));

    return NextResponse.json({
      customers: normalized,
      currency: store.currency,
    });
  } catch (error) {
    console.error("[DASHBOARD_CUSTOMERS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
