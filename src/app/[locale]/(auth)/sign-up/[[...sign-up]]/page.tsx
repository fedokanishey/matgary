import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--muted,#f1f5f9)] to-white p-4">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-xl border border-[var(--border,#e2e8f0)] rounded-2xl",
          },
        }}
      />
    </div>
  );
}
