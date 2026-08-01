"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@brin/utils";
import { saveCashClosingAction } from "@/app/(protected)/reports/closing/actions";

export function CashClosingForm({
  closingDate,
  expectedCash,
  existing,
}: {
  closingDate: string;
  expectedCash: number;
  existing: { expected_cash: number; actual_cash: number; difference: number; notes: string | null } | null;
}) {
  const router = useRouter();
  const [date, setDate] = useState(closingDate);
  const [actualCash, setActualCash] = useState(existing?.actual_cash.toString() ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const actual = Number(actualCash) || 0;
  const difference = actual - expectedCash;

  function handleDateChange(value: string) {
    setDate(value);
    router.push(`/reports/closing?date=${value}`);
  }

  function handleSave() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveCashClosingAction({ closingDate: date, actualCash: actual, notes });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="flex max-w-md flex-col gap-4 rounded-2xl bg-[var(--color-brand-card)] p-5 ring-1 ring-[var(--color-brand-border)]">
      <label className="flex flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
        التاريخ
        <input
          type="date"
          value={date}
          onChange={(e) => handleDateChange(e.target.value)}
          className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
        />
      </label>

      <div className="rounded-xl bg-[var(--color-brand-background)] p-3">
        <p className="text-sm text-[var(--color-brand-muted)]">الكاش المتوقع (من الطلبات المسجّلة)</p>
        <p className="text-lg font-bold">{formatCurrency(expectedCash)}</p>
      </div>

      <label className="flex flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
        الكاش الفعلي (بعد العدّ)
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={actualCash}
          onChange={(e) => setActualCash(e.target.value)}
          className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
        />
      </label>

      {actualCash.trim() !== "" && (
        <p
          className={`text-sm font-medium ${
            difference === 0
              ? "text-green-700"
              : "text-[var(--color-brand-primary)]"
          }`}
        >
          {difference === 0
            ? "مطابق"
            : difference > 0
              ? `زيادة: ${formatCurrency(difference)}`
              : `عجز: ${formatCurrency(Math.abs(difference))}`}
        </p>
      )}

      <label className="flex flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
        ملاحظات (اختياري)
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
        />
      </label>

      {error && <p className="text-sm font-medium text-[var(--color-brand-primary)]">{error}</p>}
      {saved && !error && <p className="text-sm font-medium text-green-700">تم حفظ الإقفال</p>}

      <button
        type="button"
        disabled={isPending}
        onClick={handleSave}
        className="rounded-xl bg-[var(--color-brand-primary)] px-4 py-2.5 font-semibold text-white disabled:opacity-50"
      >
        {isPending ? "جارِ الحفظ..." : "حفظ الإقفال"}
      </button>
    </div>
  );
}
