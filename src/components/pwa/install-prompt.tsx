"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

/**
 * PWA Install Prompt — shows a button to install the app.
 * Captures the `beforeinstallprompt` event and triggers it on click.
 */
export function InstallPrompt() {
  const t = useTranslations("pwa");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled || !isVisible) return null;

  return (
    <div className="fixed bottom-6 end-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--border,#e2e8f0)] bg-white p-4 shadow-2xl shadow-black/10">
        <div className="size-10 rounded-xl bg-gradient-to-br from-[var(--primary,#6366f1)] to-[var(--secondary,#8b5cf6)] flex items-center justify-center shrink-0">
          <svg className="size-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">{t("install")}</p>
          <p className="text-xs text-[var(--muted-foreground,#64748b)]">{t("installDescription")}</p>
        </div>
        <Button size="sm" onClick={handleInstall}>
          {t("install")}
        </Button>
        <button
          onClick={() => setIsVisible(false)}
          className="p-1 hover:bg-[var(--muted,#f1f5f9)] rounded-lg transition-colors"
        >
          <svg className="size-4 text-[var(--muted-foreground,#64748b)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Type declaration for the BeforeInstallPromptEvent
 */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
