"use client";

import { useState } from "react";
import { X, Search, Gift, Phone, User } from "lucide-react";
import { formatCurrency } from "@brin/utils";
import { useCheckoutCustomer } from "@/hooks/useCheckoutCustomer";
import type { Reward } from "@/lib/types";

// يظهر عند الضغط على مكافأة من تبويب "استبدل" — لو ما فيه عميل مربوط بالتذكرة
// بعد، يطلب رقم الجوال أولاً؛ ولو موجود مسبقاً (من ضغطة سابقة بنفس التذكرة)
// يعرض تفاصيله مباشرة. التأكيد يختار المكافأة بنفس حالة الدفع المشتركة —
// تبقى مطبّقة لين الدفع الفعلي بدون إعادة بحث.
export function RewardRedeemModal({ reward, onClose }: { reward: Reward; onClose: () => void }) {
  const { phone, name, customer, hasSearched, isLookingUp, canAfford, setPhone, lookup, selectReward } =
    useCheckoutCustomer();
  const [searchAttempted, setSearchAttempted] = useState(hasSearched);

  const affordable = canAfford(reward);

  async function handleSearch() {
    if (!phone.trim()) return;
    await lookup();
    setSearchAttempted(true);
  }

  function handleApply() {
    selectReward(reward.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-[var(--color-brand-card)]">
        <div className="flex items-center justify-between border-b border-[var(--color-brand-border)] p-4">
          <p className="flex items-center gap-1.5 font-semibold">
            <Gift className="h-4 w-4 text-[var(--color-brand-primary)]" strokeWidth={1.75} />
            {reward.name}
          </p>
          <button type="button" onClick={onClose} aria-label="إغلاق">
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between rounded-xl bg-[var(--color-brand-background)] px-3 py-2.5 text-sm">
            <span>{reward.pointsCost} نقطة</span>
            <span className="font-semibold text-[var(--color-brand-primary)]">
              -{formatCurrency(reward.discountAmount)}
            </span>
          </div>

          {!searchAttempted ? (
            <>
              <p className="text-sm text-[var(--color-brand-muted)]">
                استبدال المكافآت يتطلب عميل مسجّل — أدخل رقم جواله للبحث عن رصيد نقاطه.
              </p>
              <div className="flex gap-2">
                <input
                  type="tel"
                  inputMode="numeric"
                  autoFocus
                  placeholder="رقم الجوال"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 outline-none focus:border-[var(--color-brand-primary)]"
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={!phone.trim() || isLookingUp}
                  className="flex items-center justify-center rounded-xl bg-[var(--color-brand-primary)] px-4 text-white disabled:opacity-50"
                  aria-label="بحث عن العميل"
                >
                  <Search className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </div>
            </>
          ) : isLookingUp ? (
            <p className="text-sm text-[var(--color-brand-muted)]">جارِ البحث...</p>
          ) : customer ? (
            <>
              <div className="flex flex-col gap-1.5 rounded-2xl bg-[var(--color-brand-background)] p-3 text-sm">
                {name && (
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4 text-[var(--color-brand-muted)]" strokeWidth={1.75} />
                    {name}
                  </span>
                )}
                <span className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[var(--color-brand-muted)]" strokeWidth={1.75} />
                  {phone}
                </span>
                <span className="font-semibold">رصيد النقاط: {customer.pointsBalance}</span>
              </div>
              {!affordable && (
                <p className="text-sm font-medium text-[var(--color-brand-primary)]">
                  رصيد النقاط غير كافٍ لهذه المكافأة
                </p>
              )}
              <button
                type="button"
                disabled={!affordable}
                onClick={handleApply}
                className="w-full rounded-2xl bg-[var(--color-brand-primary)] px-4 py-3 font-semibold text-white disabled:opacity-50"
              >
                تطبيق المكافأة
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-[var(--color-brand-muted)]">
                هذا الرقم غير مسجّل — عميل جديد بدون نقاط ولاء، لا يمكنه استبدال مكافآت الآن.
              </p>
              <button
                type="button"
                onClick={() => setSearchAttempted(false)}
                className="w-full rounded-2xl bg-[var(--color-brand-background)] px-4 py-3 text-sm font-medium ring-1 ring-[var(--color-brand-border)]"
              >
                تجربة رقم آخر
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
