"use client";

import { Phone, User } from "lucide-react";
import { formatCurrency } from "@brin/utils";
import type { IncomingOrder } from "@/lib/types";

// محتوى الفاتورة المشترك (عميل + أصناف وأسعار + ملاحظات + إجمالي) — يُستخدم
// بنافذة الطلب الوارد الفورية وبنافذة عرض تفاصيل طلب سابق من قائمة الجرس معاً.
export function OrderInvoiceDetails({ order }: { order: IncomingOrder }) {
  return (
    <>
      {(order.customerName || order.customerPhone) && (
        <div className="mb-4 flex flex-col gap-1 rounded-2xl bg-[var(--color-brand-background)] p-3 text-sm">
          {order.customerName && (
            <span className="flex items-center gap-2">
              <User className="h-4 w-4 text-[var(--color-brand-muted)]" strokeWidth={1.75} />
              {order.customerName}
            </span>
          )}
          {order.customerPhone && (
            <span className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-[var(--color-brand-muted)]" strokeWidth={1.75} />
              {order.customerPhone}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between border-b border-[var(--color-brand-border)] pb-2 last:border-0"
          >
            <div>
              <p className="font-semibold">
                {item.name} × {item.quantity}
              </p>
              {item.modifiers.length > 0 && (
                <p className="text-xs text-[var(--color-brand-muted)]">{item.modifiers.join("، ")}</p>
              )}
            </div>
            <span className="shrink-0 text-sm font-medium text-[var(--color-brand-muted)]">
              {formatCurrency(item.unitPrice * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {order.notes && (
        <div className="mt-4 rounded-2xl bg-[var(--color-brand-primary-light)] p-3 text-sm">
          <p className="mb-1 font-semibold text-[var(--color-brand-primary)]">ملاحظات العميل</p>
          <p>{order.notes}</p>
        </div>
      )}

      <div className="mt-4 flex justify-between border-t border-[var(--color-brand-border)] pt-3 text-lg font-bold">
        <span>الإجمالي</span>
        <span>{formatCurrency(order.total)}</span>
      </div>
    </>
  );
}
