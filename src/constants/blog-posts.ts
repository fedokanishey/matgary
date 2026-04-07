export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  publishedAt: string;
  author: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "curation-principles-for-modern-homes",
    title: "Curation Principles For Modern Homes",
    excerpt:
      "How to build a cohesive living space by balancing scale, texture, and negative space.",
    content:
      "A well-curated home starts with restraint. Begin with one anchor piece in each room, then layer complementary objects with intention. Prioritize materials that age gracefully and keep circulation spaces open. This approach creates a calm environment where every item feels deliberate.",
    coverImage:
      "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=1600&q=80",
    publishedAt: "2026-02-14",
    author: "Matgary Editorial",
  },
  {
    slug: "seasonal-color-stories-for-storefronts",
    title: "Seasonal Color Stories For Storefronts",
    excerpt:
      "Use tonal palettes that align with your catalog and improve conversion without visual noise.",
    content:
      "Color systems should reinforce product storytelling, not compete with it. Use one dominant brand color, one support color, and a neutral surface hierarchy for readability. In high-volume catalogs, consistent color rhythm improves scan speed and confidence during checkout.",
    coverImage:
      "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1600&q=80",
    publishedAt: "2026-01-30",
    author: "Matgary Editorial",
  },
  {
    slug: "designing-fast-checkout-experiences",
    title: "Designing Fast Checkout Experiences",
    excerpt:
      "A practical framework for reducing friction and increasing completed orders on mobile.",
    content:
      "Fast checkout is a sequence of small wins: clear hierarchy, fewer fields, reliable defaults, and immediate feedback. Save addresses, allow coupon validation inline, and keep payment summary persistent. Every interaction should confirm progress and reduce uncertainty.",
    coverImage:
      "https://images.unsplash.com/photo-1556740714-a8395b3bf30f?auto=format&fit=crop&w=1600&q=80",
    publishedAt: "2025-12-09",
    author: "Matgary Editorial",
  },
];
