"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-parchment px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-hibiscus/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-hibiscus" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="font-heading text-xl text-balete mb-2">Something went wrong</h1>
        <p className="text-soft text-sm font-sans mb-6">
          We encountered an unexpected issue. Please try again.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-hibiscus text-parchment rounded-xl font-sans font-medium text-sm hover:bg-hibiscus/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}