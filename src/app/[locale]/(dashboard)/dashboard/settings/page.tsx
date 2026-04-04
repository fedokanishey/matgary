import { useTranslations } from "next-intl";

export default function SettingsPage() {
  const t = useTranslations("dashboard.settings");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      {/* General Settings */}
      <div className="rounded-2xl border border-[var(--border,#e2e8f0)] bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold">{t("general")}</h2>
        <p className="text-sm text-[var(--muted-foreground,#64748b)]">
          Configure your store name, URL, and general settings. Coming soon.
        </p>
      </div>

      {/* Theme Settings */}
      <div className="rounded-2xl border border-[var(--border,#e2e8f0)] bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold">{t("theme")}</h2>
        <p className="text-sm text-[var(--muted-foreground,#64748b)]">
          Customize your store branding — colors, fonts, and more. Coming soon.
        </p>
      </div>

      {/* Feature Toggles */}
      <div className="rounded-2xl border border-[var(--border,#e2e8f0)] bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold">{t("features")}</h2>
        <p className="text-sm text-[var(--muted-foreground,#64748b)]">
          Enable or disable store features. Coming soon.
        </p>
      </div>
    </div>
  );
}
