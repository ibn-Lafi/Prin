"use client";

import { Bell } from "lucide-react";
import type { IncomingOrder } from "@/lib/types";
import { PrintStatusIndicator } from "@/components/PrintStatusIndicator";
import { OrderInvoiceDetails } from "@/components/OrderInvoiceDetails";

export function IncomingOrderPopup({
  order,
  remainingCount,
  onDismiss,
}: {
  order: IncomingOrder;
  remainingCount: number;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-3xl bg-[var(--color-brand-card)]">
        <div className="flex items-center gap-3 bg-[var(--color-brand-primary)] p-5 text-white">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20">
            <Bell className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-sm opacity-90">طلب إلكتروني جديد</p>
            <p className="text-2xl font-extrabold">#{order.dailyOrderNumber}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <OrderInvoiceDetails order={order} />
        </div>

        <div className="shrink-0 border-t border-[var(--color-brand-border)] p-4">
          <div className="mb-3">
            <PrintStatusIndicator orderId={order.id} />
          </div>
          {remainingCount > 0 && (
            <p className="mb-2 text-center text-xs text-[var(--color-brand-muted)]">
              +{remainingCount} طلب آخر بالانتظار
            </p>
          )}
          <button
            type="button"
            onClick={onDismiss}
            className="w-full rounded-2xl bg-[var(--color-brand-primary)] px-4 py-3.5 font-semibold text-white"
          >
            تم الاطّلاع
          </button>
        </div>
      </div>
    </div>
  );
}
