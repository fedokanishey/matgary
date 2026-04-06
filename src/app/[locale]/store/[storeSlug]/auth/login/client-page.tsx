"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import Link from "next/link";

export default function StoreClientLogin({
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
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const rememberedEmailKey = useMemo(
    () => `customer_remember_email_${storeSlug}`,
    [storeSlug]
  );

  const { login } = useCustomerAuth(storeId, storeSlug);

  useEffect(() => {
    try {
      const rememberedEmail = localStorage.getItem(rememberedEmailKey);
      if (rememberedEmail) {
        setEmail(rememberedEmail);
        setRememberMe(true);
      }
    } catch {
      // Ignore localStorage access errors.
    }
  }, [rememberedEmailKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await login({ email, password, rememberMe });
      if (res.success) {
        try {
          if (rememberMe) {
            localStorage.setItem(rememberedEmailKey, email.trim().toLowerCase());
          } else {
            localStorage.removeItem(rememberedEmailKey);
          }
        } catch {
          // Ignore localStorage access errors.
        }

        const destination = `/store/${storeSlug}`;

        // Prefer client-side navigation for a smooth UX.
        router.replace(destination);
        router.refresh();

        // Fallback for production edge cases where client navigation stalls.
        window.setTimeout(() => {
          if (window.location.pathname.includes(`/store/${storeSlug}/auth/login`)) {
            window.location.assign(destination);
          }
        }, 1200);

        return;
      }

      setError(res.error || (isAr ? "حدث خطأ أثناء تسجيل الدخول" : "An error occurred during sign in"));
    } catch {
      setError(isAr ? "فشل الاتصال بالخادم" : "Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 py-12 bg-gray-50/50" dir={isAr ? "rtl" : "ltr"}>
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-md w-full">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isAr ? "تسجيل الدخول للمتجر" : "Store Sign In"}
          </h1>
          <p className="text-gray-500 text-sm">
            {isAr
              ? "بياناتك ومشترياتك محفوظة بشكل معزول وآمن داخل هذا المتجر فقط."
              : "Your data and purchases are saved securely and isolated to this store only."}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

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
              className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-(--primary) outline-none transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              {isAr ? "كلمة المرور" : "Password"}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-(--primary) outline-none transition-all pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 ${isAr ? 'left-3' : 'right-3'}`}
              >
                {showPassword ? (
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
            
            <div className="flex items-center justify-between text-sm mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setRememberMe(checked);

                    try {
                      if (!checked) {
                        localStorage.removeItem(rememberedEmailKey);
                      }
                    } catch {
                      // Ignore localStorage access errors.
                    }
                  }}
                  className="rounded border-gray-300 text-(--primary) focus:ring-(--primary)"
                />
                <span className="text-gray-600">{isAr ? "تذكرني" : "Remember me"}</span>
              </label>
              <Link
                href={`/${locale}/store/${storeSlug}/auth/forgot-password`}
                className="text-(--primary) font-medium hover:underline"
              >
                {isAr ? "نسيت كلمة المرور؟" : "Forgot Password?"}
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-(--primary) text-white font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? (isAr ? "جاري تسجيل الدخول..." : "Signing in...") : (isAr ? "تسجيل الدخول" : "Sign In")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {isAr ? "ليس لديك حساب؟" : "Don't have an account?"}{" "}
          <Link
            href={`/${locale}/store/${storeSlug}/auth/signup`}
            className="text-(--primary) font-medium hover:underline"
          >
            {isAr ? "إنشاء حساب" : "Sign up"}
          </Link>
        </p>
      </div>
    </div>
  );
}