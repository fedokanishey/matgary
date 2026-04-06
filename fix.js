const fs = require('fs');

const code = `"use client";

import { useState } from "react";
import Link from "next/link";

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
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(\`/api/customer/forgot-password\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, storeId }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setSuccess(true);
      } else {
        setError(data.error || (isAr ? "حدث خطأ، يرجى المحاولة لاحقاً" : "An error occurred, please try again."));
      }
    } catch {
      setError(isAr ? "فشل الاتصال بالخادم." : "Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 py-12 bg-gray-50/50" dir={isAr ? "rtl" : "ltr"}>
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-md w-full">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isAr ? "نسيت كلمة المرور؟" : "Forgot Password?"}
          </h1>
          <p className="text-gray-500 text-sm">
            {isAr
              ? "أدخل بريدك الإلكتروني لكي نرسل لك رابطاً لاستعادة كلمة المرور."
              : "Enter your email address and we'll send you a link to reset your password."}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {success ? (
          <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg text-sm text-center">
            {isAr 
              ? "تم إرسال رابط تعيين كلمة المرور بنجاح. يرجى مراجعة صندوق الوارد." 
              : "A password reset link has been sent to your email. Please check your inbox."}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                {isAr ? "البريد الإلكتروني" : "Email Address"}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--primary)] text-white font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? (isAr ? "جاري الإرسال..." : "Sending...") : (isAr ? "إرسال الرابط" : "Send Reset Link")}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-600">
          <Link
            href={\`/\${locale}/store/\${storeSlug}/auth/login\`}
            className="text-[var(--primary)] font-medium hover:underline"
          >
            {isAr ? "العودة لتسجيل الدخول" : "Back to Sign In"}
          </Link>
        </p>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/app/[locale]/store/[storeSlug]/auth/forgot-password/client-page.tsx', code, 'utf8');
console.log('Fixed');