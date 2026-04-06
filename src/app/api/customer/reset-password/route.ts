import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { hashResetToken } from "@/lib/customer-password-reset";
import { maintainCustomerOtpStorage } from "@/lib/customer-otp-maintenance";

const INVALID_REQUEST_MESSAGE = "Invalid or expired reset session.";

export async function POST(req: Request) {
  try {
    await maintainCustomerOtpStorage();

    const body = await req.json();
    const { email, storeId, resetToken, newPassword } = body as {
      email?: string;
      storeId?: string;
      resetToken?: string;
      newPassword?: string;
    };

    if (!email || !storeId || !resetToken || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Missing required fields." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters." },
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
        { success: false, error: INVALID_REQUEST_MESSAGE },
        { status: 400 }
      );
    }

    const otpRecord = await prisma.customerPasswordOtp.findFirst({
      where: {
        customerId: customer.id,
        storeId,
        email: normalizedEmail,
        OR: [{ usedAt: null }, { usedAt: { isSet: false } }],
        verifiedAt: {
          not: null,
        },
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        verifiedAt: "desc",
      },
    });

    if (!otpRecord || !otpRecord.resetTokenHash) {
      return NextResponse.json(
        { success: false, error: INVALID_REQUEST_MESSAGE },
        { status: 400 }
      );
    }

    const incomingResetTokenHash = hashResetToken(customer.id, storeId, resetToken);

    if (incomingResetTokenHash !== otpRecord.resetTokenHash) {
      return NextResponse.json(
        { success: false, error: INVALID_REQUEST_MESSAGE },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction(async (tx) => {
      await tx.storeCustomer.update({
        where: { id: customer.id },
        data: {
          passwordHash,
        },
      });

      await tx.customerPasswordOtp.update({
        where: { id: otpRecord.id },
        data: {
          usedAt: new Date(),
        },
      });

      await tx.customerRefreshToken.deleteMany({
        where: {
          customerId: customer.id,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successful.",
    });
  } catch (error) {
    console.error("[RESET_PASSWORD]", error);
    return NextResponse.json(
      { success: false, error: "Failed to reset password." },
      { status: 500 }
    );
  }
}
