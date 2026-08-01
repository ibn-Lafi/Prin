"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, CreditCard, Gift, MapPin, Phone, Store, Tag, X } from "lucide-react";
import { calculateTax, formatCurrency, roundMoney } from "@brin/utils";
import { useCart } from "@/hooks/useCart";
import { lookupDiscountCodeAction } from "@/app/checkout/actions";
import type { DiscountCodePreview, Reward } from "@/lib/types";

export function CheckoutView({
  customerPhone,
  taxRatePercent,
  isOpen,
  pointsBalance,
  rewards,
}: {
  customerPhone: string;
  taxRatePercent: number;
  isOpen: boolean;
  pointsBalance: number;
  rewards: Reward[];
}) {
  const { items, itemTotal, subtotal } = useCart();

  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
  const [discountCodeInput, setDiscountCodeInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<DiscountCodePreview | null>(null);
  const [isApplyingCode, setIsApplyingCode] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  const affordableRewards = rewards.filter((r) => pointsBalance >= r.points_cost);
  const selectedReward = affordableRewards.find((r) => r.id === selectedRewardId) ?? null;
  const rewardDiscount = selectedReward ? Math.min(selectedReward.discount_amount, subtotal) : 0;
  const afterReward = roundMoney(subtotal - rewardDiscount);

  // نفس ترتيب create_pos_order بالضبط: المكافأة أولاً على المجموع الأصلي، ثم
  // الكود على الناتج — حتى تطابق المعاينة هنا الحساب اللي سيُطبَّق فعلياً وقت
  // تفعيل الدفع الإلكتروني.
  const codeDiscount = appliedCode
    ? Math.min(
        appliedCode.discountType === "percentage"
          ? roundMoney((afterReward * appliedCode.value) / 100)
          : appliedCode.value,
        afterReward,
      )
    : 0;
  const discountedSubtotal = roundMoney(afterReward - codeDiscount);
  const tax = calculateTax(discountedSubtotal, taxRatePercent);
  const total = roundMoney(discountedSubtotal + tax);

  async function handleApplyCode() {
    setCodeError(null);
    setIsApplyingCode(true);
    const result = await lookupDiscountCodeAction(discountCodeInput, subtotal);
    setIsApplyingCode(false);
    if (result.error) {
      setCodeError(result.error);
      return;
    }
    setAppliedCode(result.preview ?? null);
  }

  function handleRemoveCode() {
    setAppliedCode(null);
    setDiscountCodeInput("");
    setCodeError(null);
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-md px-4 py-10 text-center">
        <p className="text-[var(--color-brand-muted)]">سلتك فاضية.</p>
        <Link href="/" className="mt-4 inline-block text-[var(--color-brand-primary)]">
          تصفّح المنيو
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-4 text-xl font-bold">تأكيد الطلب</h1>

      <section className="mb-4 flex flex-col gap-2 rounded-2xl bg-[var(--color-brand-card)] p-4 shadow-sm">
        <p className="mb-1 font-semibold">معلومات الاستلام</p>
        <p className="flex items-center gap-2 text-sm text-[var(--color-brand-muted)]">
          <Phone className="h-4 w-4" strokeWidth={1.75} />
          {customerPhone}
        </p>
        <p className="flex items-center gap-2 text-sm text-[var(--color-brand-muted)]">
          <MapPin className="h-4 w-4" strokeWidth={1.75} />
          استلام من الفرع (Counter Service)
        </p>
      </section>

      <section className="mb-4 flex flex-col gap-3 rounded-2xl bg-[var(--color-brand-card)] p-4 shadow-sm">
        {items.map((item) => (
          <div
            key={item.cartItemId}
            className="flex items-start justify-between border-b border-[var(--color-brand-border)] pb-3 last:border-0 last:pb-0"
          >
            <div>
              <p className="font-semibold">
                {item.name} × {item.quantity}
              </p>
              {item.modifiers.length > 0 && (
                <p className="text-xs text-[var(--color-brand-muted)]">
                  {item.modifiers.map((m) => m.name).join("، ")}
                </p>
              )}
            </div>
            <span className="font-bold">{formatCurrency(itemTotal(item))}</span>
          </div>
        ))}
      </section>

      {affordableRewards.length > 0 && (
        <section className="mb-4 rounded-2xl bg-[var(--color-brand-card)] p-4 shadow-sm">
          <p className="mb-2 flex items-center gap-1.5 font-semibold">
            <Gift className="h-4 w-4 text-[var(--color-brand-primary)]" strokeWidth={1.75} />
            استبدال نقاط (رصيدك: {pointsBalance})
          </p>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedRewardId(null)}
              className={`rounded-xl border px-3 py-2 text-right text-sm ${
                selectedRewardId === null
                  ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary-light)]"
                  : "border-[var(--color-brand-border)]"
              }`}
            >
              بدون استبدال
            </button>
            {affordableRewards.map((reward) => (
              <button
                key={reward.id}
                type="button"
                onClick={() => setSelectedRewardId(reward.id)}
                className={`flex items-center justify-between rounded-xl border px-3 py-2 text-right text-sm ${
                  selectedRewardId === reward.id
                    ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary-light)]"
                    : "border-[var(--color-brand-border)]"
                }`}
              >
                <span>
                  {reward.name} — {reward.points_cost} نقطة
                </span>
                <span className="text-[var(--color-brand-muted)]">
                  -{formatCurrency(reward.discount_amount)}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="mb-4 rounded-2xl bg-[var(--color-brand-card)] p-4 shadow-sm">
        <p className="mb-2 font-semibold">كود خصم</p>
        {appliedCode ? (
          <div className="flex items-center justify-between rounded-xl bg-[var(--color-brand-primary-light)] px-3 py-2.5">
            <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-brand-primary)]">
              <Tag className="h-4 w-4" strokeWidth={1.75} />
              {appliedCode.code}
            </span>
            <button
              type="button"
              onClick={handleRemoveCode}
              className="text-[var(--color-brand-primary)]"
              aria-label="إزالة الكود"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="أدخل الكود"
              value={discountCodeInput}
              onChange={(e) => setDiscountCodeInput(e.target.value)}
              className="flex-1 rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 uppercase outline-none focus:border-[var(--color-brand-primary)]"
            />
            <button
              type="button"
              onClick={handleApplyCode}
              disabled={!discountCodeInput.trim() || isApplyingCode}
              className="rounded-xl bg-[var(--color-brand-background)] px-4 text-sm font-medium ring-1 ring-[var(--color-brand-border)] disabled:opacity-50"
            >
              {isApplyingCode ? "..." : "تطبيق"}
            </button>
          </div>
        )}
        {codeError && <p className="mt-1.5 text-xs font-medium text-[var(--color-brand-primary)]">{codeError}</p>}
      </section>

      <section className="mb-6 flex flex-col gap-1.5 rounded-2xl bg-[var(--color-brand-card)] p-4 shadow-sm">
        <div className="flex justify-between text-sm text-[var(--color-brand-muted)]">
          <span>المجموع الفرعي</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {rewardDiscount > 0 && (
          <div className="flex justify-between text-sm text-[var(--color-brand-primary)]">
            <span>خصم — {selectedReward?.name}</span>
            <span>-{formatCurrency(rewardDiscount)}</span>
          </div>
        )}
        {codeDiscount > 0 && (
          <div className="flex justify-between text-sm text-[var(--color-brand-primary)]">
            <span>خصم — كود {appliedCode?.code}</span>
            <span>-{formatCurrency(codeDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-[var(--color-brand-muted)]">
          <span>الضريبة ({taxRatePercent}%)</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        <div className="mt-1 flex justify-between border-t border-[var(--color-brand-border)] pt-2 text-lg font-bold">
          <span>الإجمالي</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-[var(--color-brand-border)] p-4 text-center">
        {isOpen ? (
          <>
            <Clock
              className="mx-auto mb-2 h-6 w-6 text-[var(--color-brand-muted)]"
              strokeWidth={1.5}
            />
            <p className="mb-3 text-sm text-[var(--color-brand-muted)]">
              الدفع الإلكتروني (مدى / Apple Pay / بطاقات) قيد التفعيل حالياً — الطلبات الإلكترونية
              غير متاحة مؤقتاً.
            </p>
          </>
        ) : (
          <>
            <Store
              className="mx-auto mb-2 h-6 w-6 text-[var(--color-brand-primary)]"
              strokeWidth={1.5}
            />
            <p className="mb-3 text-sm font-medium text-[var(--color-brand-primary)]">
              المطعم مغلق حالياً خارج ساعات العمل — الطلبات الإلكترونية غير متاحة الآن.
            </p>
          </>
        )}
        <button
          type="button"
          disabled
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-brand-border)] px-4 py-3.5 font-semibold text-[var(--color-brand-muted)]"
        >
          <CreditCard className="h-4 w-4" strokeWidth={1.75} />
          الدفع — قريباً
        </button>
      </section>
    </main>
  );
}
