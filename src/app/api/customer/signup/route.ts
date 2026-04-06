import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { signCustomerAccessToken, signCustomerRefreshToken } from "@/lib/customer-auth";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    let body: {
      email?: string;
      password?: string;
      storeId?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request body." },
        { status: 400 }
      );
    }

    const { email, password, storeId, firstName, lastName, phone } = body;

    if (!email || !password || !storeId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (email, password, storeId)." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if customer exists in THIS store
    const existingCustomer = await prisma.storeCustomer.findFirst({
      where: { email: normalizedEmail, storeId },
    });

    if (existingCustomer) {
      return NextResponse.json(
        { success: false, error: "Email is already registered for this store." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const localClerkId = `local:${storeId}:${normalizedEmail}`;

    const customer = await prisma.storeCustomer.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        storeId,
        firstName,
        lastName,
        phone,
        clerkId: localClerkId,
      },
    });

    const payload = { customerId: customer.id, storeId: customer.storeId };
    const accessToken = await signCustomerAccessToken(payload);
    const refreshTokenExp = Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000);
    const refreshToken = await signCustomerRefreshToken({ ...payload, exp: refreshTokenExp });

    // Store refresh token in DB
    await prisma.customerRefreshToken.create({
      data: {
        token: refreshToken,
        expiresAt: new Date(refreshTokenExp * 1000),
        customerId: customer.id,
      },
    });

    const response = NextResponse.json({
      success: true,
      customer: { id: customer.id, email: customer.email, firstName: customer.firstName, lastName: customer.lastName },
    });

    response.cookies.set({
      name: "customer_access_token",
      value: accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60, // 15 mins
      path: "/",
    });

    response.cookies.set({
      name: "customer_refresh_token",
      value: refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Email is already registered for this store." },
        { status: 400 }
      );
    }

    console.error("[CUSTOMER_SIGNUP]", error);
    return NextResponse.json({ success: false, error: "Failed to sign up customer" }, { status: 500 });
  }
}
