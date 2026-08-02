"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { formatCurrency, roundMoney } from "@brin/utils";
import { collectOnlinePaymentAction } from "@/app/(protected)/actions";
import { getStationId } from "@/lib/device";

export function CollectPaymentDialog({
  orderId,
  dailyOrderNumber,
  total,
  onClose,
  onCollected,
}: {
  orderId: string;
  dailyOrderNumber: number;
  total: number;
  onClose: () => void;
  onCollected: () => void;
}) {
  const [cashAmount, setCashAmount] = useState(total.toFixed(2));
  const [cardAmount, setCardAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const cash = Number(cashAmount) || 0;
  const card = Number(cardAmount) || 0;
  const paid = roundMoney(cash + card);
  const remaining = roundMoney(total - paid);

  function fillAllCash() {
    setCashAmount(total.toFixed(2));
    setCardAmount("");
  }

  function fillAllCard() {
    setCardAmount(total.toFixed(2));
    setCashAmount("");
  }

  function handleSubmit() {
    setError(null);
    if (remaining !== 0) {
      setError("مجموع الدفعات لازم يساوي الإجمالي بالضبط");
      return;
    }

    const payments: { method: "cash" | "card_terminal"; amount: number }[] = [];
    if (cash > 0) payments.push({ method: "cash", amount: cash });
    if (card > 0) payments.push({ method: "card_terminal", amount: card });
    if (payments.length === 0) {
      setError("أدخل مبلغ الدفع");
      return;
    }

    startTransition(async () => {
      const result = await collectOnlinePaymentAction(orderId, payments, getStationId());
      if (result.error) {
        setError(result.error);
        return;
      }
      onCollected();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="flex w-full max-w-sm flex-col overflow-hidden rounded-t-3xl bg-[var(--color-brand-card)] sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-[var(--color-brand-border)] p-4">
          <p className="font-semibold">تحصيل دفع الطلب #{dailyOrderNumber}</p>
          <button type="button" onClick={onClose} aria-label="إغلاق">
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <p className="text-center text-2xl font-bold">{formatCurrency(total)}</p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={fillAllCash}
              className="flex-1 rounded-xl bg-[var(--color-brand-background)] px-3 py-2 text-sm font-medium ring-1 ring-[var(--color-brand-border)]"
            >
              الكل كاش
            </button>
            <button
              type="button"
              onClick={fillAllCard}
              className="flex-1 rounded-xl bg-[var(--color-brand-background)] px-3 py-2 text-sm font-medium ring-1 ring-[var(--color-brand-border)]"
            >
              الكل شبكة
            </button>
          </div>

          <label className="flex flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
            كاش
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
            شبكة
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={cardAmount}
              onChange={(e) => setCardAmount(e.target.value)}
              className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
            />
          </label>

          {remaining !== 0 && (
            <p className="text-center text-sm font-medium text-[var(--color-brand-primary)]">
              {remaining > 0 ? `متبقي ${formatCurrency(remaining)}` : `زائد ${formatCurrency(-remaining)}`}
            </p>
          )}
          {error && <p className="text-center text-sm font-medium text-[var(--color-brand-primary)]">{error}</p>}

          <button
            type="button"
            disabled={isPending}
            onClick={handleSubmit}
            className="rounded-xl bg-[var(--color-brand-primary)] px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {isPending ? "جارِ التحصيل..." : "تأكيد التحصيل"}
          </button>
        </div>
      </div>
    </div>
  );
}
