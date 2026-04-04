import { useTranslations } from "next-intl";

export default function CustomersPage() {
  const t = useTranslations("dashboard.customers");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <div className="rounded-2xl border border-[var(--border,#e2e8f0)] bg-[var(--background,#ffffff)] p-6">
        <div className="flex flex-col items-center justify-center py-16 text-[var(--muted-foreground,#64748b)]">
          <svg className="size-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
          <p>{t("empty")}</p>
        </div>
      </div>
    </div>
  );
}
