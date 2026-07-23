"use client";

import { useState } from "react";
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
      <h1 className="mb-4 text-xl font-bold">حسابي</h1>

      <section className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-brand-primary)]">{pointsBalance}</p>
          <p className="text-sm text-gray-500">نقاط الولاء</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
          <p className="text-sm text-gray-500">إجمالي الإنفاق</p>
        </div>
      </section>

      <p className="mb-4 text-sm text-gray-500">جوال: {phone}</p>

      <div className="mb-4 flex gap-2 border-b">
        <button
          type="button"
          onClick={() => setTab("orders")}
          className={`px-3 py-2 ${tab === "orders" ? "border-b-2 border-[var(--color-brand-primary)] font-semibold" : "text-gray-500"}`}
        >
          سجل الطلبات
        </button>
        <button
          type="button"
          onClick={() => setTab("rewards")}
          className={`px-3 py-2 ${tab === "rewards" ? "border-b-2 border-[var(--color-brand-primary)] font-semibold" : "text-gray-500"}`}
        >
          المكافآت
        </button>
      </div>

      {tab === "orders" && (
        <div className="flex flex-col gap-3">
          {orders.length === 0 && <p className="text-sm text-gray-500">ما فيه طلبات سابقة.</p>}
          {orders.map((order) => (
            <div key={order.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-semibold">
                  طلب #{order.daily_order_number} — {CHANNEL_LABELS[order.channel]}
                </p>
                <p className="text-xs text-gray-500">
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
          <p className="text-xs text-gray-500">
            الاستبدال الفعلي يُفعَّل بمرحلة نظام الولاء الكاملة — القائمة هنا للاطّلاع حالياً.
          </p>
          {rewards.length === 0 && (
            <p className="text-sm text-gray-500">ما فيه مكافآت متاحة حالياً.</p>
          )}
          {rewards.map((reward) => {
            const canRedeem = pointsBalance >= reward.points_cost;
            return (
              <div
                key={reward.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-semibold">{reward.name}</p>
                  {reward.description && (
                    <p className="text-xs text-gray-500">{reward.description}</p>
                  )}
                  <p className="text-xs text-gray-500">{reward.points_cost} نقطة</p>
                </div>
                <span
                  className={`rounded px-3 py-1.5 text-xs ${canRedeem ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
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
