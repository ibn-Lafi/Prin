"use client";

import { useState, useTransition } from "react";
import { Check, Package, Pencil, Phone, Sparkles } from "lucide-react";
import { formatCurrency } from "@brin/utils";
import { updateNameAction } from "@/app/account/actions";

export function AccountView({
  fullName: initialFullName,
  phone,
  pointsBalance,
  totalSpent,
}: {
  fullName: string;
  phone: string;
  pointsBalance: number;
  totalSpent: number;
}) {
  const [fullName, setFullName] = useState(initialFullName);
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(initialFullName);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateNameAction(draftName);
      if (result.error) {
        setError(result.error);
        return;
      }
      setFullName(draftName.trim());
      setIsEditing(false);
    });
  }

  return (
    <main className="mx-auto max-w-md px-4 py-6 pb-28">
      <h1 className="mb-4 text-xl font-bold">حسابي</h1>

      <section className="mb-6 flex flex-col gap-3 rounded-2xl bg-[var(--color-brand-card)] p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--color-brand-muted)]">الاسم</span>
          {!isEditing && (
            <button
              type="button"
              onClick={() => {
                setDraftName(fullName);
                setError(null);
                setIsEditing(true);
              }}
              className="flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-primary)]"
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
              تعديل
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="اسمك الكامل"
              autoFocus
              className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 outline-none focus:border-[var(--color-brand-primary)]"
            />
            {error && <p className="text-xs font-medium text-[var(--color-brand-primary)]">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={handleSave}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--color-brand-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Check className="h-4 w-4" strokeWidth={2} />
                {isPending ? "جارِ الحفظ..." : "حفظ"}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => setIsEditing(false)}
                className="rounded-xl bg-[var(--color-brand-background)] px-4 py-2.5 text-sm font-medium text-[var(--color-brand-muted)] ring-1 ring-[var(--color-brand-border)]"
              >
                إلغاء
              </button>
            </div>
          </div>
        ) : (
          <p className="font-semibold">{fullName || "بدون اسم"}</p>
        )}

        <div className="flex items-center gap-2 border-t border-[var(--color-brand-border)] pt-3 text-sm text-[var(--color-brand-muted)]">
          <Phone className="h-4 w-4" strokeWidth={1.75} />
          {phone}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center gap-1 rounded-2xl bg-[var(--color-brand-card)] p-4 text-center shadow-sm">
          <Sparkles className="mb-1 h-5 w-5 text-[var(--color-brand-primary)]" strokeWidth={1.75} />
          <p className="text-2xl font-bold text-[var(--color-brand-primary)]">{pointsBalance}</p>
          <p className="text-xs text-[var(--color-brand-muted)]">نقاط الولاء</p>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-2xl bg-[var(--color-brand-card)] p-4 text-center shadow-sm">
          <Package className="mb-1 h-5 w-5 text-[var(--color-brand-muted)]" strokeWidth={1.75} />
          <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
          <p className="text-xs text-[var(--color-brand-muted)]">إجمالي الإنفاق</p>
        </div>
      </section>
    </main>
  );
}
