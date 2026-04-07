import Link from "next/link";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string; storeSlug: string }>;
}) {
  const { locale, storeSlug } = await params;
  const basePath = `/${locale}/store/${storeSlug}`;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 md:px-8">
      <section className="rounded-3xl bg-[var(--muted)]/40 p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">About</p>
        <h1 className="mt-2 text-4xl font-black text-[var(--primary)]">The Gallery Standard</h1>
        <p className="mt-4 leading-relaxed text-[var(--muted-foreground)]">
          We curate products that combine quality materials, quiet aesthetics, and practical durability.
          Every product in this store is selected to feel consistent with a premium, modern lifestyle.
        </p>
      </section>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          ["Craftsmanship", "We partner with makers focused on durable construction and timeless silhouettes."],
          ["Sustainability", "Our selection prioritizes low-waste packaging and long-life materials."],
          ["Service", "Fast order processing, clear communication, and reliable support."],
        ].map(([title, body]) => (
          <article key={title} className="rounded-2xl bg-[var(--background)] p-5 shadow-sm">
            <h2 className="text-lg font-bold text-[var(--primary)]">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">{body}</p>
          </article>
        ))}
      </div>

      <Link href={`${basePath}/shop`} className="mt-8 inline-flex rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white">
        Explore collection
      </Link>
    </div>
  );
}
