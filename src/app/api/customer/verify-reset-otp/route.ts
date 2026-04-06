import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { maintainCustomerOtpStorage } from "@/lib/customer-otp-maintenance";
import {
  PASSWORD_RESET_MAX_ATTEMPTS,
  generateResetToken,
  hashOtp,
  hashResetToken,
} from "@/lib/customer-password-reset";

const INVALID_OTP_MESSAGE = "Invalid or expired OTP.";

export async function POST(req: Request) {
  try {
    await maintainCustomerOtpStorage();

    const body = await req.json();
    const { email, storeId, otp } = body as {
      email?: string;
      storeId?: string;
      otp?: string;
    };

    if (!email || !storeId || !otp) {
      return NextResponse.json(
        { success: false, error: "Missing email, storeId, or otp." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const customer = await prisma.storeCustomer.findUnique({
      where: {
        storeId_email: {
          storeId,
          email: normalizedEmail,
        },
      },
      select: { id: true },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: INVALID_OTP_MESSAGE },
        { status: 400 }
      );
    }

    const otpRecord = await prisma.customerPasswordOtp.findFirst({
      where: {
        customerId: customer.id,
        storeId,
        email: normalizedEmail,
        OR: [{ usedAt: null }, { usedAt: { isSet: false } }],
        AND: [{ OR: [{ verifiedAt: null }, { verifiedAt: { isSet: false } }] }],
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpRecord || otpRecord.attempts >= PASSWORD_RESET_MAX_ATTEMPTS) {
      return NextResponse.json(
        { success: false, error: INVALID_OTP_MESSAGE },
        { status: 400 }
      );
    }

    const incomingOtpHash = hashOtp(customer.id, storeId, otp);

    if (incomingOtpHash !== otpRecord.otpHash) {
      await prisma.customerPasswordOtp.update({
        where: { id: otpRecord.id },
        data: {
          attempts: {
            increment: 1,
          },
        },
      });

      return NextResponse.json(
        { success: false, error: INVALID_OTP_MESSAGE },
        { status: 400 }
      );
    }

    const resetToken = generateResetToken();
    const resetTokenHash = hashResetToken(customer.id, storeId, resetToken);

    await prisma.customerPasswordOtp.update({
      where: { id: otpRecord.id },
      data: {
        verifiedAt: new Date(),
        resetTokenHash,
      },
    });

    return NextResponse.json({
      success: true,
      resetToken,
      message: "OTP verified successfully.",
    });
  } catch (error) {
    console.error("[VERIFY_RESET_OTP]", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify OTP." },
      { status: 500 }
    );
  }
}
