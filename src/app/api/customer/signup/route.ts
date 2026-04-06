import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { sendSignupOtpEmail } from "@/lib/mailer";
import {
  generateSignupOtp,
  getSignupOtpExpiryDate,
  hashSignupOtp,
} from "@/lib/customer-signup-otp";
import { maintainCustomerOtpStorage } from "@/lib/customer-otp-maintenance";

const SUCCESS_MESSAGE = "OTP sent successfully. Please check your email to complete signup.";

type SignupOtpWriteDelegate = {
  deleteMany: (args: { where: { storeId: string; email: string } }) => Promise<unknown>;
  create: (args: {
    data: {
      storeId: string;
      email: string;
      otpHash: string;
      passwordHash: string;
      firstName: string | null;
      lastName: string | null;
      phone: string | null;
      expiresAt: Date;
      usedAt: null;
    };
  }) => Promise<unknown>;
};

export async function POST(req: Request) {
  try {
    await maintainCustomerOtpStorage();

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

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, name: true, isActive: true },
    });

    if (!store || !store.isActive) {
      return NextResponse.json(
        { success: false, error: "Store not found." },
        { status: 404 }
      );
    }

    // Check if customer already exists in THIS store.
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

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = generateSignupOtp();
    const otpHash = hashSignupOtp(storeId, normalizedEmail, otp);
    const expiresAt = getSignupOtpExpiryDate();

    await prisma.$transaction(async (tx) => {
      const otpTx = (
        tx as unknown as { customerSignupOtp: SignupOtpWriteDelegate }
      ).customerSignupOtp;

      await otpTx.deleteMany({
        where: {
          storeId,
          email: normalizedEmail,
        },
      });

      await otpTx.create({
        data: {
          storeId,
          email: normalizedEmail,
          otpHash,
          passwordHash,
          firstName: firstName?.trim() || null,
          lastName: lastName?.trim() || null,
          phone: phone?.trim() || null,
          expiresAt,
          usedAt: null,
        },
      });
    });

    try {
      await sendSignupOtpEmail({
        to: normalizedEmail,
        otp,
        storeName: store.name,
      });
    } catch (mailError) {
      const isSmtpConfigIssue =
        mailError instanceof Error &&
        mailError.message.includes("SMTP configuration is missing");

      if (process.env.NODE_ENV !== "production" && isSmtpConfigIssue) {
        return NextResponse.json({
          success: true,
          requiresOtp: true,
          message: "DEV MODE: SMTP is not configured, so no email was sent. Use the OTP below for local testing.",
          devOtp: otp,
          devEmailDisabled: true,
        });
      }

      throw mailError;
    }

    return NextResponse.json({
      success: true,
      requiresOtp: true,
      message: SUCCESS_MESSAGE,
    });
  } catch (error) {

    console.error("[CUSTOMER_SIGNUP]", error);
    return NextResponse.json({ success: false, error: "Failed to sign up customer" }, { status: 500 });
  }
}
