import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Fake Forgot Password Route
// In a real application, you would generate a JWT/UUID, save it in the DB, and send an email via SendGrid/Resend
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, storeId } = body;

    if (!email || !storeId) {
      return NextResponse.json({ success: false, error: "Missing email or storeId" }, { status: 400 });
    }

    const customer = await prisma.storeCustomer.findUnique({
      where: {
        storeId_email: {
          storeId,
          email,
        }
      }
    });

    if (!customer) {
      // Don't leak if customer exists
      return NextResponse.json({ success: true, message: "If this email is registered, a link has been sent." });
    }

    // TODO: Send email here.
    console.log(`[FORGOT_PASSWORD] Fake email sent to ${email} for store ${storeId}`);

    return NextResponse.json({ success: true, message: "If this email is registered, a link has been sent." });
  } catch (error) {
    console.error("[FORGOT_PASSWORD]", error);
    return NextResponse.json({ success: false, error: "Failed to process request." }, { status: 500 });
  }
}