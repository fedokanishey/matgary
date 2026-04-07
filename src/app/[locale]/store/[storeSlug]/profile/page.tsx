import { redirect } from "next/navigation";

export default async function ProfileAliasPage({
  params,
}: {
  params: Promise<{ locale: string; storeSlug: string }>;
}) {
  const { locale, storeSlug } = await params;
  redirect(`/${locale}/store/${storeSlug}/account`);
}
