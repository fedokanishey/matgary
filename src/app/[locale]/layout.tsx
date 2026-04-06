import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { Inter, Cairo } from "next/font/google";
import { routing } from "@/i18n/routing";
import { isRtlLocale } from "@/i18n/config";
import { QueryProvider } from "@/components/providers/query-provider";
import { NotificationProvider } from "@/components/providers/notification-provider";
import { BaseThemeProvider } from "@/components/providers/base-theme-provider";
import "@/app/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Matgary",
    default: "Matgary — Build Your Online Store",
  },
  description:
    "Create, customize, and manage your own e-commerce store with zero coding skills.",
  keywords: ["e-commerce", "online store", "SaaS", "متجر إلكتروني", "matgary"],
  authors: [{ name: "Matgary Team" }],
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as "en" | "ar")) {
    notFound();
  }

  const messages = await getMessages();
  const isRtl = isRtlLocale(locale);
  const dir = isRtl ? "rtl" : "ltr";
  const fontClass = isRtl ? cairo.variable : inter.variable;

  return (
    <ClerkProvider>
      <html lang={locale} dir={dir} className={fontClass} suppressHydrationWarning>
        <body
          suppressHydrationWarning
          className={`min-h-screen bg-[var(--background,#ffffff)] text-[var(--foreground,#0f172a)] antialiased ${
            isRtl ? "font-[var(--font-cairo)]" : "font-[var(--font-inter)]"
          }`}
        >
          <NextIntlClientProvider messages={messages}>
            <BaseThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <QueryProvider>
                <NotificationProvider>{children}</NotificationProvider>
              </QueryProvider>
            </BaseThemeProvider>
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
