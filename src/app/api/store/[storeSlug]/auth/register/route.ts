import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;
    const body = await request.json();
    const { email, password, firstName, lastName, phone } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Find the store
    const store = await db.store.findUnique({
      where: { slug: storeSlug },
      select: { id: true, isActive: true },
    });

    if (!store || !store.isActive) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      );
    }

    // Check if customer already exists
    const existingCustomer = await db.storeCustomer.findUnique({
      where: {
        storeId_email: {
          storeId: store.id,
          email: email.toLowerCase(),
        },
      },
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create customer
    const customer = await db.storeCustomer.create({
      data: {
        storeId: store.id,
        email: email.toLowerCase(),
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
        phone: phone || null,
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        customerId: customer.id,
        storeId: store.id,
        email: customer.email,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return customer data
    return NextResponse.json({
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
              },
      token,
    });
  } catch (error) {
    console.error("[CUSTOMER_REGISTER]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

