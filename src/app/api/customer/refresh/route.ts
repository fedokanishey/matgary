import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signCustomerAccessToken, verifyCustomerToken } from "@/lib/customer-auth";
import { cookies } from "next/headers";

export async function POST() {
  try {
    // Using standard next/server cookies:
    const cookieStore = await cookies();
    const token = cookieStore.get("customer_refresh_token")?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: "No refresh token provided." }, { status: 401 });
    }

    try {
      const payload = await verifyCustomerToken(token);

      if (!payload.customerId || !payload.storeId) {
        return NextResponse.json({ success: false, error: "Invalid token payload." }, { status: 401 });
      }

      // Check DB for refresh token blacklisting/existence
      const dbToken = await prisma.customerRefreshToken.findUnique({
        where: { token },
      });

      if (!dbToken || dbToken.expiresAt < new Date()) {
        if (dbToken && dbToken.expiresAt < new Date()) {
          // Token expired, delete
          await prisma.customerRefreshToken.delete({ where: { id: dbToken.id } });
        }
        return NextResponse.json({ success: false, error: "Refresh token invalid or expired." }, { status: 401 });
      }

      // Found valid token, issue new access token.
      const accessToken = await signCustomerAccessToken({ customerId: payload.customerId, storeId: payload.storeId });

      const response = NextResponse.json({ success: true });
      response.cookies.set({
        name: "customer_access_token",
        value: accessToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 15 * 60, // 15 mins
        path: "/",
      });

      // Optionally rotate refresh token as well, omit for now for simplicity
      return response;

    } catch {
      return NextResponse.json({ success: false, error: "Invalid token verification." }, { status: 401 });
    }

  } catch (error) {
    console.error("[CUSTOMER_REFRESH]", error);
    return NextResponse.json({ success: false, error: "Failed to refresh token." }, { status: 500 });
  }
}
