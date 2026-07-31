"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@brin/database";
import type { IncomingOrder } from "@/lib/types";
import { fetchIncomingOrderDetailsAction, acceptIncomingOrderAction } from "@/app/(protected)/actions";
import { playAlertSound } from "@/lib/alertSound";
import { IncomingOrderPopup } from "@/components/IncomingOrderPopup";
import { PrintStatusIndicator } from "@/components/PrintStatusIndicator";

// يستمع لأي تغيير على الطلبات الأونلاين — بمجرد ما تتحول حالة طلب إلى
// "received" (يعني الدفع نجح عبر Webhook Moyasar)، هذا الإشعار وحده يكفي
// لجلب تفاصيله كاملة (customers/order_items) بأمان عبر Server Action
// بـ service_role، بدل توسيع صلاحية القراءة العامة. راجع migration 0018.
export function IncomingOrdersWatcher() {
  const [queue, setQueue] = useState<IncomingOrder[]>([]);
  const [isAccepting, setIsAccepting] = useState(false);
  const [printingOrder, setPrintingOrder] = useState<IncomingOrder | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel("pos-incoming-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: "channel=eq.online" },
        (payload) => {
          const order = payload.new as { id: string; status: string } | undefined;
          if (!order) return;

          if (order.status !== "received") {
            setQueue((prev) => prev.filter((item) => item.id !== order.id));
            return;
          }

          fetchIncomingOrderDetailsAction(order.id).then((details) => {
            if (!details) return;
            setQueue((prev) =>
              prev.some((item) => item.id === details.id) ? prev : [...prev, details],
            );
            playAlertSound();
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const current = queue[0] ?? null;

  async function handleAccept() {
    if (!current || isAccepting) return;
    setIsAccepting(true);
    const result = await acceptIncomingOrderAction(current.id);
    setIsAccepting(false);
    if (!result.error) {
      setPrintingOrder(current);
      setQueue((prev) => prev.slice(1));
      setTimeout(() => setPrintingOrder(null), 5000);
    }
  }

  if (printingOrder) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
        <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-3xl bg-[var(--color-brand-card)] p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl font-bold text-green-700">
            ✓
          </div>
          <h2 className="text-lg font-bold">تم استلام الطلب #{printingOrder.dailyOrderNumber}</h2>
          <PrintStatusIndicator orderId={printingOrder.id} />
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <IncomingOrderPopup
      order={current}
      remainingCount={queue.length - 1}
      isAccepting={isAccepting}
      onAccept={handleAccept}
    />
  );
}
