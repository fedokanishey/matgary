"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import {
  Store,
  Palette,
  ToggleRight,
  ExternalLink,
  Copy,
  Check,
  Save,
  Loader2,
  Globe,
  ImageIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { GenericInput } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ColorPicker } from "@/components/ui/color-picker";
import { ImageUpload } from "@/components/ui/image-upload";
import { ThemeCard, presetThemes, type ThemePreset } from "@/components/ui/theme-card";
import { cn } from "@/lib/utils";

// Types
interface StoreSettings {
  storeName: string;
  storeSlug: string;
  description: string;
  currency: string;
  logoUrl: string | null;
  heroImageUrl: string | null;
}

interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  foregroundColor: string;
  fontFamily: string;
  borderRadius: string;
}

interface FeatureSettings {
  enableWhatsApp: boolean;
  whatsAppNumber: string;
  enableReviews: boolean;
  enablePush: boolean;
  enableSound: boolean;
  enableEmail: boolean;
  enableDarkMode: boolean;
}

// Currency options
const currencies = [
  { value: "USD", label: "USD ($)", symbol: "$" },
  { value: "EUR", label: "EUR (€)", symbol: "€" },
  { value: "GBP", label: "GBP (£)", symbol: "£" },
  { value: "EGP", label: "EGP (ج.م)", symbol: "ج.م" },
  { value: "SAR", label: "SAR (ر.س)", symbol: "ر.س" },
  { value: "AED", label: "AED (د.إ)", symbol: "د.إ" },
];

// Font options
const fonts = [
  { value: "Inter, sans-serif", label: "Inter" },
  { value: "Cairo, sans-serif", label: "Cairo (Arabic)" },
  { value: "Poppins, sans-serif", label: "Poppins" },
  { value: "Roboto, sans-serif", label: "Roboto" },
  { value: "Open Sans, sans-serif", label: "Open Sans" },
];

// Default values
const defaultStoreSettings: StoreSettings = {
  storeName: "",
  storeSlug: "",
  description: "",
  currency: "USD",
  logoUrl: null,
  heroImageUrl: null,
};

const defaultThemeSettings: ThemeSettings = {
  primaryColor: "#6366f1",
  secondaryColor: "#8b5cf6",
  accentColor: "#f59e0b",
  backgroundColor: "#ffffff",
  foregroundColor: "#0f172a",
  fontFamily: "Inter, sans-serif",
  borderRadius: "0.5rem",
};

const defaultFeatureSettings: FeatureSettings = {
  enableWhatsApp: false,
  whatsAppNumber: "",
  enableReviews: true,
  enablePush: true,
  enableSound: false,
  enableEmail: false,
  enableDarkMode: true,
};

export default function SettingsPage() {
  const t = useTranslations("dashboard.settings");
  const commonT = useTranslations("common");

  // State
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const [storeSettings, setStoreSettings] = useState<StoreSettings>(defaultStoreSettings);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(defaultThemeSettings);
  const [featureSettings, setFeatureSettings] = useState<FeatureSettings>(defaultFeatureSettings);

  // Preview theme state (for live preview without saving)
  const [previewTheme, setPreviewTheme] = useState<ThemeSettings>(defaultThemeSettings);

  // Store URL
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const storeUrl = storeSettings.storeSlug ? `${baseUrl}/store/${storeSettings.storeSlug}` : "";

  // Fetch settings with React Query for caching
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["store-settings"],
    queryFn: async () => {
      const origin = window.location.origin;
      const res = await fetch(`${origin}/api/notifications/store-settings`);
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Initialize state from fetched data
  useEffect(() => {
    if (settingsData?.store && !isInitialized) {
      const store = settingsData.store;
      setStoreSettings({
        storeName: store.name || "",
        storeSlug: store.slug || "",
        description: store.description || "",
        currency: store.currency || "USD",
        logoUrl: store.logoUrl || null,
        heroImageUrl: store.heroImageUrl || null,
      });

      if (store.themeSettings) {
        const theme = {
          primaryColor: store.themeSettings.primaryColor || defaultThemeSettings.primaryColor,
          secondaryColor: store.themeSettings.secondaryColor || defaultThemeSettings.secondaryColor,
          accentColor: store.themeSettings.accentColor || defaultThemeSettings.accentColor,
          backgroundColor: store.themeSettings.backgroundColor || defaultThemeSettings.backgroundColor,
          foregroundColor: store.themeSettings.foregroundColor || defaultThemeSettings.foregroundColor,
          fontFamily: store.themeSettings.fontFamily || defaultThemeSettings.fontFamily,
          borderRadius: store.themeSettings.borderRadius || defaultThemeSettings.borderRadius,
        };
        setThemeSettings(theme);
        setPreviewTheme(theme);
      }

      if (store.configuration) {
        setFeatureSettings({
          enableWhatsApp: store.configuration.whatsAppChat || false,
          whatsAppNumber: store.configuration.whatsAppNumber || "",
          enableReviews: store.configuration.reviews ?? true,
          enablePush: store.configuration.pushNotifications ?? true,
          enableSound: store.configuration.soundAlerts || false,
          enableEmail: store.configuration.emailAlerts || false,
          enableDarkMode: store.configuration.darkMode ?? true,
        });
      }
      setIsInitialized(true);
    }
  }, [settingsData, isInitialized]);

  // Save all settings
  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const origin = window.location.origin;
      
      // Save general settings
      const generalRes = await fetch(`${origin}/api/notifications/store-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "general",
          data: {
            storeName: storeSettings.storeName,
            storeSlug: storeSettings.storeSlug,
            description: storeSettings.description,
            currency: storeSettings.currency,
            logoUrl: storeSettings.logoUrl,
            heroImageUrl: storeSettings.heroImageUrl,
          },
        }),
      });

      if (!generalRes.ok) {
        const err = await generalRes.json();
        console.error("Failed to save general settings:", err);
        throw new Error(err.error || "Failed to save general settings");
      }

      // Save theme settings
      const themeRes = await fetch(`${origin}/api/notifications/store-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "theme",
          data: themeSettings,
        }),
      });

      if (!themeRes.ok) {
        const err = await themeRes.json();
        console.error("Failed to save theme settings:", err);
        throw new Error(err.error || "Failed to save theme settings");
      }

      // Save feature settings
      const featuresRes = await fetch(`${origin}/api/notifications/store-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "features",
          data: {
            enableWhatsApp: featureSettings.enableWhatsApp,
            whatsAppNumber: featureSettings.whatsAppNumber,
            enableReviews: featureSettings.enableReviews,
            enablePush: featureSettings.enablePush,
            enableSound: featureSettings.enableSound,
            enableEmail: featureSettings.enableEmail,
            enableDarkMode: featureSettings.enableDarkMode,
          },
        }),
      });

      if (!featuresRes.ok) {
        const err = await featuresRes.json();
        console.error("Failed to save features settings:", err);
        throw new Error(err.error || "Failed to save features settings");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings. Check console for details.");
    } finally {
      setIsSaving(false);
    }
  };

  // Copy store URL
  const copyStoreUrl = useCallback(() => {
    if (storeUrl) {
      navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [storeUrl]);

  // Apply theme preset
  const applyThemePreset = (preset: ThemePreset) => {
    const newTheme = {
      ...themeSettings,
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor,
      backgroundColor: preset.backgroundColor,
      foregroundColor: preset.foregroundColor,
      accentColor: preset.accentColor || themeSettings.accentColor,
    };
    setThemeSettings(newTheme);
    setPreviewTheme(newTheme);
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Skeleton className="h-[400px] lg:col-span-1" />
          <Skeleton className="h-[400px] lg:col-span-3" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{t("title")}</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Manage your store settings, branding, and features
          </p>
        </div>

        <Button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="w-full sm:w-auto gap-2 shadow-lg hover:shadow-xl transition-shadow"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : saveSuccess ? (
            <>
              <Check className="w-4 h-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {commonT("save")} Changes
            </>
          )}
        </Button>
      </div>

      {/* Store URL Banner */}
      {storeUrl && (
        <Card className="border-[var(--primary)]/20 bg-gradient-to-r from-[var(--primary)]/5 to-[var(--secondary)]/5">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--foreground)]">Your Store URL</p>
                  <p className="text-sm text-[var(--muted-foreground)] truncate">{storeUrl}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyStoreUrl}
                  className="gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(storeUrl, "_blank")}
                  className="gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Visit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardContent className="p-2">
              <nav className="space-y-1">
                {[
                  { id: "general", icon: Store, label: t("general") },
                  { id: "branding", icon: ImageIcon, label: "Store Identity" },
                  { id: "theme", icon: Palette, label: t("theme") },
                  { id: "features", icon: ToggleRight, label: t("features") },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                      activeTab === item.id
                        ? "bg-[var(--primary)] text-white shadow-md"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* General Settings */}
          {activeTab === "general" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-[var(--primary)]" />
                  {t("general")}
                </CardTitle>
                <CardDescription>
                  Configure your store&apos;s basic information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Store Name & URL in 2 columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <GenericInput
                    label={t("storeName")}
                    name="storeName"
                    value={storeSettings.storeName}
                    onChange={(e) =>
                      setStoreSettings((prev) => ({ ...prev, storeName: e.target.value }))
                    }
                    placeholder="My Awesome Store"
                  />

                  {/* Interactive URL Field */}
                  <div className="space-y-2">
                    <Label>{t("storeSlug")}</Label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-[var(--border)] bg-[var(--muted)] text-sm text-[var(--muted-foreground)]">
                        matgary.com/store/
                      </span>
                      <input
                        type="text"
                        value={storeSettings.storeSlug}
                        onChange={(e) =>
                          setStoreSettings((prev) => ({
                            ...prev,
                            storeSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                          }))
                        }
                        placeholder="my-store"
                        className="flex-1 px-3 py-2 rounded-r-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2"
                      />
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Only lowercase letters, numbers, and hyphens
                    </p>
                  </div>
                </div>

                {/* Description */}
                <Textarea
                  label={t("description")}
                  value={storeSettings.description}
                  onChange={(e) =>
                    setStoreSettings((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Describe your store..."
                  helperText="This appears in search results and when sharing your store"
                />

                {/* Currency */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>{t("currency")}</Label>
                    <Select
                      value={storeSettings.currency}
                      onValueChange={(value) =>
                        setStoreSettings((prev) => ({ ...prev, currency: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Branding Settings */}
          {activeTab === "branding" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[var(--primary)]" />
                  Store Identity
                </CardTitle>
                <CardDescription>
                  Upload your store logo and hero image to build brand recognition
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Logo Upload */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--foreground)]">Store Logo</h3>
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">
                        Your main brand image. Appears in the header and checkout.
                      </p>
                    </div>
                    <ImageUpload
                      value={storeSettings.logoUrl || undefined}
                      onChange={(url) =>
                        setStoreSettings((prev) => ({ ...prev, logoUrl: url }))
                      }
                      size="lg"
                      shape="square"
                      recommendedSize="512x512px"
                      description="PNG with transparency supported. Cropping is optional."
                      enableCrop={true}
                    />
                  </div>

                  {/* Hero Image Upload */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--foreground)]">Hero Image</h3>
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">
                        Main banner image for your store homepage. Upload as-is or crop to fit.
                      </p>
                    </div>
                    <ImageUpload
                      value={storeSettings.heroImageUrl || undefined}
                      onChange={(url) =>
                        setStoreSettings((prev) => ({ ...prev, heroImageUrl: url }))
                      }
                      size="lg"
                      shape="square"
                      recommendedSize="1920x600px"
                      description="PNG, JPG up to 5MB. Cropping is optional."
                      enableCrop={true}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Theme Settings */}
          {activeTab === "theme" && (
            <>
              {/* Theme Presets */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-[var(--primary)]" />
                    Theme Presets
                  </CardTitle>
                  <CardDescription>
                    Choose a pre-designed color scheme or customize your own
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {presetThemes.map((preset) => (
                      <ThemeCard
                        key={preset.id}
                        theme={preset}
                        isSelected={
                          themeSettings.primaryColor === preset.primaryColor &&
                          themeSettings.backgroundColor === preset.backgroundColor
                        }
                        onSelect={applyThemePreset}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Custom Colors */}
              <Card>
                <CardHeader>
                  <CardTitle>Custom Colors</CardTitle>
                  <CardDescription>
                    Fine-tune your brand colors for a unique look
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ColorPicker
                      label={t("primaryColor")}
                      description="Main brand color for buttons and links"
                      value={themeSettings.primaryColor}
                      onChange={(color) => {
                        setThemeSettings((prev) => ({ ...prev, primaryColor: color }));
                        setPreviewTheme((prev) => ({ ...prev, primaryColor: color }));
                      }}
                    />
                    <ColorPicker
                      label={t("secondaryColor")}
                      description="Supporting color for accents"
                      value={themeSettings.secondaryColor}
                      onChange={(color) => {
                        setThemeSettings((prev) => ({ ...prev, secondaryColor: color }));
                        setPreviewTheme((prev) => ({ ...prev, secondaryColor: color }));
                      }}
                    />
                  </div>

                  <Separator />

                  {/* Font & Radius */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>{t("fontFamily")}</Label>
                      <Select
                        value={themeSettings.fontFamily}
                        onValueChange={(value) =>
                          setThemeSettings((prev) => ({ ...prev, fontFamily: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select font" />
                        </SelectTrigger>
                        <SelectContent>
                          {fonts.map((font) => (
                            <SelectItem key={font.value} value={font.value}>
                              <span style={{ fontFamily: font.value }}>{font.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{t("borderRadius")}</Label>
                      <Select
                        value={themeSettings.borderRadius}
                        onValueChange={(value) =>
                          setThemeSettings((prev) => ({ ...prev, borderRadius: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select radius" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">None (0px)</SelectItem>
                          <SelectItem value="0.25rem">Small (4px)</SelectItem>
                          <SelectItem value="0.5rem">Medium (8px)</SelectItem>
                          <SelectItem value="0.75rem">Large (12px)</SelectItem>
                          <SelectItem value="1rem">Extra Large (16px)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Live Preview */}
                  <div className="mt-6 p-6 rounded-xl border border-[var(--border)] bg-[var(--muted)]/30">
                    <h4 className="text-sm font-medium mb-4">Live Preview</h4>
                    <div
                      className="p-4 rounded-lg"
                      style={{
                        backgroundColor: previewTheme.backgroundColor,
                        color: previewTheme.foregroundColor,
                        borderRadius: themeSettings.borderRadius,
                      }}
                    >
                      <div
                        className="h-2 w-24 rounded mb-3"
                        style={{ backgroundColor: previewTheme.primaryColor }}
                      />
                      <div
                        className="h-1.5 w-32 rounded mb-2"
                        style={{ backgroundColor: previewTheme.foregroundColor, opacity: 0.7 }}
                      />
                      <div
                        className="h-1.5 w-20 rounded mb-4"
                        style={{ backgroundColor: previewTheme.foregroundColor, opacity: 0.4 }}
                      />
                      <div className="flex gap-2">
                        <button
                          className="px-4 py-2 text-xs font-medium text-white rounded"
                          style={{
                            backgroundColor: previewTheme.primaryColor,
                            borderRadius: themeSettings.borderRadius,
                          }}
                        >
                          Primary Button
                        </button>
                        <button
                          className="px-4 py-2 text-xs font-medium border rounded"
                          style={{
                            borderColor: previewTheme.secondaryColor,
                            color: previewTheme.secondaryColor,
                            borderRadius: themeSettings.borderRadius,
                          }}
                        >
                          Secondary
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Features Settings */}
          {activeTab === "features" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ToggleRight className="w-5 h-5 text-[var(--primary)]" />
                  {t("features")}
                </CardTitle>
                <CardDescription>
                  Enable or disable store features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* WhatsApp */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)]/50 transition-colors">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">{t("enableWhatsApp")}</Label>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Show a WhatsApp chat button for customer support
                    </p>
                    {featureSettings.enableWhatsApp && (
                      <GenericInput
                        placeholder="+1234567890"
                        value={featureSettings.whatsAppNumber}
                        onChange={(e) =>
                          setFeatureSettings((prev) => ({
                            ...prev,
                            whatsAppNumber: e.target.value,
                          }))
                        }
                        className="mt-3 max-w-xs"
                      />
                    )}
                  </div>
                  <Switch
                    checked={featureSettings.enableWhatsApp}
                    onCheckedChange={(checked) =>
                      setFeatureSettings((prev) => ({ ...prev, enableWhatsApp: checked }))
                    }
                  />
                </div>

                {/* Reviews */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)]/50 transition-colors">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">{t("enableReviews")}</Label>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Allow customers to leave product reviews
                    </p>
                  </div>
                  <Switch
                    checked={featureSettings.enableReviews}
                    onCheckedChange={(checked) =>
                      setFeatureSettings((prev) => ({ ...prev, enableReviews: checked }))
                    }
                  />
                </div>

                {/* Dark Mode */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)]/50 transition-colors">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">{t("enableDarkMode")}</Label>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Allow customers to switch to dark mode
                    </p>
                  </div>
                  <Switch
                    checked={featureSettings.enableDarkMode}
                    onCheckedChange={(checked) =>
                      setFeatureSettings((prev) => ({ ...prev, enableDarkMode: checked }))
                    }
                  />
                </div>

                <Separator />

                <h3 className="text-sm font-semibold text-[var(--foreground)]">Notifications</h3>

                {/* Push Notifications */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)]/50 transition-colors">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">{t("enablePush")}</Label>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Receive browser notifications for new orders
                    </p>
                  </div>
                  <Switch
                    checked={featureSettings.enablePush}
                    onCheckedChange={(checked) =>
                      setFeatureSettings((prev) => ({ ...prev, enablePush: checked }))
                    }
                  />
                </div>

                {/* Sound Alerts */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)]/50 transition-colors">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">{t("enableSound")}</Label>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Play a sound when new orders arrive
                    </p>
                  </div>
                  <Switch
                    checked={featureSettings.enableSound}
                    onCheckedChange={(checked) =>
                      setFeatureSettings((prev) => ({ ...prev, enableSound: checked }))
                    }
                  />
                </div>

                {/* Email Alerts */}
                <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)]/50 transition-colors">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">{t("enableEmail")}</Label>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Get email notifications for new orders
                    </p>
                  </div>
                  <Switch
                    checked={featureSettings.enableEmail}
                    onCheckedChange={(checked) =>
                      setFeatureSettings((prev) => ({ ...prev, enableEmail: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Floating Save Button (Mobile) */}
      <div className="fixed bottom-6 right-6 lg:hidden z-50">
        <Button
          onClick={handleSaveAll}
          disabled={isSaving}
          size="lg"
          className="rounded-full shadow-2xl w-14 h-14 p-0"
        >
          {isSaving ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : saveSuccess ? (
            <Check className="w-6 h-6" />
          ) : (
            <Save className="w-6 h-6" />
          )}
        </Button>
      </div>
    </div>
  );
}
