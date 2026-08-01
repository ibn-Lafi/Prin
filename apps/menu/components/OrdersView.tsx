"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PackageOpen, UtensilsCrossed } from "lucide-react";
import { formatCurrency } from "@brin/utils";
import type { OrderWithItems } from "@/lib/types";
import { addItem } from "@/hooks/useCart";

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "بانتظار الدفع",
  received: "تم الاستلام",
  accepted: "قيد التحضير",
  completed: "مكتمل",
  cancelled: "ملغي",
};

const CURRENT_STATUSES = ["pending_payment", "received", "accepted"];

function OrderCard({ order, showReorder }: { order: OrderWithItems; showReorder: boolean }) {
  const router = useRouter();

  function handleReorder() {
    for (const item of order.items) {
      addItem({
        productId: item.id,
        name: item.name,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        modifiers: item.modifiers,
      });
    }
    router.push("/cart");
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-[var(--color-brand-card)] p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            order.status === "cancelled"
              ? "bg-[var(--color-brand-primary-light)] text-[var(--color-brand-primary)]"
              : "bg-green-100 text-green-700"
          }`}
        >
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
        <span className="text-xs font-semibold text-[var(--color-brand-muted)]">
          #{order.daily_order_number}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--color-brand-primary-light)]">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <UtensilsCrossed
                  className="h-5 w-5 text-[var(--color-brand-primary)]/40"
                  strokeWidth={1.5}
                />
              )}
            </div>
            <span className="flex-1 text-sm">{item.name}</span>
            <span className="text-xs text-[var(--color-brand-muted)]">×{item.quantity}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-[var(--color-brand-border)] pt-3">
        {showReorder ? (
          <button
            type="button"
            onClick={handleReorder}
            className="rounded-full bg-[var(--color-brand-primary)] px-4 py-2 text-xs font-semibold text-white"
          >
            إعادة الطلب
          </button>
        ) : (
          <span />
        )}
        <span className="font-bold">{formatCurrency(order.total)}</span>
      </div>
    </div>
  );
}

export function OrdersView({ orders }: { orders: OrderWithItems[] }) {
  const [tab, setTab] = useState<"current" | "previous">("current");

  const currentOrders = orders.filter((o) => CURRENT_STATUSES.includes(o.status));
  const previousOrders = orders.filter((o) => !CURRENT_STATUSES.includes(o.status));

  return (
    <main className="mx-auto max-w-md px-4 py-6 pb-28">
      <h1 className="mb-4 text-xl font-bold">الطلبات</h1>

      <div className="mb-5 flex rounded-full bg-[var(--color-brand-card)] p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setTab("current")}
          className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-colors ${
            tab === "current" ? "bg-[var(--color-brand-primary)] text-white" : "text-[var(--color-brand-muted)]"
          }`}
        >
          الحالية
        </button>
        <button
          type="button"
          onClick={() => setTab("previous")}
          className={`flex-1 rounded-full py-2.5 text-sm font-semibold transition-colors ${
            tab === "previous" ? "bg-[var(--color-brand-primary)] text-white" : "text-[var(--color-brand-muted)]"
          }`}
        >
          السابقة
        </button>
      </div>

      {tab === "current" ? (
        currentOrders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--color-brand-card)]">
              <PackageOpen className="h-10 w-10 text-[var(--color-brand-primary)]/50" strokeWidth={1.5} />
            </div>
            <p className="font-semibold">لا توجد طلبات حالية</p>
            <p className="text-sm text-[var(--color-brand-muted)]">طلباتك الجديدة ستظهر هنا</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {currentOrders.map((order) => (
              <OrderCard key={order.id} order={order} showReorder={false} />
            ))}
          </div>
        )
      ) : previousOrders.length === 0 ? (
        <p className="py-16 text-center text-sm text-[var(--color-brand-muted)]">ما فيه طلبات سابقة.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {previousOrders.map((order) => (
            <OrderCard key={order.id} order={order} showReorder={order.status === "completed"} />
          ))}
        </div>
      )}
    </main>
  );
}
