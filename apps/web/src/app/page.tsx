export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-2xl bg-neutral-0 p-8 rounded-card shadow-card border border-neutral-200">
        <h1 className="text-display text-brand-900 mb-4">
          TrainTravel
        </h1>
        <p className="text-body-lg text-neutral-500 mb-6">
          Phase 0 Monorepo Scaffold Ready. Next.js + Tailwind CSS + Node.js Express.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 font-medium rounded-chip text-body-sm">
          <span>✓ Phase 0 Scaffold Active</span>
        </div>
      </div>
    </main>
  );
}
