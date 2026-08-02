"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@brin/database";
import type { IncomingOrder } from "@/lib/types";
import { fetchIncomingOrderDetailsAction } from "@/app/(protected)/actions";
import { playAlertSound } from "@/lib/alertSound";
import { IncomingOrderPopup } from "@/components/IncomingOrderPopup";

// يستمع لأي طلب إلكتروني جديد (INSERT بجدول orders، channel=online) — الطلب
// يصل "مقبول" تلقائياً من لحظة إنشائه (بدون خطوة قبول يدوية، راجع migration
// 0035) وتذكرة المطبخ تُطبع فوراً من طرف السيرفر عند الإنشاء نفسه، فهذا مجرد
// تنبيه صوتي/بصري للكاشير بوصول الطلب — بدون أي إجراء "قبول" مطلوب منه.
export function IncomingOrdersWatcher() {
  const [queue, setQueue] = useState<IncomingOrder[]>([]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel("pos-incoming-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders", filter: "channel=eq.online" },
        (payload) => {
          const order = payload.new as { id: string } | undefined;
          if (!order) return;

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

  function handleDismiss() {
    setQueue((prev) => prev.slice(1));
  }

  if (!current) return null;

  return (
    <IncomingOrderPopup order={current} remainingCount={queue.length - 1} onDismiss={handleDismiss} />
  );
}
