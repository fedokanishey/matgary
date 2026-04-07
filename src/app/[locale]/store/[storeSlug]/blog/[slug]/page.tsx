import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts } from "@/constants/blog-posts";

export default async function BlogDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; storeSlug: string; slug: string }>;
}) {
  const { locale, storeSlug, slug } = await params;
  const post = blogPosts.find((candidate) => candidate.slug === slug);

  if (!post) {
    notFound();
  }

  const basePath = `/${locale}/store/${storeSlug}`;

  return (
    <article className="mx-auto w-full max-w-4xl px-4 py-10 md:px-8">
      <Link href={`${basePath}/blog`} className="text-sm font-semibold text-[var(--primary)]">
        Back to blog
      </Link>

      <header className="mt-4 rounded-3xl bg-[var(--muted)]/35 p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">{new Date(post.publishedAt).toLocaleDateString()}</p>
        <h1 className="mt-2 text-4xl font-black text-[var(--primary)]">{post.title}</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">By {post.author}</p>
      </header>

      <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-2xl bg-[var(--muted)]">
        <Image src={post.coverImage} alt={post.title} fill className="object-cover" sizes="100vw" />
      </div>

      <div className="mt-6 rounded-2xl bg-[var(--background)] p-6 text-sm leading-7 text-[var(--muted-foreground)] shadow-sm">
        {post.content}
      </div>
    </article>
  );
}
