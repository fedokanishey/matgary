import { SignIn } from "@clerk/nextjs";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string; storeSlug: string }>;
}) {
  const { locale, storeSlug } = await params;
  const isAr = locale === "ar";
  const basePath = `/${locale}/store/${storeSlug}`;

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 py-12 bg-gray-50/50">
      <div className="mb-6 text-center max-w-md">
        <h1 className="text-2xl font-bold text-gray-900">
          {isAr ? "تسجيل الدخول للمتجر" : "Store Sign In"}
        </h1>
        <p className="text-gray-500 mt-2">
          {isAr
            ? "بياناتك ومشترياتك محفوظة بشكل معزول وآمن داخل هذا المتجر فقط."
            : "Your data and purchases are saved securely and isolated to this store only."}
        </p>
      </div>

      <SignIn
        routing="hash"
        fallbackRedirectUrl={`${basePath}/account/sync`}
        signUpFallbackRedirectUrl={`${basePath}/account/sync`}
      />
    </div>
  );
}
