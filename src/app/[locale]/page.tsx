import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export default function LandingPage() {
  const t = useTranslations("landing");
  const tCommon = useTranslations("common");

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-[var(--border,#e2e8f0)] bg-[var(--background)]/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Matgary Logo" width={32} height={32} className="rounded-lg object-cover" />
            <span className="text-xl font-bold bg-gradient-to-r from-[var(--primary,#6366f1)] to-[var(--secondary,#8b5cf6)] bg-clip-text text-transparent">
              {tCommon("appName")}
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageSwitcher />
            <Button variant="ghost" asChild>
              <Link href="/en/sign-in">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/en/sign-up">{t("hero.cta")}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 start-1/4 w-96 h-96 bg-[var(--primary,#6366f1)]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 end-1/4 w-96 h-96 bg-[var(--secondary,#8b5cf6)]/20 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 py-24 md:py-32 lg:py-40 text-center">
          <div className="mx-auto max-w-3xl space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--primary,#6366f1)]/20 bg-[var(--primary,#6366f1)]/5 px-4 py-1.5 text-sm text-[var(--primary,#6366f1)]">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--primary,#6366f1)] opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-[var(--primary,#6366f1)]" />
              </span>
              SaaS E-commerce Builder
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-r from-[var(--foreground,#0f172a)] via-[var(--primary,#6366f1)] to-[var(--secondary,#8b5cf6)] bg-clip-text text-transparent">
                {t("hero.title")}
              </span>
            </h1>

            <p className="mx-auto max-w-xl text-lg text-[var(--muted-foreground,#64748b)] leading-relaxed">
              {t("hero.subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild className="text-base px-8">
                <Link href="/en/sign-up">{t("hero.cta")}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base px-8">
                <Link href="#features">{t("hero.secondaryCta")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-[var(--muted,#f1f5f9)]/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold sm:text-4xl">{t("features.title")}</h2>
            <p className="mt-4 text-[var(--muted-foreground,#64748b)] text-lg">
              {t("features.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {([
              {
                key: "pwa",
                icon: (
                  <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                  </svg>
                ),
              },
              {
                key: "notifications",
                icon: (
                  <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                ),
              },
              {
                key: "branding",
                icon: (
                  <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                  </svg>
                ),
              },
              {
                key: "i18n",
                icon: (
                  <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
                  </svg>
                ),
              },
            ] as const).map((feature) => (
              <div
                key={feature.key}
                className="group relative rounded-2xl border border-[var(--border,#e2e8f0)] bg-[var(--background)] p-8 transition-all duration-300 hover:shadow-xl hover:shadow-[var(--primary,#6366f1)]/5 hover:-translate-y-1"
              >
                <div className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary,#6366f1)] to-[var(--secondary,#8b5cf6)] text-white shadow-lg shadow-[var(--primary,#6366f1)]/25">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold">
                  {t(`features.${feature.key}.title`)}
                </h3>
                <p className="text-sm text-[var(--muted-foreground,#64748b)] leading-relaxed">
                  {t(`features.${feature.key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border,#e2e8f0)] py-8">
        <div className="container mx-auto px-4 text-center text-sm text-[var(--muted-foreground,#64748b)]">
          © {new Date().getFullYear()} Matgary. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
