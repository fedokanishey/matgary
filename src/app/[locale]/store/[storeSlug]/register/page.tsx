import { redirect } from "next/navigation";

export default async function RegisterAliasPage({
  params,
}: {
  params: Promise<{ locale: string; storeSlug: string }>;
}) {
  const { locale, storeSlug } = await params;
  redirect(`/${locale}/store/${storeSlug}/auth/signup`);
}
