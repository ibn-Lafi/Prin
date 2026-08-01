"use client";

import { useState, useTransition } from "react";
import { Plus, X, Pencil } from "lucide-react";
import { formatCurrency } from "@brin/utils";
import {
  createDiscountCodeAction,
  updateDiscountCodeAction,
  toggleDiscountCodeActiveAction,
  type DiscountCodeInput,
} from "@/app/(protected)/offers/actions";
import type { DiscountCode } from "@/lib/types";

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(value: string): string | null {
  if (!value) return null;
  return new Date(value).toISOString();
}

function formatWindow(code: DiscountCode): string | null {
  if (!code.valid_from && !code.valid_until) return null;
  const from = code.valid_from ? new Date(code.valid_from).toLocaleString("ar-SA") : "بدون بداية";
  const until = code.valid_until ? new Date(code.valid_until).toLocaleString("ar-SA") : "بدون نهاية";
  return `${from} — ${until}`;
}

function CodeForm({
  title,
  initial,
  isPending,
  onSubmit,
  onCancel,
}: {
  title: string;
  initial: DiscountCodeInput;
  isPending: boolean;
  onSubmit: (input: DiscountCodeInput) => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState(initial.code);
  const [discountType, setDiscountType] = useState(initial.discountType);
  const [value, setValue] = useState(initial.value.toString());
  const [minOrderAmount, setMinOrderAmount] = useState(initial.minOrderAmount.toString());
  const [validFrom, setValidFrom] = useState(toDatetimeLocal(initial.validFrom));
  const [validUntil, setValidUntil] = useState(toDatetimeLocal(initial.validUntil));
  const [maxUses, setMaxUses] = useState(initial.maxUses?.toString() ?? "");

  return (
    <div className="flex max-w-sm flex-col gap-3 rounded-2xl bg-[var(--color-brand-card)] p-4 ring-1 ring-[var(--color-brand-border)]">
      <div className="flex items-center justify-between">
        <p className="font-semibold">{title}</p>
        <button type="button" onClick={onCancel} aria-label="إغلاق">
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
      <input
        type="text"
        placeholder="الكود (مثال: RAMADAN20)"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 uppercase outline-none focus:border-[var(--color-brand-primary)]"
      />
      <div className="flex gap-2">
        <select
          value={discountType}
          onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed")}
          className="flex-1 rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
        >
          <option value="percentage">نسبة %</option>
          <option value="fixed">مبلغ ثابت</option>
        </select>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          placeholder="القيمة"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-24 rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
        />
      </div>
      <label className="flex flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
        الحد الأدنى لقيمة الطلب (ريال)
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={minOrderAmount}
          onChange={(e) => setMinOrderAmount(e.target.value)}
          className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
        يبدأ (اختياري)
        <input
          type="datetime-local"
          value={validFrom}
          onChange={(e) => setValidFrom(e.target.value)}
          className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
        ينتهي (اختياري)
        <input
          type="datetime-local"
          value={validUntil}
          onChange={(e) => setValidUntil(e.target.value)}
          className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
        الحد الأقصى لعدد الاستخدامات (اختياري)
        <input
          type="number"
          inputMode="numeric"
          min="1"
          step="1"
          value={maxUses}
          onChange={(e) => setMaxUses(e.target.value)}
          placeholder="بدون حد"
          className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
        />
      </label>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          onSubmit({
            code,
            discountType,
            value: Number(value),
            minOrderAmount: Number(minOrderAmount) || 0,
            validFrom: fromDatetimeLocal(validFrom),
            validUntil: fromDatetimeLocal(validUntil),
            maxUses: maxUses.trim() === "" ? null : Number(maxUses),
          })
        }
        className="rounded-xl bg-[var(--color-brand-primary)] px-4 py-2.5 font-semibold text-white disabled:opacity-50"
      >
        {isPending ? "جارِ الحفظ..." : "حفظ"}
      </button>
    </div>
  );
}

export function OffersManager({ codes }: { codes: DiscountCode[] }) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate(input: DiscountCodeInput) {
    setError(null);
    startTransition(async () => {
      const result = await createDiscountCodeAction(input);
      if (result.error) {
        setError(result.error);
        return;
      }
      setIsCreating(false);
    });
  }

  function handleUpdate(codeId: string, input: DiscountCodeInput) {
    setError(null);
    startTransition(async () => {
      const result = await updateDiscountCodeAction(codeId, input);
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditingId(null);
    });
  }

  function handleToggle(codeId: string, nextActive: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await toggleDiscountCodeActiveAction(codeId, nextActive);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-xl bg-[var(--color-brand-primary-light)] px-4 py-2 text-sm font-medium text-[var(--color-brand-primary)]">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {codes.map((code) =>
          editingId === code.id ? (
            <CodeForm
              key={code.id}
              title="تعديل الكود"
              isPending={isPending}
              initial={{
                code: code.code,
                discountType: code.discount_type,
                value: code.value,
                minOrderAmount: code.min_order_amount,
                validFrom: code.valid_from,
                validUntil: code.valid_until,
                maxUses: code.max_uses,
              }}
              onSubmit={(input) => handleUpdate(code.id, input)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div
              key={code.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--color-brand-card)] p-4 ring-1 ring-[var(--color-brand-border)]"
            >
              <div>
                <p className="font-mono font-semibold">{code.code}</p>
                <p className="text-sm text-[var(--color-brand-muted)]">
                  {code.discount_type === "percentage" ? `${code.value}%` : formatCurrency(code.value)}
                  {code.min_order_amount > 0 && ` — حد أدنى ${formatCurrency(code.min_order_amount)}`}
                </p>
                {formatWindow(code) && (
                  <p className="text-xs text-[var(--color-brand-muted)]">{formatWindow(code)}</p>
                )}
                <p className="text-xs text-[var(--color-brand-muted)]">
                  استُخدم {code.times_used} مرة{code.max_uses ? ` من ${code.max_uses}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    code.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-[var(--color-brand-background)] text-[var(--color-brand-muted)]"
                  }`}
                >
                  {code.is_active ? "نشط" : "معطّل"}
                </span>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setEditingId(code.id)}
                  className="flex items-center justify-center rounded-full bg-[var(--color-brand-background)] p-2 ring-1 ring-[var(--color-brand-border)] disabled:opacity-50"
                  aria-label="تعديل"
                >
                  <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleToggle(code.id, !code.is_active)}
                  className="rounded-full bg-[var(--color-brand-background)] px-3 py-1.5 text-xs font-medium ring-1 ring-[var(--color-brand-border)] disabled:opacity-50"
                >
                  {code.is_active ? "تعطيل" : "تفعيل"}
                </button>
              </div>
            </div>
          ),
        )}
      </div>

      {isCreating ? (
        <CodeForm
          title="إضافة كود خصم"
          isPending={isPending}
          initial={{
            code: "",
            discountType: "percentage",
            value: 10,
            minOrderAmount: 0,
            validFrom: null,
            validUntil: null,
            maxUses: null,
          }}
          onSubmit={handleCreate}
          onCancel={() => setIsCreating(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="flex w-fit items-center gap-1.5 rounded-full bg-[var(--color-brand-primary)] px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          إضافة كود خصم
        </button>
      )}
    </div>
  );
}
