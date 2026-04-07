import Link from "next/link";
import { blogPosts } from "@/constants/blog-posts";

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string; storeSlug: string }>;
}) {
  const { locale, storeSlug } = await params;
  const basePath = `/${locale}/store/${storeSlug}`;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 md:px-8">
      <section className="rounded-3xl bg-[var(--muted)]/40 p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Journal</p>
        <h1 className="mt-2 text-4xl font-black text-[var(--primary)]">Design & Commerce Insights</h1>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {blogPosts.map((post) => (
          <article key={post.slug} className="rounded-2xl bg-[var(--background)] p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.15em] text-[var(--muted-foreground)]">{new Date(post.publishedAt).toLocaleDateString()}</p>
            <h2 className="mt-2 text-2xl font-black text-[var(--primary)]">{post.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">{post.excerpt}</p>
            <Link
              href={`${basePath}/blog/${post.slug}`}
              className="mt-4 inline-flex text-sm font-semibold text-[var(--primary)]"
            >
              Read article
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
