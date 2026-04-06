import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { signCustomerAccessToken, signCustomerRefreshToken } from "@/lib/customer-auth";

export async function POST(req: Request) {
  try {
    const { email, password, storeId, rememberMe = true } = await req.json();

    if (!email || !password || !storeId) {
      return NextResponse.json(
        { success: false, error: "Missing email, password, or storeId." },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Must map email to the specified storeId!
    const customer = await prisma.storeCustomer.findUnique({
      where: {
        storeId_email: { email: normalizedEmail, storeId },
      },
    });

    if (!customer || !customer.passwordHash) {
      return NextResponse.json({ success: false, error: "Invalid email or password." }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, customer.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ success: false, error: "Invalid email or password." }, { status: 401 });
    }

    const payload = { customerId: customer.id, storeId: customer.storeId };
    
    // Default expiration: 15 minutes for Access Token
    const accessToken = await signCustomerAccessToken(payload);
    
    // Remember me config: Yes = 30 days, No = 7 days for Refresh Token
    const days = rememberMe ? 30 : 7;
    const exp = Math.floor((Date.now() + days * 24 * 60 * 60 * 1000) / 1000);
    const refreshToken = await signCustomerRefreshToken({ ...payload, exp });

    // Save refresh token to db
    await prisma.customerRefreshToken.create({
      data: {
        token: refreshToken,
        expiresAt: new Date(exp * 1000),
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
      maxAge: days * 24 * 60 * 60, // days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[CUSTOMER_LOGIN]", error instanceof Error ? error.stack : error);
    return NextResponse.json({ success: false, error: "Failed to login." }, { status: 500 });
  }
}
