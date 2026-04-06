import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("customer_refresh_token")?.value;

    if (token) {
      // Invalidate refresh token in DB
      await prisma.customerRefreshToken.deleteMany({
        where: { token },
      });
    }

    const response = NextResponse.json({ success: true });

    // Clear access and refresh cookies
    response.cookies.delete("customer_access_token");
    response.cookies.delete("customer_refresh_token");

    return response;
  } catch (error) {
    console.error("[CUSTOMER_LOGOUT]", error);
    return NextResponse.json({ success: false, error: "Failed to logout." }, { status: 500 });
  }
}
