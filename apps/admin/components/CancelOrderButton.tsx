"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelOrderAction } from "@/app/(protected)/orders/actions";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelOrderAction(orderId, reason);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="h-fit rounded-xl bg-[var(--color-brand-primary-light)] px-4 py-2.5 text-sm font-medium text-[var(--color-brand-primary)]"
      >
        إلغاء الطلب
      </button>
    );
  }

  return (
    <div className="flex h-fit max-w-xs flex-col gap-3 rounded-2xl bg-[var(--color-brand-card)] p-4 ring-1 ring-[var(--color-brand-border)]">
      <p className="font-semibold">سبب الإلغاء</p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2 text-sm outline-none focus:border-[var(--color-brand-primary)]"
        placeholder="مطلوب — سيُسجَّل بسجل التدقيق"
      />
      {error && <p className="text-sm font-medium text-[var(--color-brand-primary)]">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={handleCancel}
          className="flex-1 rounded-xl bg-[var(--color-brand-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isPending ? "جارِ الإلغاء..." : "تأكيد الإلغاء"}
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="rounded-xl bg-[var(--color-brand-background)] px-4 py-2.5 text-sm font-medium ring-1 ring-[var(--color-brand-border)]"
        >
          تراجع
        </button>
      </div>
    </div>
  );
}
