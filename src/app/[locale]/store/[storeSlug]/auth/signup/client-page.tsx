"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import Link from "next/link";

export default function StoreClientSignUp({
  storeId,
  storeSlug,
  locale,
}: {
  storeId: string;
  storeSlug: string;
  locale: string;
}) {
  const isAr = locale === "ar";
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { signUp } = useCustomerAuth(storeId, storeSlug);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(isAr ? "كلمات المرور غير متطابقة" : "Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");

    const res = await signUp({ 
      firstName,
      lastName,
      phone,
      email, 
      password 
    });

    if (res.success) {
      router.push(`/${locale}/store/${storeSlug}/account`);
    } else {
      setError(res.error || (isAr ? "حدث خطأ أثناء إنشاء الحساب" : "An error occurred during sign up"));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 py-12 bg-gray-50/50" dir={isAr ? "rtl" : "ltr"}>
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-md w-full">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isAr ? "إنشاء حساب جديد" : "Create an Account"}
          </h1>
          <p className="text-gray-500 text-sm">
            {isAr
              ? "قم بإنشاء حسابك لإدارة طلباتك ومشترياتك."
              : "Create your account to manage your orders and purchases."}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                {isAr ? "الاسم الأول" : "First Name"}
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                {isAr ? "الاسم الأخير" : "Last Name"}
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              {isAr ? "رقم الهاتف" : "Phone"}
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all"
              placeholder="+20100000000"
            />
          </div>

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
                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all pr-12"
                placeholder="••••••••"
                minLength={6}
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
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              {isAr ? "تأكيد كلمة المرور" : "Confirm Password"}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all pr-12"
                placeholder="••••••••"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 ${isAr ? 'left-3' : 'right-3'}`}
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
            className="w-full bg-[var(--primary)] text-white font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? (isAr ? "جاري إنشاء الحساب..." : "Signing up...") : (isAr ? "إنشاء حساب" : "Sign Up")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {isAr ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
          <Link
            href={`/${locale}/store/${storeSlug}/auth/login`}
            className="text-[var(--primary)] font-medium hover:underline"
          >
            {isAr ? "تسجيل الدخول" : "Sign in"}
          </Link>
        </p>
      </div>
    </div>
  );
}
