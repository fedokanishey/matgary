import { redirect } from "next/navigation";

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string; storeSlug: string }>;
}) {
  const { locale, storeSlug } = await params;
  redirect(`/${locale}/store/${storeSlug}/shop`);
}