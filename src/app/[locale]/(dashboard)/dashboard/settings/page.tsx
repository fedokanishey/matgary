"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { GenericInput } from "@/components/ui/input";

export default function SettingsPage() {
  const t = useTranslations("dashboard.settings");
  const commonT = useTranslations("common");
  const [settings, setSettings] = useState({
    storeName: "",
    storeSlug: "",
    description: "",
    currency: "USD",
    primaryColor: "#6366f1",
    secondaryColor: "#8b5cf6",
    fontFamily: "Inter",
    borderRadius: "0.5",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from database on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/notifications/store-settings.ts");
        if (res.ok) {
          const { store } = await res.json();
          if (store) {
            setSettings({
              storeName: store.name || "",
              storeSlug: store.slug || "",
              description: store.description || "",
              currency: store.currency || "USD",
              primaryColor: store.themeSettings?.primaryColor || "#6366f1",
              secondaryColor: store.themeSettings?.secondaryColor || "#8b5cf6",
              fontFamily: store.themeSettings?.fontFamily || "Inter",
              borderRadius: store.themeSettings?.borderRadius || "0.5",
            });
          }
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveSettings = async (section: string) => {
    setIsSaving(true);
    setSaveMessage("");
    try {
      const res = await fetch("/api/notifications/store-settings.ts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section,
          data: section === "general" 
            ? { storeName: settings.storeName, storeSlug: settings.storeSlug, description: settings.description, currency: settings.currency }
            : section === "theme"
            ? { primaryColor: settings.primaryColor, secondaryColor: settings.secondaryColor, fontFamily: settings.fontFamily, borderRadius: settings.borderRadius }
            : { enableWhatsApp: true, enableReviews: true, enablePush: true, enableSound: false, enableEmail: false },
        }),
      });

      if (res.ok) {
        setSaveMessage(`✓ ${section} settings saved`);
        setTimeout(() => setSaveMessage(""), 3000);
      }
    } catch (error) {
      console.error("Error:", error);
      setSaveMessage("❌ Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const storeUrl = settings.storeSlug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/store/${settings.storeSlug}`
    : "";

  const copyToClipboard = () => {
    if (storeUrl) {
      navigator.clipboard.writeText(storeUrl);
      setSaveMessage("✓ Store link copied!");
      setTimeout(() => setSaveMessage(""), 2000);
    }
  };

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      {/* Store Link Section */}
      {storeUrl && (
        <div className="rounded-2xl border border-[var(--primary,#6366f1)] bg-[var(--primary,#6366f1)]/10 p-6 space-y-4">
          <h3 className="font-semibold text-[var(--primary,#6366f1)]">متجرك الإلكتروني / Your Store</h3>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={storeUrl}
              readOnly
              className="flex-1 px-4 py-2 rounded-lg border border-[var(--border,#e2e8f0)] bg-[var(--background,#ffffff)] text-[var(--foreground,#0f172a)]"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={copyToClipboard}
              title="Copy store link"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.open(storeUrl, "_blank")}
              title="Visit store"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Button>
          </div>
        </div>
      )}

      {/* General Settings */}
      <div className="rounded-2xl border border-[var(--border,#e2e8f0)] bg-[var(--background,#ffffff)] p-6 space-y-4">
        <h2 className="text-lg font-semibold">{t("general")}</h2>
        <p className="text-sm text-[var(--muted-foreground,#64748b)]">
          {t("generalDescription")}
        </p>
        <div className="space-y-4 pt-4">
          <GenericInput
            label={t("storeName")}
            name="storeName"
            value={settings.storeName}
            onChange={handleInputChange}
            placeholder={t("storeName")}
          />
          <GenericInput
            label={t("storeSlug")}
            name="storeSlug"
            value={settings.storeSlug}
            onChange={handleInputChange}
            placeholder="my-store"
          />
          <GenericInput
            label={t("description")}
            name="description"
            value={settings.description}
            onChange={handleInputChange}
            placeholder={t("description")}
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("currency")}</label>
              <select
                name="currency"
                value={settings.currency}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg border border-[var(--border,#e2e8f0)] bg-[var(--background,#ffffff)] text-[var(--foreground,#0f172a)]"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="EGP">EGP (ج.م)</option>
              </select>
            </div>
          </div>
          {saveMessage && <p className="text-sm text-green-600">{saveMessage}</p>}
          <Button
            onClick={() => handleSaveSettings("general")}
            isLoading={isSaving}
            className="w-full"
          >
            {commonT("save")}
          </Button>
        </div>
      </div>

      {/* Theme Settings */}
      <div className="rounded-2xl border border-[var(--border,#e2e8f0)] bg-[var(--background,#ffffff)] p-6 space-y-4">
        <h2 className="text-lg font-semibold">{t("theme")}</h2>
        <p className="text-sm text-[var(--muted-foreground,#64748b)]">
          {t("themeDescription")}
        </p>
        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("primaryColor")}</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  name="primaryColor"
                  value={settings.primaryColor}
                  onChange={handleInputChange}
                  className="h-10 w-16 rounded-lg cursor-pointer"
                />
                <GenericInput
                  name="primaryColor"
                  value={settings.primaryColor}
                  onChange={handleInputChange}
                  placeholder="#6366f1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("secondaryColor")}</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  name="secondaryColor"
                  value={settings.secondaryColor}
                  onChange={handleInputChange}
                  className="h-10 w-16 rounded-lg cursor-pointer"
                />
                <GenericInput
                  name="secondaryColor"
                  value={settings.secondaryColor}
                  onChange={handleInputChange}
                  placeholder="#8b5cf6"
                />
              </div>
            </div>
          </div>
          <GenericInput
            label={t("fontFamily")}
            name="fontFamily"
            value={settings.fontFamily}
            onChange={handleInputChange}
            placeholder="Inter"
          />
          <GenericInput
            label={t("borderRadius")}
            name="borderRadius"
            type="number"
            value={settings.borderRadius}
            onChange={handleInputChange}
            placeholder="0.5"
          />
          {saveMessage && <p className="text-sm text-green-600">{saveMessage}</p>}
          <Button
            onClick={() => handleSaveSettings("theme")}
            isLoading={isSaving}
            className="w-full"
          >
            {commonT("save")}
          </Button>
        </div>
      </div>

      {/* Features Settings */}
      <div className="rounded-2xl border border-[var(--border,#e2e8f0)] bg-[var(--background,#ffffff)] p-6 space-y-4">
        <h2 className="text-lg font-semibold">{t("features")}</h2>
        <p className="text-sm text-[var(--muted-foreground,#64748b)]">
          {t("featuresDescription")}
        </p>
        <div className="space-y-3 pt-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-[var(--border,#e2e8f0)] cursor-pointer"
              defaultChecked
            />
            <span className="text-sm">{t("enableWhatsApp")}</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-[var(--border,#e2e8f0)] cursor-pointer"
              defaultChecked
            />
            <span className="text-sm">{t("enableReviews")}</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-[var(--border,#e2e8f0)] cursor-pointer"
              defaultChecked
            />
            <span className="text-sm">{t("enablePush")}</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-[var(--border,#e2e8f0)] cursor-pointer"
            />
            <span className="text-sm">{t("enableSound")}</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-[var(--border,#e2e8f0)] cursor-pointer"
            />
            <span className="text-sm">{t("enableEmail")}</span>
          </label>
          {saveMessage && <p className="text-sm text-green-600">{saveMessage}</p>}
          <Button
            onClick={() => handleSaveSettings("features")}
            isLoading={isSaving}
            className="w-full"
          >
            {commonT("save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
