import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeCouponDiscount } from "@/lib/coupon";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const body = await request.json();
    const code = String(body.code || "").trim().toUpperCase();
    const subtotal = Number(body.subtotal || 0);

    if (!code) {
      return NextResponse.json({ error: "Coupon code is required." }, { status: 400 });
    }

    if (!Number.isFinite(subtotal) || subtotal < 0) {
      return NextResponse.json({ error: "Invalid subtotal." }, { status: 400 });
    }

    const store = await prisma.store.findUnique({
      where: { slug: storeSlug },
      select: { id: true, isActive: true, currency: true },
    });

    if (!store || !store.isActive) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const coupon = await prisma.coupon.findFirst({
      where: {
        storeId: store.id,
        code,
      },
    });

    if (!coupon) {
      return NextResponse.json({ valid: false, error: "Coupon not found." }, { status: 404 });
    }

    const discount = computeCouponDiscount({ coupon, subtotal });
    if (discount.discountAmount <= 0) {
      return NextResponse.json({ valid: false, error: discount.reason || "Coupon cannot be applied." }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
      discount,
      currency: store.currency,
    });
  } catch (error) {
    console.error("[STORE_COUPON_VALIDATE_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
