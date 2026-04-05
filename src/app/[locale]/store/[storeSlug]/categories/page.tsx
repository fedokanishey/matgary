import { getTranslations } from "next-intl/server";

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string; storeSlug: string }>;
}) {
  const { locale, storeSlug } = await params;
  
  return (
    <div className="container mx-auto px-4 py-16 text-center h-[50vh] flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-4 flex items-center justify-center gap-3">
        <svg className="size-8 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
        {locale === "ar" ? "الأقسام" : "Categories"}
      </h1>
      <p className="text-gray-500 max-w-md mx-auto">
        {locale === "ar" 
          ? "يتم حالياً تجهيز صفحة الأقسام لتصفح أسهل. ستكون متاحة قريباً!" 
          : "The categories page is currently being prepared for easier browsing. It will be available soon!"}
      </p>
    </div>
  );
}