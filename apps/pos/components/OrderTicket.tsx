"use client";

import { Gift, Minus, Plus, ShoppingBag, Trash2, User, X } from "lucide-react";
import { calculateTax, formatCurrency, roundMoney } from "@brin/utils";
import { useOrderTicket } from "@/hooks/useOrderTicket";
import { useCheckoutCustomer } from "@/hooks/useCheckoutCustomer";

export function OrderTicket({
  taxRatePercent,
  onCheckout,
}: {
  taxRatePercent: number;
  onCheckout: () => void;
}) {
  const { items, itemTotal, updateQuantity, removeItem, subtotal } = useOrderTicket();
  const { name, customer, selectedReward, setPhone, selectReward } = useCheckoutCustomer();
  const tax = calculateTax(subtotal, taxRatePercent);
  const total = roundMoney(subtotal + tax);

  return (
    <aside className="flex h-full w-96 shrink-0 flex-col border-r border-[var(--color-brand-border)] bg-[var(--color-brand-card)]">
      <div className="border-b border-[var(--color-brand-border)] p-4">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
          الطلب الحالي
        </h2>
      </div>

      {customer && (
        <div className="flex items-center justify-between gap-2 border-b border-[var(--color-brand-border)] bg-[var(--color-brand-background)] px-4 py-2.5 text-sm">
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1.5 font-medium">
              <User className="h-3.5 w-3.5 text-[var(--color-brand-muted)]" strokeWidth={1.75} />
              {name || "بدون اسم"} — {customer.pointsBalance} نقطة
            </span>
            {selectedReward && (
              <span className="flex items-center gap-1.5 text-xs text-[var(--color-brand-primary)]">
                <Gift className="h-3.5 w-3.5" strokeWidth={1.75} />
                {selectedReward.name} — -{formatCurrency(selectedReward.discountAmount)}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              selectReward(null);
              setPhone("");
            }}
            className="shrink-0 p-1 text-[var(--color-brand-muted)]"
            aria-label="إزالة العميل"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {items.length === 0 ? (
          <p className="py-10 text-center text-sm text-[var(--color-brand-muted)]">
            التذكرة فارغة — اختر أصنافاً من القائمة.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div key={item.ticketItemId} className="rounded-2xl bg-[var(--color-brand-background)] p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    {item.modifiers.length > 0 && (
                      <p className="text-xs text-[var(--color-brand-muted)]">
                        {item.modifiers.map((m) => m.name).join("، ")}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.ticketItemId)}
                    className="p-1 text-[var(--color-brand-muted)]"
                    aria-label="حذف"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.ticketItemId, item.quantity - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-brand-card)] ring-1 ring-[var(--color-brand-border)]"
                      aria-label="إنقاص الكمية"
                    >
                      <Minus className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                    <span className="min-w-4 text-center font-medium">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.ticketItemId, item.quantity + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-brand-card)] ring-1 ring-[var(--color-brand-border)]"
                      aria-label="زيادة الكمية"
                    >
                      <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                  </div>
                  <span className="font-bold text-[var(--color-brand-primary)]">
                    {formatCurrency(itemTotal(item))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="shrink-0 border-t border-[var(--color-brand-border)] p-4">
          <div className="mb-3 flex flex-col gap-1">
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
          <button
            type="button"
            onClick={onCheckout}
            className="w-full rounded-2xl bg-[var(--color-brand-primary)] px-4 py-3.5 font-semibold text-white"
          >
            الدفع
          </button>
        </div>
      )}
    </aside>
  );
}
