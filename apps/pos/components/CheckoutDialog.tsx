"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { calculateTax, formatCurrency, roundMoney } from "@brin/utils";
import { useOrderTicket } from "@/hooks/useOrderTicket";
import { createOrderAction } from "@/app/(protected)/orders/actions";
import { PrintStatusIndicator } from "@/components/PrintStatusIndicator";

export function CheckoutDialog({
  taxRatePercent,
  onClose,
}: {
  taxRatePercent: number;
  onClose: () => void;
}) {
  const { items, subtotal, clear } = useOrderTicket();
  const tax = calculateTax(subtotal, taxRatePercent);
  const total = roundMoney(subtotal + tax);

  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [cardAmount, setCardAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ orderId: string; dailyOrderNumber: number } | null>(
    null,
  );
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
      const result = await createOrderAction({
        items: items.map((item) => ({
          kind: item.kind,
          refId: item.refId,
          quantity: item.quantity,
          modifierIds: item.modifiers.map((m) => m.modifierId),
        })),
        customerPhone: customerPhone.trim() || null,
        customerName: customerName.trim() || null,
        payments,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      clear();
      setConfirmation({ orderId: result.orderId!, dailyOrderNumber: result.dailyOrderNumber! });
    });
  }

  if (confirmation) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl bg-[var(--color-brand-card)] p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl font-bold text-green-700">
            ✓
          </div>
          <h2 className="text-xl font-bold">تم تأكيد الطلب</h2>
          <p className="text-[var(--color-brand-muted)]">رقم الطلب اليوم</p>
          <p className="text-3xl font-extrabold text-[var(--color-brand-primary)]">
            #{confirmation.dailyOrderNumber}
          </p>
          <PrintStatusIndicator orderId={confirmation.orderId} />
          <button
            type="button"
            onClick={onClose}
            className="mt-2 w-full rounded-2xl bg-[var(--color-brand-primary)] px-4 py-3 font-semibold text-white"
          >
            طلب جديد
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-[var(--color-brand-card)]">
        <div className="flex items-center justify-between border-b border-[var(--color-brand-border)] p-4">
          <h2 className="text-lg font-bold">الدفع</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand-background)]"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-5 flex flex-col gap-1 rounded-2xl bg-[var(--color-brand-background)] p-4">
            <div className="flex justify-between text-sm text-[var(--color-brand-muted)]">
              <span>المجموع الفرعي</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-[var(--color-brand-muted)]">
              <span>الضريبة ({taxRatePercent}%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="mt-1 flex justify-between border-t border-[var(--color-brand-border)] pt-2 text-lg font-bold">
              <span>الإجمالي</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="mb-5">
            <p className="mb-2 font-semibold">عميل (اختياري)</p>
            <div className="flex flex-col gap-2">
              <input
                type="tel"
                inputMode="numeric"
                placeholder="رقم الجوال"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 outline-none focus:border-[var(--color-brand-primary)]"
              />
              <input
                type="text"
                placeholder="الاسم (اختياري)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 outline-none focus:border-[var(--color-brand-primary)]"
              />
            </div>
          </div>

          <div>
            <p className="mb-2 font-semibold">طريقة الدفع</p>
            <div className="mb-2 flex gap-2">
              <button
                type="button"
                onClick={fillAllCash}
                className="flex-1 rounded-xl bg-[var(--color-brand-background)] py-2 text-sm font-medium ring-1 ring-[var(--color-brand-border)]"
              >
                الكل كاش
              </button>
              <button
                type="button"
                onClick={fillAllCard}
                className="flex-1 rounded-xl bg-[var(--color-brand-background)] py-2 text-sm font-medium ring-1 ring-[var(--color-brand-border)]"
              >
                الكل شبكة
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center justify-between gap-3">
                <span className="w-16 shrink-0 text-sm text-[var(--color-brand-muted)]">كاش</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 outline-none focus:border-[var(--color-brand-primary)]"
                />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span className="w-16 shrink-0 text-sm text-[var(--color-brand-muted)]">شبكة</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={cardAmount}
                  onChange={(e) => setCardAmount(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 outline-none focus:border-[var(--color-brand-primary)]"
                />
              </label>
            </div>
            <p
              className={`mt-2 text-sm font-medium ${
                remaining === 0 ? "text-green-700" : "text-[var(--color-brand-primary)]"
              }`}
            >
              {remaining === 0
                ? "المبلغ مطابق"
                : remaining > 0
                  ? `متبقي: ${formatCurrency(remaining)}`
                  : `زيادة: ${formatCurrency(Math.abs(remaining))}`}
            </p>
          </div>

          {error && (
            <p className="mt-3 text-center text-sm font-medium text-[var(--color-brand-primary)]">
              {error}
            </p>
          )}
        </div>

        <div className="shrink-0 border-t border-[var(--color-brand-border)] p-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || remaining !== 0}
            className="w-full rounded-2xl bg-[var(--color-brand-primary)] px-4 py-3.5 font-semibold text-white disabled:opacity-50"
          >
            {isPending ? "جارِ التأكيد..." : "تأكيد الطلب"}
          </button>
        </div>
      </div>
    </div>
  );
}
