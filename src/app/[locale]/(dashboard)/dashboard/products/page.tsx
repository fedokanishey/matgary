import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function ProductsPage() {
  const t = useTranslations("dashboard.products");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button>
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t("add")}
        </Button>
      </div>

      <div className="rounded-2xl border border-[var(--border,#e2e8f0)] bg-white p-6">
        <div className="flex flex-col items-center justify-center py-16 text-[var(--muted-foreground,#64748b)]">
          <svg className="size-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          <p>{t("empty")}</p>
        </div>
      </div>
    </div>
  );
}
