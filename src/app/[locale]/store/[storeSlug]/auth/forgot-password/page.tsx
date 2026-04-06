import { prisma } from "@/lib/prisma";
import StoreClientForgotPassword from "./client-page";
import { notFound } from "next/navigation";

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string; storeSlug: string }>;
}) {
  const { locale, storeSlug } = await params;

  const store = await prisma.store.findUnique({
    where: { slug: storeSlug },
    select: { id: true },
  });

  if (!store) {
    notFound();
  }

  return (
    <StoreClientForgotPassword 
      storeId={store.id} 
      storeSlug={storeSlug} 
      locale={locale} 
    />
  );
}