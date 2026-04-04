import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { db } from "@/lib/db";

/**
 * Dynamic manifest generation per-tenant.
 * Each store gets its own name, theme color, and icons
 * when a customer installs the PWA on their home screen.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const referer = headersList.get("referer") || "";

  // Try to extract storeSlug from the referer URL
  const storeSlugMatch = referer.match(/\/store\/([^/?#]+)/);
  const storeSlug = storeSlugMatch?.[1];

  // Default manifest (for the main platform)
  let name = "Matgary";
  let shortName = "Matgary";
  let themeColor = "#6366f1";
  let backgroundColor = "#ffffff";
  let startUrl = "/";
  let description = "Build your online store in minutes";

  // If we can identify a store, customize the manifest
  if (storeSlug) {
    try {
      const store = await db.store.findUnique({
        where: { slug: storeSlug },
        include: { themeSettings: true },
      });

      if (store) {
        name = store.name;
        shortName = store.name.substring(0, 12);
        description = store.description || `${store.name} — Online Store`;
        startUrl = `/en/store/${store.slug}`;

        if (store.themeSettings) {
          themeColor = store.themeSettings.primaryColor;
          backgroundColor = store.themeSettings.backgroundColor;
        }
      }
    } catch (error) {
      console.error("[Manifest] Error fetching store:", error);
    }
  }

  return {
    name,
    short_name: shortName,
    description,
    start_url: startUrl,
    display: "standalone",
    orientation: "portrait",
    theme_color: themeColor,
    background_color: backgroundColor,
    categories: ["shopping", "business"],
    icons: [
      {
        src: "/icons/icon-72x72.png",
        sizes: "72x72",
        type: "image/png",
      },
      {
        src: "/icons/icon-96x96.png",
        sizes: "96x96",
        type: "image/png",
      },
      {
        src: "/icons/icon-128x128.png",
        sizes: "128x128",
        type: "image/png",
      },
      {
        src: "/icons/icon-144x144.png",
        sizes: "144x144",
        type: "image/png",
      },
      {
        src: "/icons/icon-152x152.png",
        sizes: "152x152",
        type: "image/png",
      },
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-384x384.png",
        sizes: "384x384",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
