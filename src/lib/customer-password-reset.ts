import crypto from "crypto";

export const PASSWORD_RESET_OTP_TTL_MINUTES = 5;
export const PASSWORD_RESET_MAX_ATTEMPTS = 5;

function getPasswordResetSecret() {
  return (
    process.env.CUSTOMER_PASSWORD_RESET_SECRET ||
    process.env.JWT_SECRET ||
    "change-me-in-production"
  );
}

export const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

export function getOtpExpiryDate() {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + PASSWORD_RESET_OTP_TTL_MINUTES);
  return expiresAt;
}

export function hashOtp(customerId: string, storeId: string, otp: string) {
  const secret = getPasswordResetSecret();
  return crypto
    .createHmac("sha256", secret)
    .update(`${customerId}:${storeId}:${otp}`)
    .digest("hex");
}

export function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashResetToken(customerId: string, storeId: string, resetToken: string) {
  const secret = getPasswordResetSecret();
  return crypto
    .createHmac("sha256", secret)
    .update(`${customerId}:${storeId}:${resetToken}`)
    .digest("hex");
}
