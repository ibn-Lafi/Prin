"use client";

import { useEffect, useState, useTransition } from "react";
import { X, Search, Gift, Tag } from "lucide-react";
import { calculateTax, formatCurrency, roundMoney } from "@brin/utils";
import { useOrderTicket } from "@/hooks/useOrderTicket";
import {
  createOrderAction,
  lookupCustomerAction,
  listActiveRewardsAction,
  lookupDiscountCodeAction,
} from "@/app/(protected)/orders/actions";
import { PrintStatusIndicator } from "@/components/PrintStatusIndicator";
import { getStationId } from "@/lib/device";
import type { CustomerLookup, Reward, DiscountCodePreview } from "@/lib/types";

export function CheckoutDialog({
  taxRatePercent,
  onClose,
}: {
  taxRatePercent: number;
  onClose: () => void;
}) {
  const { items, subtotal, clear } = useOrderTicket();

  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customer, setCustomer] = useState<CustomerLookup | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(null);
  const [discountCodeInput, setDiscountCodeInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<DiscountCodePreview | null>(null);
  const [isApplyingCode, setIsApplyingCode] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [cashAmount, setCashAmount] = useState("");
  const [cardAmount, setCardAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ orderId: string; dailyOrderNumber: number } | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    listActiveRewardsAction().then(setRewards);
  }, []);

  const affordableRewards = customer
    ? rewards.filter((r) => customer.pointsBalance >= r.pointsCost)
    : [];

  // نقيّد الاختيار الفعّال بقائمة المتاح بها فعلاً — لو تغيّر رصيد العميل (مثلاً بعد
  // بحث ثانٍ) وأصبحت المكافأة المختارة سابقاً غير متاحة، يلغى الخصم تلقائياً بدل
  // ما يبقى مطبّقاً بصمت وهو مو ظاهر كمُختار بالقائمة.
  const selectedReward = affordableRewards.find((r) => r.id === selectedRewardId) ?? null;
  const rewardDiscount = selectedReward ? Math.min(selectedReward.discountAmount, subtotal) : 0;
  const afterReward = roundMoney(subtotal - rewardDiscount);

  // نفس ترتيب create_pos_order بالضبط: المكافأة أولاً على المجموع الأصلي،
  // ثم الكود على الناتج — أي معاينة هنا لازم تطابق حساب الخادم وإلا يفشل
  // الإرسال بخطأ "مجموع الدفعات لا يساوي الإجمالي".
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

  const cash = Number(cashAmount) || 0;
  const card = Number(cardAmount) || 0;
  const paid = roundMoney(cash + card);
  const remaining = roundMoney(total - paid);

  function handlePhoneChange(value: string) {
    setCustomerPhone(value);
    setCustomer(null);
    setSelectedRewardId(null);
  }

  async function handleLookup() {
    const phone = customerPhone.trim();
    if (!phone) return;
    setIsLookingUp(true);
    const result = await lookupCustomerAction(phone);
    setIsLookingUp(false);
    setCustomer(result);
    if (result?.fullName && !customerName.trim()) {
      setCustomerName(result.fullName);
    }
  }

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
        rewardId: selectedReward?.id ?? null,
        discountCode: appliedCode?.code ?? null,
        stationId: getStationId(),
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
          <div className="mb-5">
            <p className="mb-2 font-semibold">عميل (اختياري)</p>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="رقم الجوال"
                  value={customerPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="flex-1 rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 outline-none focus:border-[var(--color-brand-primary)]"
                />
                <button
                  type="button"
                  onClick={handleLookup}
                  disabled={!customerPhone.trim() || isLookingUp}
                  className="flex items-center justify-center rounded-xl bg-[var(--color-brand-background)] px-3 ring-1 ring-[var(--color-brand-border)] disabled:opacity-50"
                  aria-label="بحث عن العميل"
                >
                  <Search className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </div>
              <input
                type="text"
                placeholder="الاسم (اختياري)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 outline-none focus:border-[var(--color-brand-primary)]"
              />
            </div>

            {isLookingUp && (
              <p className="mt-2 text-sm text-[var(--color-brand-muted)]">جارِ البحث...</p>
            )}

            {!isLookingUp && customer && (
              <div className="mt-3 rounded-2xl bg-[var(--color-brand-background)] p-3">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                  <Gift className="h-4 w-4 text-[var(--color-brand-primary)]" strokeWidth={1.75} />
                  رصيد النقاط: {customer.pointsBalance}
                </p>
                {affordableRewards.length === 0 ? (
                  <p className="text-xs text-[var(--color-brand-muted)]">لا توجد مكافآت متاحة برصيده الحالي</p>
                ) : (
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
                        <span>{reward.name} — {reward.pointsCost} نقطة</span>
                        <span className="text-[var(--color-brand-muted)]">
                          -{formatCurrency(reward.discountAmount)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!isLookingUp && customerPhone.trim() && customer === null && (
              <p className="mt-2 text-xs text-[var(--color-brand-muted)]">
                عميل جديد — بدون نقاط ولاء سابقة
              </p>
            )}
          </div>

          <div className="mb-5">
            <p className="mb-2 font-semibold">كود خصم (اختياري)</p>
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
            {codeError && (
              <p className="mt-1.5 text-xs font-medium text-[var(--color-brand-primary)]">{codeError}</p>
            )}
          </div>

          <div className="mb-5 flex flex-col gap-1 rounded-2xl bg-[var(--color-brand-background)] p-4">
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
