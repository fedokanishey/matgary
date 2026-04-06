import nodemailer from "nodemailer";

interface PasswordResetOtpEmailInput {
  to: string;
  otp: string;
  storeName?: string;
}

interface SignupOtpEmailInput {
  to: string;
  otp: string;
  storeName?: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const provider = (process.env.SMTP_PROVIDER || "").trim().toLowerCase();

  const defaultHost =
    provider === "gmail"
      ? "smtp.gmail.com"
      : provider === "brevo"
        ? "smtp-relay.brevo.com"
        : undefined;

  const host = process.env.SMTP_HOST || defaultHost;
  const defaultPort = provider === "gmail" ? 465 : 587;
  const port = Number(process.env.SMTP_PORT || String(defaultPort));
  const secure = String(process.env.SMTP_SECURE || (port === 465 ? "true" : "false")) === "true";

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP configuration is missing. Set SMTP_USER, SMTP_PASS, and either SMTP_HOST or SMTP_PROVIDER (gmail|brevo)."
    );
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  return transporter;
}

export async function sendPasswordResetOtpEmail({
  to,
  otp,
  storeName,
}: PasswordResetOtpEmailInput) {
  const mailer = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!from) {
    throw new Error("SMTP_FROM or SMTP_USER is required to send reset emails.");
  }

  const title = "Your Password Reset Code";
  const displayStoreName = storeName || "our store";

  await mailer.sendMail({
    from,
    to,
    subject: `${title} - ${displayStoreName}`,
    text: `Use this OTP to reset your password: ${otp}. This code expires in 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin: 0 0 12px;">Password Reset OTP</h2>
        <p>You requested a password reset for <strong>${displayStoreName}</strong>.</p>
        <p>Your OTP code is:</p>
        <div style="font-size: 28px; font-weight: 700; letter-spacing: 4px; margin: 12px 0;">${otp}</div>
        <p>This code expires in 5 minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
}

export async function sendSignupOtpEmail({ to, otp, storeName }: SignupOtpEmailInput) {
  const mailer = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  if (!from) {
    throw new Error("SMTP_FROM or SMTP_USER is required to send signup OTP emails.");
  }

  const title = "Your Signup Verification Code";
  const displayStoreName = storeName || "our store";

  await mailer.sendMail({
    from,
    to,
    subject: `${title} - ${displayStoreName}`,
    text: `Use this OTP to complete signup: ${otp}. This code expires in 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin: 0 0 12px;">Signup Verification OTP</h2>
        <p>You are creating an account for <strong>${displayStoreName}</strong>.</p>
        <p>Your verification OTP is:</p>
        <div style="font-size: 28px; font-weight: 700; letter-spacing: 4px; margin: 12px 0;">${otp}</div>
        <p>This code expires in 5 minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });
}
