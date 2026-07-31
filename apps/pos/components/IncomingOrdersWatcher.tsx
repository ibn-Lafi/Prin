"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@brin/database";
import type { IncomingOrder } from "@/lib/types";
import { fetchIncomingOrderDetailsAction, acceptIncomingOrderAction } from "@/app/(protected)/actions";
import { playAlertSound } from "@/lib/alertSound";
import { IncomingOrderPopup } from "@/components/IncomingOrderPopup";

// يستمع لأي تغيير على الطلبات الأونلاين — بمجرد ما تتحول حالة طلب إلى
// "received" (يعني الدفع نجح عبر Webhook Moyasar)، هذا الإشعار وحده يكفي
// لجلب تفاصيله كاملة (customers/order_items) بأمان عبر Server Action
// بـ service_role، بدل توسيع صلاحية القراءة العامة. راجع migration 0018.
export function IncomingOrdersWatcher() {
  const [queue, setQueue] = useState<IncomingOrder[]>([]);
  const [isAccepting, setIsAccepting] = useState(false);

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
      setQueue((prev) => prev.slice(1));
    }
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
