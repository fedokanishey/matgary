import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCustomerToken } from "@/lib/customer-auth";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("customer_access_token")?.value;

    if (!accessToken) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const payload = await verifyCustomerToken(accessToken);

    const customer = await prisma.storeCustomer.findUnique({
      where: { id: payload.customerId, storeId: payload.storeId },
      select: { id: true, email: true, firstName: true, lastName: true, storeId: true, isActive: true, store: { select: { slug: true } } },
    });

    if (!customer || !customer.isActive) {
      return NextResponse.json({ success: false, error: "Customer not active or missing" }, { status: 401 });
    }

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    console.error("[CUSTOMER_ME]", error);
    return NextResponse.json({ success: false, error: "Not authenticated." }, { status: 401 });
  }
}
