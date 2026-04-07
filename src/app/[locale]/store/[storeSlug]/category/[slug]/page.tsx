import { redirect } from "next/navigation";

export default async function CategoryRedirectPage({
  params,
}: {
  params: Promise<{ locale: string; storeSlug: string; slug: string }>;
}) {
  const { locale, storeSlug, slug } = await params;
  redirect(`/${locale}/store/${storeSlug}/shop?category=${encodeURIComponent(slug)}`);
}
