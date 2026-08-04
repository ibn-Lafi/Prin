"use client";

import { useState, useTransition } from "react";
import { PauseCircle, PlayCircle } from "lucide-react";
import { toggleBranchAcceptingOrdersAction } from "@/app/(protected)/branches/actions";

type BranchToggleRow = { id: string; name: string; is_accepting_orders: boolean };

export function BranchesAcceptingOrdersList({ branches }: { branches: BranchToggleRow[] }) {
  const [states, setStates] = useState(
    Object.fromEntries(branches.map((b) => [b.id, b.is_accepting_orders])),
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (branches.length === 0) return null;

  function handleToggle(branchId: string, next: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await toggleBranchAcceptingOrdersAction(branchId, next);
      if (result.error) {
        setError(result.error);
        return;
      }
      setStates((prev) => ({ ...prev, [branchId]: next }));
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {branches.map((branch) => {
        const isOpen = states[branch.id] ?? branch.is_accepting_orders;
        return (
          <div
            key={branch.id}
            className={`flex items-center justify-between gap-4 rounded-2xl p-5 ring-1 ${
              isOpen
                ? "bg-[var(--color-brand-card)] ring-[var(--color-brand-border)]"
                : "bg-[var(--color-brand-primary-light)] ring-[var(--color-brand-primary)]"
            }`}
          >
            <div>
              <p className="font-semibold">{branch.name}</p>
              <p className="text-sm text-[var(--color-brand-muted)]">
                {isOpen ? "يستقبل طلبات القائمة الإلكترونية الآن" : "مغلق يدوياً — لا يستقبل طلبات إلكترونية"}
              </p>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleToggle(branch.id, !isOpen)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${
                isOpen ? "bg-[var(--color-brand-primary)]" : "bg-green-600"
              }`}
            >
              {isOpen ? (
                <>
                  <PauseCircle className="h-4 w-4" strokeWidth={2} />
                  إغلاق الاستقبال
                </>
              ) : (
                <>
                  <PlayCircle className="h-4 w-4" strokeWidth={2} />
                  إعادة الفتح
                </>
              )}
            </button>
          </div>
        );
      })}
      {error && <p className="text-sm font-medium text-[var(--color-brand-primary)]">{error}</p>}
    </div>
  );
}
