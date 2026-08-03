"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { fetchIncomingOrderDetailsAction } from "@/app/(protected)/actions";
import type { IncomingOrder } from "@/lib/types";
import { OrderInvoiceDetails } from "@/components/OrderInvoiceDetails";

// عرض فاتورة طلب إلكتروني (منتجات، أسعار، عميل، ملاحظات) عند الطلب — تُستدعى
// من قائمة الطلبات الإلكترونية النشطة (الجرس بالكاشير)، بعكس نافذة الطلب
// الوارد اللحظية اللي تظهر مرّة وحدة فقط وقت وصول الطلب.
export function OnlineOrderDetailModal({
  orderId,
  dailyOrderNumber,
  onClose,
}: {
  orderId: string;
  dailyOrderNumber: number;
  onClose: () => void;
}) {
  const [order, setOrder] = useState<IncomingOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchIncomingOrderDetailsAction(orderId).then((result) => {
      if (!cancelled) {
        setOrder(result);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-3xl bg-[var(--color-brand-card)]">
        <div className="flex items-center justify-between border-b border-[var(--color-brand-border)] p-4">
          <p className="font-semibold">تفاصيل الطلب #{dailyOrderNumber}</p>
          <button type="button" onClick={onClose} aria-label="إغلاق">
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <p className="py-6 text-center text-sm text-[var(--color-brand-muted)]">جارِ التحميل...</p>
          ) : order ? (
            <OrderInvoiceDetails order={order} />
          ) : (
            <p className="py-6 text-center text-sm text-[var(--color-brand-muted)]">تعذّر جلب تفاصيل الطلب</p>
          )}
        </div>
      </div>
    </div>
  );
}
