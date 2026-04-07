import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStorefrontCustomer } from "@/lib/storefront-auth";
import { computeCouponDiscount } from "@/lib/coupon";
import { generateOrderNumber, formatPrice } from "@/lib/utils";
import { sendPushToAll, type PushPayload } from "@/lib/push";

interface CheckoutItemInput {
  productId: string;
  quantity: number;
}

function sanitizeItems(items: unknown): CheckoutItemInput[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      const productId = typeof item?.productId === "string" ? item.productId.trim() : "";
      const quantity = Number(item?.quantity || 0);

      if (!productId || !Number.isInteger(quantity) || quantity <= 0) {
        return null;
      }

      return { productId, quantity };
    })
    .filter((item): item is CheckoutItemInput => item !== null);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const { store, customer } = await getStorefrontCustomer(storeSlug);

    if (!store || !store.isActive) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    if (!customer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const itemsInput = sanitizeItems(body.items);

    if (itemsInput.length === 0) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }

    const productIds = itemsInput.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        storeId: store.id,
        isArchived: false,
      },
      select: {
        id: true,
        name: true,
        price: true,
        inventory: true,
      },
    });

    if (products.length !== itemsInput.length) {
      return NextResponse.json({ error: "Some products are unavailable." }, { status: 400 });
    }

    let subtotal = 0;
    const normalizedItems = itemsInput.map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      if (!product) {
        return null;
      }

      if (product.inventory < item.quantity) {
        return {
          error: `Insufficient stock for ${product.name}.`,
        };
      }

      const total = product.price * item.quantity;
      subtotal += total;

      return {
        product,
        quantity: item.quantity,
        unitPrice: product.price,
        total,
      };
    });

    const stockError = normalizedItems.find((item) => item && "error" in item);
    if (stockError && "error" in stockError) {
      return NextResponse.json({ error: stockError.error }, { status: 400 });
    }

    const validItems = normalizedItems.filter(
      (item): item is { product: { id: string; name: string; price: number; inventory: number }; quantity: number; unitPrice: number; total: number } =>
        Boolean(item && !("error" in item))
    );

    if (validItems.length === 0) {
      return NextResponse.json({ error: "No valid items to checkout." }, { status: 400 });
    }

    const couponCode = typeof body.couponCode === "string" ? body.couponCode.trim().toUpperCase() : "";

    let coupon: { id: string; code: string } | null = null;
    let discountAmount = 0;

    if (couponCode) {
      const existingCoupon = await prisma.coupon.findFirst({
        where: {
          storeId: store.id,
          code: couponCode,
        },
      });

      if (!existingCoupon) {
        return NextResponse.json({ error: "Coupon not found." }, { status: 400 });
      }

      const discountResult = computeCouponDiscount({
        coupon: existingCoupon,
        subtotal,
      });

      if (discountResult.discountAmount <= 0) {
        return NextResponse.json({ error: discountResult.reason || "Coupon cannot be applied." }, { status: 400 });
      }

      discountAmount = discountResult.discountAmount;
      coupon = {
        id: existingCoupon.id,
        code: existingCoupon.code,
      };
    }

    const shippingAddressParts = [
      body.shippingAddress?.addressLine1,
      body.shippingAddress?.addressLine2,
      body.shippingAddress?.city,
      body.shippingAddress?.state,
      body.shippingAddress?.postalCode,
      body.shippingAddress?.country,
    ]
      .map((value: unknown) => (typeof value === "string" ? value.trim() : ""))
      .filter(Boolean);

    const shippingAddress = shippingAddressParts.length > 0 ? shippingAddressParts.join(", ") : null;
    const totalAmount = Number((subtotal - discountAmount).toFixed(2));

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          storeId: store.id,
          customerId: customer.id,
          customerName:
            body.customerName?.trim() ||
            [customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
            customer.email,
          customerEmail: customer.email,
          customerPhone: body.customerPhone?.trim() || customer.phone || null,
          shippingAddress,
          notes: typeof body.notes === "string" ? body.notes.trim() : null,
          discountAmount,
          couponId: coupon?.id || null,
          totalAmount,
          currency: store.currency,
          status: "PENDING",
          items: {
            create: validItems.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      for (const item of validItems) {
        await tx.product.update({
          where: { id: item.product.id },
          data: {
            inventory: {
              decrement: item.quantity,
            },
          },
        });
      }

      if (coupon) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: {
            usedCount: {
              increment: 1,
            },
          },
        });
      }

      await tx.cartItem.deleteMany({
        where: {
          customerId: customer.id,
          productId: {
            in: validItems.map((item) => item.product.id),
          },
        },
      });

      await tx.notification.create({
        data: {
          storeId: store.id,
          type: "NEW_ORDER",
          title: `New Order #${createdOrder.orderNumber}`,
          body: `${createdOrder.customerName} placed an order for ${formatPrice(createdOrder.totalAmount, store.currency)}`,
          data: {
            orderId: createdOrder.id,
            orderNumber: createdOrder.orderNumber,
          },
        },
      });

      return createdOrder;
    });

    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: store.userId,
      },
    });

    if (subscriptions.length > 0) {
      const payload: PushPayload = {
        title: `New Order #${order.orderNumber}`,
        body: `${order.customerName} ordered ${order.items.length} item(s) — ${formatPrice(order.totalAmount, store.currency)}`,
        icon: store.logoUrl || "/icons/icon-192x192.png",
        url: `/en/dashboard/orders/${order.id}`,
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
        },
      };

      await sendPushToAll(subscriptions, payload);
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        currency: store.currency,
        status: order.status,
      },
    });
  } catch (error) {
    console.error("[STORE_CHECKOUT_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
