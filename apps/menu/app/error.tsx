"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-lg font-semibold">تعذّر تحميل الصفحة</p>
      <p className="text-sm text-gray-500">حصل خلل مؤقت بالاتصال. جرّب مرة ثانية.</p>
      <button
        type="button"
        onClick={reset}
        className="rounded bg-[var(--color-brand-primary)] px-4 py-2 text-white"
      >
        إعادة المحاولة
      </button>
    </main>
  );
}
