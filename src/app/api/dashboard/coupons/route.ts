import { NextRequest, NextResponse } from "next/server";
import { getDashboardStore } from "@/lib/dashboard-store";
import { prisma } from "@/lib/prisma";

type CouponDiscountType = "PERCENTAGE" | "FIXED";

const allowedTypes: CouponDiscountType[] = ["PERCENTAGE", "FIXED"];

export async function GET() {
  try {
    const { store } = await getDashboardStore();
    if (!store) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const coupons = await prisma.coupon.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ coupons, currency: store.currency });
  } catch (error) {
    console.error("[DASHBOARD_COUPONS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { store } = await getDashboardStore();
    if (!store) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const code = String(body.code || "").trim().toUpperCase();
    const discountType = String(body.discountType || "").toUpperCase() as CouponDiscountType;
    const discountValue = Number(body.discountValue || 0);

    if (!code || !allowedTypes.includes(discountType) || !Number.isFinite(discountValue) || discountValue <= 0) {
      return NextResponse.json({ error: "Invalid coupon payload" }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        storeId: store.id,
        code,
        description: body.description?.trim() || null,
        discountType,
        discountValue,
        minOrderAmount: body.minOrderAmount ? Number(body.minOrderAmount) : null,
        maxDiscountAmount: body.maxDiscountAmount ? Number(body.maxDiscountAmount) : null,
        usageLimit: body.usageLimit ? Number(body.usageLimit) : null,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        isActive: body.isActive !== false,
      },
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error) {
    console.error("[DASHBOARD_COUPONS_POST]", error);
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { store } = await getDashboardStore();
    if (!store) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const id = String(body.id || "").trim();

    if (!id) {
      return NextResponse.json({ error: "Coupon id is required" }, { status: 400 });
    }

    const existing = await prisma.coupon.findFirst({
      where: {
        id,
        storeId: store.id,
      },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    const data: {
      code?: string;
      description?: string | null;
      discountType?: CouponDiscountType;
      discountValue?: number;
      minOrderAmount?: number | null;
      maxDiscountAmount?: number | null;
      usageLimit?: number | null;
      startsAt?: Date | null;
      endsAt?: Date | null;
      isActive?: boolean;
    } = {};

    if (typeof body.code === "string" && body.code.trim()) {
      data.code = body.code.trim().toUpperCase();
    }

    if (typeof body.description === "string") {
      data.description = body.description.trim() || null;
    }

    if (typeof body.discountType === "string") {
      const normalizedType = body.discountType.toUpperCase() as CouponDiscountType;
      if (!allowedTypes.includes(normalizedType)) {
        return NextResponse.json({ error: "Invalid discount type" }, { status: 400 });
      }
      data.discountType = normalizedType;
    }

    if (body.discountValue !== undefined) {
      const discountValue = Number(body.discountValue);
      if (!Number.isFinite(discountValue) || discountValue <= 0) {
        return NextResponse.json({ error: "Invalid discount value" }, { status: 400 });
      }
      data.discountValue = discountValue;
    }

    if (body.minOrderAmount !== undefined) {
      data.minOrderAmount = body.minOrderAmount ? Number(body.minOrderAmount) : null;
    }

    if (body.maxDiscountAmount !== undefined) {
      data.maxDiscountAmount = body.maxDiscountAmount ? Number(body.maxDiscountAmount) : null;
    }

    if (body.usageLimit !== undefined) {
      data.usageLimit = body.usageLimit ? Number(body.usageLimit) : null;
    }

    if (body.startsAt !== undefined) {
      data.startsAt = body.startsAt ? new Date(body.startsAt) : null;
    }

    if (body.endsAt !== undefined) {
      data.endsAt = body.endsAt ? new Date(body.endsAt) : null;
    }

    if (body.isActive !== undefined) {
      data.isActive = Boolean(body.isActive);
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error) {
    console.error("[DASHBOARD_COUPONS_PUT]", error);
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { store } = await getDashboardStore();
    if (!store) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get("id")?.trim();
    if (!id) {
      return NextResponse.json({ error: "Coupon id is required" }, { status: 400 });
    }

    const existing = await prisma.coupon.findFirst({
      where: {
        id,
        storeId: store.id,
      },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    await prisma.coupon.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DASHBOARD_COUPONS_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}
