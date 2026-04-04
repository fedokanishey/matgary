import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Matgary — Build Your Online Store",
  description:
    "Matgary is a powerful SaaS platform that lets you create, customize, and manage your own e-commerce store.",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

/**
 * Root layout — minimal. All UI lives under [locale] layout.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
