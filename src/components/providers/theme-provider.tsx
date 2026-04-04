import type { ThemeSettings } from "@prisma/client";

interface ThemeProviderProps {
  themeSettings?: ThemeSettings | null;
  children: React.ReactNode;
}

/**
 * ThemeProvider — Server Component that injects CSS variables from the DB.
 *
 * This component fetches ThemeSettings and renders a <style> tag
 * that sets CSS custom properties on :root. All UI components
 * reference these variables, enabling full per-tenant branding.
 *
 * Usage: Wrap a storefront layout to apply a store's branding.
 */
export function ThemeProvider({ themeSettings, children }: ThemeProviderProps) {
  // Default theme values (used when no store settings exist)
  const theme = {
    "--primary": themeSettings?.primaryColor ?? "#6366f1",
    "--secondary": themeSettings?.secondaryColor ?? "#8b5cf6",
    "--accent": themeSettings?.accentColor ?? "#f59e0b",
    "--background": themeSettings?.backgroundColor ?? "#ffffff",
    "--foreground": themeSettings?.foregroundColor ?? "#0f172a",
    "--muted": themeSettings?.mutedColor ?? "#f1f5f9",
    "--muted-foreground": themeSettings?.mutedForeground ?? "#64748b",
    "--border": themeSettings?.borderColor ?? "#e2e8f0",
    "--radius": themeSettings?.borderRadius ?? "0.5rem",
    "--font-family": themeSettings?.fontFamily ?? "Inter, sans-serif",
  };

  const cssVariables = Object.entries(theme)
    .map(([key, value]) => `${key}: ${value};`)
    .join("\n    ");

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
  :root {
    ${cssVariables}
  }
  body {
    font-family: var(--font-family);
    background-color: var(--background);
    color: var(--foreground);
  }
`,
        }}
      />
      {children}
    </>
  );
}
