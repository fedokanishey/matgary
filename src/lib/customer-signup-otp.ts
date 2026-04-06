import crypto from "crypto";

export const CUSTOMER_SIGNUP_OTP_TTL_MINUTES = 5;
export const CUSTOMER_SIGNUP_OTP_MAX_ATTEMPTS = 5;

function getSignupOtpSecret() {
  return (
    process.env.CUSTOMER_SIGNUP_OTP_SECRET ||
    process.env.CUSTOMER_PASSWORD_RESET_SECRET ||
    process.env.JWT_SECRET ||
    "change-me-in-production"
  );
}

export function generateSignupOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getSignupOtpExpiryDate() {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + CUSTOMER_SIGNUP_OTP_TTL_MINUTES);
  return expiresAt;
}

export function hashSignupOtp(storeId: string, email: string, otp: string) {
  const secret = getSignupOtpSecret();
  return crypto
    .createHmac("sha256", secret)
    .update(`${storeId}:${email.trim().toLowerCase()}:${otp}`)
    .digest("hex");
}
