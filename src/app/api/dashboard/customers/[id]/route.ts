import { NextResponse } from "next/server";
import { getDashboardStore } from "@/lib/dashboard-store";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { store } = await getDashboardStore();

    if (!store) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customer = await prisma.storeCustomer.findFirst({
      where: {
        id,
        storeId: store.id,
      },
      include: {
        addresses: {
          orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        },
        orders: {
          include: {
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
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({
      customer: {
        ...customer,
        totalOrders: customer.orders.length,
        totalSpent: customer.orders.reduce((sum, order) => sum + order.totalAmount, 0),
      },
      currency: store.currency,
    });
  } catch (error) {
    console.error("[DASHBOARD_CUSTOMER_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
