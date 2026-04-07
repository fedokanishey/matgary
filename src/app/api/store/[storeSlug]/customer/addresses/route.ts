import { NextRequest, NextResponse } from "next/server";
import { getStorefrontCustomer } from "@/lib/storefront-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const { store, customer } = await getStorefrontCustomer(storeSlug);

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    if (!customer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const addresses = await prisma.storeCustomerAddress.findMany({
      where: {
        storeId: store.id,
        customerId: customer.id,
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error("[CUSTOMER_ADDRESSES_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const { store, customer } = await getStorefrontCustomer(storeSlug);

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    if (!customer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const addressLine1 = String(body.addressLine1 || "").trim();

    if (!addressLine1) {
      return NextResponse.json({ error: "addressLine1 is required" }, { status: 400 });
    }

    const isDefault = Boolean(body.isDefault);

    const created = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.storeCustomerAddress.updateMany({
          where: {
            storeId: store.id,
            customerId: customer.id,
            isDefault: true,
          },
          data: { isDefault: false },
        });
      }

      return tx.storeCustomerAddress.create({
        data: {
          storeId: store.id,
          customerId: customer.id,
          label: body.label?.trim() || null,
          fullName: body.fullName?.trim() || null,
          phone: body.phone?.trim() || null,
          country: body.country?.trim() || null,
          city: body.city?.trim() || null,
          state: body.state?.trim() || null,
          addressLine1,
          addressLine2: body.addressLine2?.trim() || null,
          postalCode: body.postalCode?.trim() || null,
          isDefault,
        },
      });
    });

    return NextResponse.json({ success: true, address: created });
  } catch (error) {
    console.error("[CUSTOMER_ADDRESSES_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const { store, customer } = await getStorefrontCustomer(storeSlug);

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    if (!customer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const id = String(body.id || "").trim();

    if (!id) {
      return NextResponse.json({ error: "Address id is required" }, { status: 400 });
    }

    const existing = await prisma.storeCustomerAddress.findFirst({
      where: {
        id,
        storeId: store.id,
        customerId: customer.id,
      },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    const addressLine1 = String(body.addressLine1 || "").trim();
    if (!addressLine1) {
      return NextResponse.json({ error: "addressLine1 is required" }, { status: 400 });
    }

    const isDefault = Boolean(body.isDefault);

    const updated = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.storeCustomerAddress.updateMany({
          where: {
            storeId: store.id,
            customerId: customer.id,
            isDefault: true,
            id: { not: id },
          },
          data: { isDefault: false },
        });
      }

      return tx.storeCustomerAddress.update({
        where: { id },
        data: {
          label: body.label?.trim() || null,
          fullName: body.fullName?.trim() || null,
          phone: body.phone?.trim() || null,
          country: body.country?.trim() || null,
          city: body.city?.trim() || null,
          state: body.state?.trim() || null,
          addressLine1,
          addressLine2: body.addressLine2?.trim() || null,
          postalCode: body.postalCode?.trim() || null,
          isDefault,
        },
      });
    });

    return NextResponse.json({ success: true, address: updated });
  } catch (error) {
    console.error("[CUSTOMER_ADDRESSES_PUT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const { store, customer } = await getStorefrontCustomer(storeSlug);

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    if (!customer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get("id")?.trim();
    if (!id) {
      return NextResponse.json({ error: "Address id is required" }, { status: 400 });
    }

    const existing = await prisma.storeCustomerAddress.findFirst({
      where: {
        id,
        storeId: store.id,
        customerId: customer.id,
      },
      select: { id: true, isDefault: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    await prisma.storeCustomerAddress.delete({ where: { id } });

    if (existing.isDefault) {
      const nextAddress = await prisma.storeCustomerAddress.findFirst({
        where: {
          storeId: store.id,
          customerId: customer.id,
        },
        orderBy: { createdAt: "desc" },
      });

      if (nextAddress) {
        await prisma.storeCustomerAddress.update({
          where: { id: nextAddress.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CUSTOMER_ADDRESSES_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
