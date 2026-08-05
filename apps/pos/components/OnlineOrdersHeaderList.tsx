"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell } from "lucide-react";
import { createSupabaseBrowserClient } from "@brin/database";
import { formatCurrency } from "@brin/utils";
import {
  acceptIncomingOrderAction,
  completeOnlineOrderAction,
  listActiveOnlineOrdersAction,
} from "@/app/(protected)/actions";
import type { ActiveOnlineOrder } from "@/lib/types";
import { getDeviceId, getBranchId } from "@/lib/device";
import { printJob } from "@/lib/printJob";
import { CollectPaymentDialog } from "@/components/CollectPaymentDialog";
import { OnlineOrderDetailModal } from "@/components/OnlineOrderDetailModal";

const STATUS_LABELS: Record<ActiveOnlineOrder["status"], string> = {
  received: "بانتظار القبول",
  accepted: "قيد التحضير",
};

export function OnlineOrdersHeaderList() {
  const [orders, setOrders] = useState<ActiveOnlineOrder[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [collectingOrder, setCollectingOrder] = useState<ActiveOnlineOrder | null>(null);
  const [viewingOrder, setViewingOrder] = useState<ActiveOnlineOrder | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const result = await listActiveOnlineOrdersAction(getBranchId());
      if (!cancelled) setOrders(result);
    }

    load();

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("pos-online-orders-header")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: "channel=eq.online" },
        () => load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  async function refresh() {
    setOrders(await listActiveOnlineOrdersAction(getBranchId()));
  }

  function handleAccept(orderId: string) {
    startTransition(async () => {
      const result = await acceptIncomingOrderAction(orderId, getDeviceId());
      if (result.print) {
        void printJob(result.print.kitchen.id, "kitchen", result.print.kitchen.payload);
        void printJob(result.print.customer.id, "customer", result.print.customer.payload);
      }
      await refresh();
    });
  }

  function handleComplete(orderId: string) {
    startTransition(async () => {
      await completeOnlineOrderAction(orderId);
      await refresh();
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="relative flex items-center gap-1.5 rounded-full bg-[var(--color-brand-background)] px-3 py-2 text-sm font-medium text-[var(--color-brand-muted)] ring-1 ring-[var(--color-brand-border)]"
      >
        <Bell className="h-4 w-4" strokeWidth={1.75} />
        طلبات القائمة الإلكترونية
        {orders.length > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-brand-primary)] px-1 text-xs font-bold text-white">
            {orders.length}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} aria-hidden />
          <div className="absolute left-0 top-full z-40 mt-2 w-80 rounded-2xl bg-[var(--color-brand-card)] p-3 shadow-xl ring-1 ring-[var(--color-brand-border)]">
            {orders.length === 0 ? (
              <p className="p-3 text-center text-sm text-[var(--color-brand-muted)]">
                لا توجد طلبات إلكترونية نشطة
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => setViewingOrder(order)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setViewingOrder(order);
                    }}
                    className="flex cursor-pointer items-center justify-between rounded-xl bg-[var(--color-brand-background)] p-2.5"
                  >
                    <div>
                      <p className="text-sm font-semibold">#{order.dailyOrderNumber}</p>
                      <p className="text-xs text-[var(--color-brand-muted)]">
                        {STATUS_LABELS[order.status]} · {formatCurrency(order.total)}
                      </p>
                    </div>
                    {order.status === "received" ? (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAccept(order.id);
                        }}
                        className="rounded-full bg-[var(--color-brand-primary)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        قبول
                      </button>
                    ) : !order.isPaid ? (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCollectingOrder(order);
                        }}
                        className="rounded-full bg-[var(--color-brand-primary)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        تحصيل الدفع
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleComplete(order.id);
                        }}
                        className="rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        تسليم
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {collectingOrder && (
        <CollectPaymentDialog
          orderId={collectingOrder.id}
          dailyOrderNumber={collectingOrder.dailyOrderNumber}
          total={collectingOrder.total}
          onClose={() => setCollectingOrder(null)}
          onCollected={() => {
            setCollectingOrder(null);
            void refresh();
          }}
        />
      )}

      {viewingOrder && (
        <OnlineOrderDetailModal
          orderId={viewingOrder.id}
          dailyOrderNumber={viewingOrder.dailyOrderNumber}
          onClose={() => setViewingOrder(null)}
        />
      )}
    </div>
  );
}
