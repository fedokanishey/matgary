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

    // Get Customer wishlist
    const customer = await db.storeCustomer.findUnique({
      where: { id: decoded.customerId },
      select: { wishlist: true }
    });

    return NextResponse.json({ favorites: customer?.wishlist || [] });

  } catch (error) {
    console.error("[FAVORITES_GET]", error);
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
    const { productId, action } = body as { productId: string; action: 'add' | 'remove' };

    if (!productId || (action !== 'add' && action !== 'remove')) {
       return NextResponse.json({ error: "Invalid body. Need productId and action ('add' | 'remove')" }, { status: 400 });
    }

    const customer = await db.storeCustomer.findUnique({
        where: { id: decoded.customerId },
        select: { wishlist: true }
    });

    let newWishlist = customer?.wishlist || [];

    if (action === 'add') {
        if (!newWishlist.includes(productId)) {
            newWishlist.push(productId);
        }
    } else if (action === 'remove') {
        newWishlist = newWishlist.filter(id => id !== productId);
    }

    const updatedCustomer = await db.storeCustomer.update({
        where: { id: decoded.customerId },
        data: { wishlist: newWishlist },
        select: { wishlist: true }
    });

    return NextResponse.json({ favorites: updatedCustomer.wishlist });

  } catch (error) {
    console.error("[FAVORITES_POST]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
