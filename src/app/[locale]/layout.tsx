import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import Script from "next/script";
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
          className={`min-h-screen bg-(--background,#ffffff) text-(--foreground,#0f172a) antialiased ${
            isRtl ? "font-(--font-cairo)" : "font-(--font-inter)"
          }`}
        >
          {process.env.NODE_ENV !== "production" && (
            <Script id="dev-sw-cache-reset" strategy="beforeInteractive">
              {`
                (function () {
                  if (typeof window === "undefined") return;
                  if (!("serviceWorker" in navigator)) return;

                  var resetFlag = "matgary_dev_sw_reset_done";
                  if (sessionStorage.getItem(resetFlag) === "1") return;

                  var unregisterAll = navigator.serviceWorker
                    .getRegistrations()
                    .then(function (registrations) {
                      return Promise.all(
                        registrations.map(function (registration) {
                          return registration.unregister();
                        })
                      );
                    })
                    .catch(function () {});

                  var clearCaches = ("caches" in window)
                    ? caches.keys()
                        .then(function (keys) {
                          return Promise.all(
                            keys.map(function (key) {
                              return caches.delete(key);
                            })
                          );
                        })
                        .catch(function () {})
                    : Promise.resolve();

                  Promise.all([unregisterAll, clearCaches]).finally(function () {
                    sessionStorage.setItem(resetFlag, "1");
                    if (navigator.serviceWorker.controller) {
                      window.location.reload();
                    }
                  });
                })();
              `}
            </Script>
          )}

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
