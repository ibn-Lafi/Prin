"use client";

import { useState, useTransition } from "react";
import { PauseCircle, PlayCircle } from "lucide-react";
import { toggleAcceptingOrdersAction } from "@/app/(protected)/settings/actions";

export function AcceptingOrdersToggle({ isAcceptingOrders }: { isAcceptingOrders: boolean }) {
  const [isOpen, setIsOpen] = useState(isAcceptingOrders);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const next = !isOpen;
    setError(null);
    startTransition(async () => {
      const result = await toggleAcceptingOrdersAction(next);
      if (result.error) {
        setError(result.error);
        return;
      }
      setIsOpen(next);
    });
  }

  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-2xl p-5 ring-1 ${
        isOpen
          ? "bg-[var(--color-brand-card)] ring-[var(--color-brand-border)]"
          : "bg-[var(--color-brand-primary-light)] ring-[var(--color-brand-primary)]"
      }`}
    >
      <div>
        <p className="font-semibold">
          {isOpen ? "المنيو الإلكتروني يستقبل طلبات الآن" : "المنيو الإلكتروني مغلق يدوياً"}
        </p>
        <p className="text-sm text-[var(--color-brand-muted)]">
          {isOpen
            ? "يقفل تلقائياً خارج ساعات العمل المضبوطة، أو أوقفه الآن يدوياً بأي وقت."
            : "مغلق يدوياً بغض النظر عن ساعات العمل — العملاء ما يقدرون يكملون طلب إلكتروني."}
        </p>
        {error && <p className="mt-1 text-sm font-medium text-[var(--color-brand-primary)]">{error}</p>}
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={handleToggle}
        className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${
          isOpen ? "bg-[var(--color-brand-primary)]" : "bg-green-600"
        }`}
      >
        {isOpen ? (
          <>
            <PauseCircle className="h-4 w-4" strokeWidth={2} />
            إغلاق الاستقبال الآن
          </>
        ) : (
          <>
            <PlayCircle className="h-4 w-4" strokeWidth={2} />
            إعادة فتح الاستقبال
          </>
        )}
      </button>
    </div>
  );
}
