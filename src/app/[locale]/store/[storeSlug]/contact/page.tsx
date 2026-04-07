"use client";

import { FormEvent, useState } from "react";
import { useParams } from "next/navigation";

export default function ContactPage() {
  const params = useParams();
  const storeSlug = params?.storeSlug as string;

  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 md:px-8">
      <section className="rounded-3xl bg-[var(--muted)]/40 p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Contact</p>
        <h1 className="mt-2 text-4xl font-black text-[var(--primary)]">We Are Here To Help</h1>
        <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
          Share your question and our team will respond within one business day.
        </p>
      </section>

      <form onSubmit={onSubmit} className="mt-6 space-y-3 rounded-2xl bg-[var(--background)] p-5 shadow-sm">
        <input required placeholder="Your name" className="h-11 w-full rounded-lg bg-[var(--muted)] px-3 text-sm outline-none" />
        <input required type="email" placeholder="Email" className="h-11 w-full rounded-lg bg-[var(--muted)] px-3 text-sm outline-none" />
        <input placeholder="Order number (optional)" className="h-11 w-full rounded-lg bg-[var(--muted)] px-3 text-sm outline-none" />
        <textarea
          required
          placeholder={`Message for ${storeSlug}`}
          className="min-h-36 w-full rounded-lg bg-[var(--muted)] px-3 py-2 text-sm outline-none"
        />

        <button className="h-11 rounded-xl bg-[var(--primary)] px-6 text-sm font-semibold text-white">
          Send message
        </button>

        {submitted && (
          <p className="text-sm text-[var(--muted-foreground)]">
            Message submitted successfully. Our team will contact you soon.
          </p>
        )}
      </form>
    </div>
  );
}
