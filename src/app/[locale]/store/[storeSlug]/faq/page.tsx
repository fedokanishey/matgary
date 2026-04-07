const faqs = [
  {
    q: "How long does shipping take?",
    a: "Most orders are processed within 24 hours and delivered within 2-5 business days depending on destination.",
  },
  {
    q: "Can I return a product?",
    a: "Yes, eligible products can be returned within 14 days from delivery in their original condition.",
  },
  {
    q: "Do you support cash on delivery?",
    a: "Available payment methods depend on store settings and your shipping location.",
  },
  {
    q: "How can I track my order?",
    a: "After checkout, open My Orders and select Tracking for real-time status updates.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 md:px-8">
      <section className="rounded-3xl bg-[var(--muted)]/40 p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Support</p>
        <h1 className="mt-2 text-4xl font-black text-[var(--primary)]">Frequently Asked Questions</h1>
      </section>

      <div className="mt-6 space-y-3">
        {faqs.map((item) => (
          <article key={item.q} className="rounded-2xl bg-[var(--background)] p-5 shadow-sm">
            <h2 className="text-lg font-bold text-[var(--primary)]">{item.q}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">{item.a}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
