import { redirect } from "next/navigation";

export default async function SearchRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; storeSlug: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale, storeSlug } = await params;
  const { q } = await searchParams;
  const query = q ? `?q=${encodeURIComponent(q)}` : "";
  redirect(`/${locale}/store/${storeSlug}/shop${query}`);
}
