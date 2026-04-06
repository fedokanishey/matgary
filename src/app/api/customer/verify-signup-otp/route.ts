import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { signCustomerAccessToken, signCustomerRefreshToken } from "@/lib/customer-auth";
import {
  CUSTOMER_SIGNUP_OTP_MAX_ATTEMPTS,
  hashSignupOtp,
} from "@/lib/customer-signup-otp";
import { maintainCustomerOtpStorage } from "@/lib/customer-otp-maintenance";

const INVALID_OTP_MESSAGE = "Invalid or expired OTP.";

type SignupOtpRecord = {
  id: string;
  otpHash: string;
  passwordHash: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  attempts: number;
};

type SignupOtpDelegate = {
  findFirst: (args: unknown) => Promise<SignupOtpRecord | null>;
  update: (args: { where: { id: string }; data: unknown }) => Promise<unknown>;
};

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

    const existingCustomer = await prisma.storeCustomer.findUnique({
      where: {
        storeId_email: {
          storeId,
          email: normalizedEmail,
        },
      },
      select: { id: true },
    });

    if (existingCustomer) {
      return NextResponse.json(
        { success: false, error: "Email is already registered for this store." },
        { status: 400 }
      );
    }

    const otpModel = (
      prisma as unknown as { customerSignupOtp: SignupOtpDelegate }
    ).customerSignupOtp;

    const otpRecord = await otpModel.findFirst({
      where: {
        storeId,
        email: normalizedEmail,
        OR: [{ usedAt: null }, { usedAt: { isSet: false } }],
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpRecord || otpRecord.attempts >= CUSTOMER_SIGNUP_OTP_MAX_ATTEMPTS) {
      return NextResponse.json(
        { success: false, error: INVALID_OTP_MESSAGE },
        { status: 400 }
      );
    }

    const incomingOtpHash = hashSignupOtp(storeId, normalizedEmail, otp);

    if (incomingOtpHash !== otpRecord.otpHash) {
      await otpModel.update({
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

    const customer = await prisma.$transaction(async (tx) => {
      const otpTx = (
        tx as unknown as { customerSignupOtp: SignupOtpDelegate }
      ).customerSignupOtp;

      const createdCustomer = await tx.storeCustomer.create({
        data: {
          storeId,
          email: normalizedEmail,
          passwordHash: otpRecord.passwordHash,
          firstName: otpRecord.firstName,
          lastName: otpRecord.lastName,
          phone: otpRecord.phone,
        },
      });

      await otpTx.update({
        where: { id: otpRecord.id },
        data: {
          usedAt: new Date(),
        },
      });

      return createdCustomer;
    });

    const payload = { customerId: customer.id, storeId: customer.storeId };
    const accessToken = await signCustomerAccessToken(payload);
    const refreshTokenExp = Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000);
    const refreshToken = await signCustomerRefreshToken({ ...payload, exp: refreshTokenExp });

    await prisma.customerRefreshToken.create({
      data: {
        token: refreshToken,
        expiresAt: new Date(refreshTokenExp * 1000),
        customerId: customer.id,
      },
    });

    const response = NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
      },
    });

    response.cookies.set({
      name: "customer_access_token",
      value: accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60,
      path: "/",
    });

    response.cookies.set({
      name: "customer_refresh_token",
      value: refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
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

    console.error("[VERIFY_SIGNUP_OTP]", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify signup OTP." },
      { status: 500 }
    );
  }
}
