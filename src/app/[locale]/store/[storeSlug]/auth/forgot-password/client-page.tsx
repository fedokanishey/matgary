"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Step = "identify" | "verify" | "reset" | "done";

export default function StoreClientForgotPassword({
  storeId,
  storeSlug,
  locale,
}: {
  storeId: string;
  storeSlug: string;
  locale: string;
}) {
  const isAr = locale === "ar";

  const [step, setStep] = useState<Step>("identify");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const title = useMemo(() => {
    if (step === "identify") return isAr ? "نسيت كلمة المرور" : "Forgot Password";
    if (step === "verify") return isAr ? "تحقق من الكود" : "Verify OTP";
    if (step === "reset") return isAr ? "إعادة تعيين كلمة المرور" : "Reset Password";
    return isAr ? "تم التغيير بنجاح" : "Password Updated";
  }, [isAr, step]);

  const clearFeedback = () => {
    setError("");
    setMessage("");
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    setLoading(true);

    try {
      const res = await fetch("/api/customer/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, storeId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || (isAr ? "تعذر إرسال الكود الآن." : "Unable to send OTP right now."));
        return;
      }

      const devOtpMessage =
        data.devOtp && process.env.NODE_ENV !== "production"
          ? isAr
            ? ` وضع التطوير: لم يتم إرسال إيميل. كود التحقق هو ${data.devOtp}`
            : ` Development mode: email not sent. OTP is ${data.devOtp}`
          : "";

      setMessage(
        data.message ||
          (isAr
            ? "لو الحساب موجود، تم إرسال كود مكوّن من 6 أرقام إلى بريدك."
            : "If an account exists, a 6-digit OTP was sent to your email.")
      );
      if (devOtpMessage) {
        setMessage((prev) => `${prev}${devOtpMessage}`);
      }
      setStep("verify");
    } catch {
      setError(isAr ? "فشل الاتصال بالخادم." : "Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();
    setLoading(true);

    try {
      const res = await fetch("/api/customer/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, storeId, otp }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || (isAr ? "الكود غير صحيح أو منتهي." : "Invalid or expired OTP."));
        return;
      }

      setResetToken(data.resetToken as string);
      setMessage(isAr ? "تم التحقق. يمكنك الآن إدخال كلمة مرور جديدة." : "OTP verified. You can now set a new password.");
      setStep("reset");
    } catch {
      setError(isAr ? "فشل الاتصال بالخادم." : "Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFeedback();

    if (newPassword !== confirmPassword) {
      setError(isAr ? "كلمتا المرور غير متطابقتين." : "Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError(isAr ? "يجب أن تكون كلمة المرور 6 أحرف على الأقل." : "Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/customer/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          storeId,
          resetToken,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || (isAr ? "تعذر تحديث كلمة المرور." : "Unable to reset password."));
        return;
      }

      setStep("done");
      setMessage(isAr ? "تم تغيير كلمة المرور بنجاح." : "Your password has been reset successfully.");
    } catch {
      setError(isAr ? "فشل الاتصال بالخادم." : "Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-[70vh] flex flex-col items-center justify-center p-4 py-12 bg-gray-50/50"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-md w-full">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-500 text-sm">
            {step === "identify" &&
              (isAr
                ? "أدخل بريدك الإلكتروني لإرسال كود التحقق."
                : "Enter your email to receive a verification OTP.")}
            {step === "verify" &&
              (isAr
                ? "أدخل كود التحقق المكوّن من 6 أرقام."
                : "Enter the 6-digit OTP sent to your email.")}
            {step === "reset" &&
              (isAr
                ? "أدخل كلمة المرور الجديدة ثم أكدها."
                : "Set your new password and confirm it.")}
            {step === "done" &&
              (isAr
                ? "يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة."
                : "You can now sign in with your new password.")}
          </p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">{error}</div>}
        {message && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm text-center">{message}</div>
        )}

        {step === "identify" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label htmlFor="forgot-email" className="block text-sm font-medium mb-1 text-gray-700">
                {isAr ? "البريد الإلكتروني" : "Email Address"}
              </label>
              <input
                id="forgot-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-(--primary) outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-(--primary) text-white font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading
                ? isAr
                  ? "جارٍ إرسال الكود..."
                  : "Sending OTP..."
                : isAr
                  ? "إرسال الكود"
                  : "Send OTP"}
            </button>
          </form>
        )}

        {step === "verify" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label htmlFor="forgot-otp" className="block text-sm font-medium mb-1 text-gray-700">
                {isAr ? "كود التحقق" : "OTP"}
              </label>
              <input
                id="forgot-otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-(--primary) outline-none transition-all tracking-[0.35em] text-center"
                placeholder="123456"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-(--primary) text-white font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading
                ? isAr
                  ? "جارٍ التحقق..."
                  : "Verifying..."
                : isAr
                  ? "تحقق"
                  : "Verify OTP"}
            </button>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="forgot-new-password" className="block text-sm font-medium mb-1 text-gray-700">
                {isAr ? "كلمة المرور الجديدة" : "New Password"}
              </label>
              <div className="relative">
                <input
                  id="forgot-new-password"
                  type={showNewPassword ? "text" : "password"}
                  minLength={6}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-(--primary) outline-none transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 ${isAr ? "left-3" : "right-3"}`}
                  aria-label={isAr ? "إظهار أو إخفاء كلمة المرور الجديدة" : "Toggle new password visibility"}
                >
                  {showNewPassword ? (
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3l18 18M9.9 9.9l4.2 4.2" />
                    </svg>
                  ) : (
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="forgot-confirm-password" className="block text-sm font-medium mb-1 text-gray-700">
                {isAr ? "تأكيد كلمة المرور" : "Confirm Password"}
              </label>
              <div className="relative">
                <input
                  id="forgot-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  minLength={6}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-(--primary) outline-none transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 ${isAr ? "left-3" : "right-3"}`}
                  aria-label={isAr ? "إظهار أو إخفاء تأكيد كلمة المرور" : "Toggle confirm password visibility"}
                >
                  {showConfirmPassword ? (
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3l18 18M9.9 9.9l4.2 4.2" />
                    </svg>
                  ) : (
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-(--primary) text-white font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading
                ? isAr
                  ? "جارٍ التحديث..."
                  : "Updating..."
                : isAr
                  ? "تحديث كلمة المرور"
                  : "Reset Password"}
            </button>
          </form>
        )}

        {step === "done" && (
          <Link
            href={`/${locale}/store/${storeSlug}/auth/login`}
            className="w-full inline-flex justify-center bg-(--primary) text-white font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity"
          >
            {isAr ? "الذهاب إلى تسجيل الدخول" : "Go to Sign In"}
          </Link>
        )}

        <p className="mt-6 text-center text-sm text-gray-600">
          <Link
            href={`/${locale}/store/${storeSlug}/auth/login`}
            className="text-(--primary) font-medium hover:underline"
          >
            {isAr ? "العودة لتسجيل الدخول" : "Back to Sign In"}
          </Link>
        </p>
      </div>
    </div>
  );
}
