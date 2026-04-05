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
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
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

    // Find the customer
    const customer = await db.storeCustomer.findUnique({
      where: {
        storeId_email: {
          storeId: store.id,
          email: email.toLowerCase(),
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, customer.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

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

    // Return customer data (without password)
    return NextResponse.json({
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        avatarUrl: customer.avatarUrl,
      },
      token,
    });
  } catch (error) {
    console.error("[CUSTOMER_LOGIN]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
