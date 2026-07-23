"use client";

import { useState } from "react";
import { Gift, Package, Sparkles } from "lucide-react";
import { formatCurrency } from "@brin/utils";
import type { OrderSummary, Reward } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "بانتظار الدفع",
  received: "تم الاستلام",
  accepted: "قيد التحضير",
  cancelled: "ملغي",
};

const CHANNEL_LABELS: Record<string, string> = {
  pos: "كاشير",
  online: "إلكتروني",
};

type Tab = "orders" | "rewards";

export function AccountView({
  phone,
  pointsBalance,
  totalSpent,
  orders,
  rewards,
}: {
  phone: string;
  pointsBalance: number;
  totalSpent: number;
  orders: OrderSummary[];
  rewards: Reward[];
}) {
  const [tab, setTab] = useState<Tab>("orders");

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-1 text-xl font-bold">حسابي</h1>
      <p className="mb-4 text-sm text-[var(--color-brand-muted)]">{phone}</p>

      <section className="mb-6 grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center gap-1 rounded-2xl bg-[var(--color-brand-card)] p-4 text-center shadow-sm">
          <Sparkles className="mb-1 h-5 w-5 text-[var(--color-brand-primary)]" strokeWidth={1.75} />
          <p className="text-2xl font-bold text-[var(--color-brand-primary)]">{pointsBalance}</p>
          <p className="text-xs text-[var(--color-brand-muted)]">نقاط الولاء</p>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-2xl bg-[var(--color-brand-card)] p-4 text-center shadow-sm">
          <Package className="mb-1 h-5 w-5 text-[var(--color-brand-muted)]" strokeWidth={1.75} />
          <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
          <p className="text-xs text-[var(--color-brand-muted)]">إجمالي الإنفاق</p>
        </div>
      </section>

      <div className="mb-4 flex gap-2 border-b border-[var(--color-brand-border)]">
        <button
          type="button"
          onClick={() => setTab("orders")}
          className={`px-3 py-2 text-sm font-medium ${tab === "orders" ? "border-b-2 border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]" : "text-[var(--color-brand-muted)]"}`}
        >
          سجل الطلبات
        </button>
        <button
          type="button"
          onClick={() => setTab("rewards")}
          className={`px-3 py-2 text-sm font-medium ${tab === "rewards" ? "border-b-2 border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]" : "text-[var(--color-brand-muted)]"}`}
        >
          المكافآت
        </button>
      </div>

      {tab === "orders" && (
        <div className="flex flex-col gap-3">
          {orders.length === 0 && (
            <p className="text-sm text-[var(--color-brand-muted)]">ما فيه طلبات سابقة.</p>
          )}
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between rounded-2xl bg-[var(--color-brand-card)] p-3.5 shadow-sm"
            >
              <div>
                <p className="font-semibold">
                  طلب #{order.daily_order_number} — {CHANNEL_LABELS[order.channel]}
                </p>
                <p className="text-xs text-[var(--color-brand-muted)]">
                  {order.order_date} · {STATUS_LABELS[order.status] ?? order.status}
                </p>
              </div>
              <span className="font-bold">{formatCurrency(order.total)}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "rewards" && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-[var(--color-brand-muted)]">
            الاستبدال الفعلي يُفعَّل بمرحلة نظام الولاء الكاملة — القائمة هنا للاطّلاع حالياً.
          </p>
          {rewards.length === 0 && (
            <p className="text-sm text-[var(--color-brand-muted)]">ما فيه مكافآت متاحة حالياً.</p>
          )}
          {rewards.map((reward) => {
            const canRedeem = pointsBalance >= reward.points_cost;
            return (
              <div
                key={reward.id}
                className="flex items-center justify-between rounded-2xl bg-[var(--color-brand-card)] p-3.5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary-light)]">
                    <Gift
                      className="h-5 w-5 text-[var(--color-brand-primary)]"
                      strokeWidth={1.75}
                    />
                  </div>
                  <div>
                    <p className="font-semibold">{reward.name}</p>
                    {reward.description && (
                      <p className="text-xs text-[var(--color-brand-muted)]">
                        {reward.description}
                      </p>
                    )}
                    <p className="text-xs text-[var(--color-brand-muted)]">
                      {reward.points_cost} نقطة
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${canRedeem ? "bg-green-100 text-green-700" : "bg-[var(--color-brand-background)] text-[var(--color-brand-muted)]"}`}
                >
                  {canRedeem ? "رصيدك يكفي" : "رصيد غير كافٍ"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
