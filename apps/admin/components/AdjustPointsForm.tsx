"use client";

import { useState, useTransition } from "react";
import { adjustPointsAction } from "@/app/(protected)/customers/actions";

export function AdjustPointsForm({
  customerId,
  currentBalance,
}: {
  customerId: string;
  currentBalance: number;
}) {
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(sign: 1 | -1) {
    setError(null);
    setSaved(false);
    const amount = Math.abs(Number(points)) * sign;
    startTransition(async () => {
      const result = await adjustPointsAction(customerId, amount, reason);
      if (result.error) {
        setError(result.error);
        return;
      }
      setPoints("");
      setReason("");
      setSaved(true);
    });
  }

  return (
    <div className="flex h-fit w-full max-w-xs flex-col gap-3 rounded-2xl bg-[var(--color-brand-card)] p-4 ring-1 ring-[var(--color-brand-border)]">
      <p className="font-semibold">تعديل نقاط يدوي</p>
      <p className="text-xs text-[var(--color-brand-muted)]">الرصيد الحالي: {currentBalance}</p>
      <input
        type="number"
        inputMode="numeric"
        min="0"
        step="1"
        placeholder="عدد النقاط"
        value={points}
        onChange={(e) => setPoints(e.target.value)}
        className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 outline-none focus:border-[var(--color-brand-primary)]"
      />
      <textarea
        placeholder="السبب (مطلوب)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={2}
        className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 outline-none focus:border-[var(--color-brand-primary)]"
      />
      {error && <p className="text-sm font-medium text-[var(--color-brand-primary)]">{error}</p>}
      {saved && !error && <p className="text-sm font-medium text-green-700">تم التعديل</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={isPending || !points.trim() || !reason.trim()}
          onClick={() => handleSubmit(1)}
          className="flex-1 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          إضافة
        </button>
        <button
          type="button"
          disabled={isPending || !points.trim() || !reason.trim()}
          onClick={() => handleSubmit(-1)}
          className="flex-1 rounded-xl bg-[var(--color-brand-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          خصم
        </button>
      </div>
    </div>
  );
}
