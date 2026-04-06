import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetOtpEmail } from "@/lib/mailer";
import { generateOTP, getOtpExpiryDate, hashOtp } from "@/lib/customer-password-reset";
import { maintainCustomerOtpStorage } from "@/lib/customer-otp-maintenance";

const SUCCESS_MESSAGE = "OTP sent successfully. Please check your email.";

export async function POST(req: Request) {
  try {
    await maintainCustomerOtpStorage();

    const body = await req.json();
    const { email, storeId } = body;

    if (!email || !storeId) {
      return NextResponse.json(
        { success: false, error: "Missing email or storeId." },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const customer = await prisma.storeCustomer.findUnique({
      where: {
        storeId_email: {
          storeId,
          email: normalizedEmail,
        },
      },
      select: {
        id: true,
        email: true,
        store: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Email is not registered for this store." },
        { status: 404 }
      );
    }

    const otp = generateOTP();
    const otpHash = hashOtp(customer.id, storeId, otp);
    const expiresAt = getOtpExpiryDate();

    await prisma.$transaction(async (tx) => {
      await tx.customerPasswordOtp.deleteMany({
        where: {
          customerId: customer.id,
          storeId,
        },
      });

      await tx.customerPasswordOtp.create({
        data: {
          customerId: customer.id,
          storeId,
          email: normalizedEmail,
          otpHash,
          expiresAt,
          resetTokenHash: null,
          verifiedAt: null,
          usedAt: null,
        },
      });
    });

    try {
      await sendPasswordResetOtpEmail({
        to: customer.email,
        otp,
        storeName: customer.store?.name,
      });
    } catch (mailError) {
      const isSmtpConfigIssue =
        mailError instanceof Error &&
        mailError.message.includes("SMTP configuration is missing");

      if (process.env.NODE_ENV !== "production" && isSmtpConfigIssue) {
        console.warn("[FORGOT_PASSWORD] SMTP is not configured; returning OTP for local development only.");
        return NextResponse.json({
          success: true,
          message: "DEV MODE: SMTP is not configured, so no email was sent. Use the OTP below for local testing.",
          devOtp: otp,
          devEmailDisabled: true,
        });
      }

      throw mailError;
    }

    return NextResponse.json({ success: true, message: SUCCESS_MESSAGE });
  } catch (error) {
    console.error("[FORGOT_PASSWORD]", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request." },
      { status: 500 }
    );
  }
}