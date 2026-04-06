import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyCustomerToken } from "@/lib/customer-auth";
import { cookies } from "next/headers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    
    const cookieStore = await cookies();
    const token = cookieStore.get("customer_access_token")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded: { customerId: string; storeId: string };
    try {
      const payload = await verifyCustomerToken(token);
      if (!payload.customerId || !payload.storeId) {
        return NextResponse.json({ error: "Invalid token payload" }, { status: 401 });
      }
      decoded = { customerId: payload.customerId, storeId: payload.storeId };
    } catch {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const store = await db.store.findUnique({
      where: { slug: storeSlug },
      select: { id: true },
    });

    if (!store || store.id !== decoded.storeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Cart Items
    const cartItems = await db.cartItem.findMany({
      where: { customerId: decoded.customerId },
      select: {
         id: true,
         productId: true,
         quantity: true,
      }
    });

    const productIds = cartItems.map(item => item.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true, images: true, store: { select: { currency: true } } }
    });

    const items = cartItems.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        id: item.productId,
        name: product?.name || "Unknown Product",
        price: product?.price || 0,
        image: product?.images?.[0] || "",
        quantity: item.quantity,
        currency: product?.store?.currency || "EGP",
      };
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("[CART_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    
    const cookieStore = await cookies();
    const token = cookieStore.get("customer_access_token")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded: { customerId: string; storeId: string };
    try {
      const payload = await verifyCustomerToken(token);
      if (!payload.customerId || !payload.storeId) {
        return NextResponse.json({ error: "Invalid token payload" }, { status: 401 });
      }
      decoded = { customerId: payload.customerId, storeId: payload.storeId };
    } catch {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const store = await db.store.findUnique({
      where: { slug: storeSlug },
      select: { id: true },
    });

    if (!store || store.id !== decoded.storeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { items } = body as { items: { id: string, quantity: number, name: string, price: number, image: string, currency: string }[] };

    if (!items || !Array.isArray(items)) {
        return NextResponse.json({ error: "Invalid array of items" }, { status: 400 });
    }

    // Sync CartItems
    // Delete existing and insert new
    await db.$transaction(async (tx) => {
        await tx.cartItem.deleteMany({
            where: { customerId: decoded.customerId },
        });

        if (items.length > 0) {
            await tx.cartItem.createMany({
                data: items.map(item => ({
                    productId: item.id,
                    quantity: item.quantity,
                    customerId: decoded.customerId,
                }))
            });
        }
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("[CART_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
