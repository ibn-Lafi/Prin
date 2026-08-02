"use client";

import { useState, useTransition } from "react";
import { LogOut, X } from "lucide-react";
import { formatCurrency } from "@brin/utils";
import { closeShiftAndSummarizeAction, logoutAction } from "@/app/(protected)/actions";
import type { ShiftSummary } from "@/lib/types";

export function LogoutButton() {
  const [summary, setSummary] = useState<ShiftSummary | null | undefined>(undefined);
  const [isPending, startTransition] = useTransition();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  function handleClick() {
    startTransition(async () => {
      const result = await closeShiftAndSummarizeAction();
      setSummary(result);
    });
  }

  function handleConfirmLogout() {
    setIsLoggingOut(true);
    startTransition(async () => {
      await logoutAction();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="flex items-center gap-1.5 rounded-full bg-[var(--color-brand-background)] px-3 py-2 text-sm font-medium text-[var(--color-brand-muted)] ring-1 ring-[var(--color-brand-border)] disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" strokeWidth={1.75} />
        خروج
      </button>

      {summary !== undefined && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[var(--color-brand-card)] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">ملخص الجلسة</h2>
              <button
                type="button"
                onClick={() => setSummary(undefined)}
                aria-label="إغلاق"
                disabled={isLoggingOut}
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            {summary === null ? (
              <p className="mb-5 text-sm text-[var(--color-brand-muted)]">
                ما فيه جلسة عمل نشطة لعرض ملخصها.
              </p>
            ) : (
              <div className="mb-5 flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--color-brand-muted)]">كاش</span>
                  <span className="font-semibold">{formatCurrency(summary.cash)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-brand-muted)]">شبكة</span>
                  <span className="font-semibold">{formatCurrency(summary.cardTerminal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-brand-muted)]">المنيو الإلكتروني</span>
                  <span className="font-semibold">{formatCurrency(summary.online)}</span>
                </div>
                <div className="flex justify-between border-t border-[var(--color-brand-border)] pt-2 text-base font-bold">
                  <span>الإجمالي</span>
                  <span>{formatCurrency(summary.total)}</span>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={isLoggingOut}
              onClick={handleConfirmLogout}
              className="w-full rounded-2xl bg-[var(--color-brand-primary)] px-4 py-3 font-semibold text-white disabled:opacity-50"
            >
              {isLoggingOut ? "جارِ تسجيل الخروج..." : "تسجيل الخروج"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
