import type { Coupon } from "@prisma/client";

export interface CouponDiscountResult {
  discountAmount: number;
  finalAmount: number;
  reason?: string;
}

export function computeCouponDiscount(params: {
  coupon: Coupon;
  subtotal: number;
}): CouponDiscountResult {
  const { coupon, subtotal } = params;

  if (!coupon.isActive) {
    return { discountAmount: 0, finalAmount: subtotal, reason: "Coupon is inactive." };
  }

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    return { discountAmount: 0, finalAmount: subtotal, reason: "Coupon is not active yet." };
  }

  if (coupon.endsAt && coupon.endsAt < now) {
    return { discountAmount: 0, finalAmount: subtotal, reason: "Coupon has expired." };
  }

  if (coupon.usageLimit !== null && coupon.usageLimit !== undefined && coupon.usedCount >= coupon.usageLimit) {
    return { discountAmount: 0, finalAmount: subtotal, reason: "Coupon usage limit reached." };
  }

  if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
    return {
      discountAmount: 0,
      finalAmount: subtotal,
      reason: `Minimum order amount is ${coupon.minOrderAmount.toFixed(2)}.`,
    };
  }

  let discountAmount = 0;
  if (coupon.discountType === "PERCENTAGE") {
    discountAmount = subtotal * (coupon.discountValue / 100);
  } else {
    discountAmount = coupon.discountValue;
  }

  if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
    discountAmount = coupon.maxDiscountAmount;
  }

  if (discountAmount > subtotal) {
    discountAmount = subtotal;
  }

  const finalAmount = Math.max(0, subtotal - discountAmount);
  return { discountAmount, finalAmount };
}
