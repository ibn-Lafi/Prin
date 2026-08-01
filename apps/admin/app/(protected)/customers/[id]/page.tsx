import { notFound } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@brin/utils";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { AdjustPointsForm } from "@/components/AdjustPointsForm";

const CHANNEL_LABELS: Record<string, string> = { pos: "كاشير", online: "إلكتروني" };
const STATUS_LABELS: Record<string, string> = {
  pending_payment: "بانتظار الدفع",
  received: "مستلم",
  accepted: "مقبول",
  cancelled: "ملغى",
};
const LOYALTY_REASON_LABELS: Record<string, string> = {
  order_earn: "اكتساب من طلب",
  reward_redeem: "استبدال مكافأة",
  manual_adjustment: "تعديل يدوي",
};

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseServiceRoleClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id, full_name, phone, points_balance, registered_at")
    .eq("id", id)
    .maybeSingle();

  if (!customer) notFound();

  const [{ data: orders }, { data: ledger }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, daily_order_number, channel, status, total, created_at")
      .eq("customer_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("loyalty_points")
      .select("id, points_change, reason, notes, created_at")
      .eq("customer_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const totalSpent = (orders ?? [])
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{customer.full_name ?? "عميل بدون اسم"}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-[var(--color-brand-card)] p-4 ring-1 ring-[var(--color-brand-border)]">
          <p className="text-sm text-[var(--color-brand-muted)]">الجوال</p>
          <p className="text-lg font-bold">{customer.phone}</p>
        </div>
        <div className="rounded-2xl bg-[var(--color-brand-card)] p-4 ring-1 ring-[var(--color-brand-border)]">
          <p className="text-sm text-[var(--color-brand-muted)]">رصيد النقاط</p>
          <p className="text-lg font-bold">{customer.points_balance}</p>
        </div>
        <div className="rounded-2xl bg-[var(--color-brand-card)] p-4 ring-1 ring-[var(--color-brand-border)]">
          <p className="text-sm text-[var(--color-brand-muted)]">إجمالي الإنفاق</p>
          <p className="text-lg font-bold">{formatCurrency(totalSpent)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <AdjustPointsForm customerId={customer.id} currentBalance={customer.points_balance} />

        <div className="flex-1">
          <h2 className="mb-3 text-lg font-bold">سجل النقاط</h2>
          <div className="overflow-hidden rounded-2xl bg-[var(--color-brand-card)] ring-1 ring-[var(--color-brand-border)]">
            <table className="w-full text-right text-sm">
              <tbody>
                {(ledger ?? []).map((entry) => (
                  <tr key={entry.id} className="border-t border-[var(--color-brand-border)] first:border-t-0">
                    <td className="px-4 py-3 text-[var(--color-brand-muted)]">
                      {new Date(entry.created_at).toLocaleDateString("ar-SA")}
                    </td>
                    <td className="px-4 py-3">
                      {LOYALTY_REASON_LABELS[entry.reason] ?? entry.reason}
                      {entry.notes && <span className="text-[var(--color-brand-muted)]"> — {entry.notes}</span>}
                    </td>
                    <td
                      className={`px-4 py-3 text-left font-medium ${
                        entry.points_change > 0 ? "text-green-700" : "text-[var(--color-brand-primary)]"
                      }`}
                    >
                      {entry.points_change > 0 ? "+" : ""}
                      {entry.points_change}
                    </td>
                  </tr>
                ))}
                {(ledger ?? []).length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-[var(--color-brand-muted)]">
                      لا يوجد سجل نقاط
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold">سجل الطلبات</h2>
        <div className="overflow-hidden rounded-2xl bg-[var(--color-brand-card)] ring-1 ring-[var(--color-brand-border)]">
          <table className="w-full text-right text-sm">
            <tbody>
              {(orders ?? []).map((order) => (
                <tr key={order.id} className="border-t border-[var(--color-brand-border)] first:border-t-0">
                  <td className="px-4 py-3">
                    <Link href={`/orders/${order.id}`} className="font-medium hover:underline">
                      #{order.daily_order_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-brand-muted)]">
                    {new Date(order.created_at).toLocaleString("ar-SA")}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-brand-muted)]">
                    {CHANNEL_LABELS[order.channel] ?? order.channel}
                  </td>
                  <td className="px-4 py-3">{formatCurrency(order.total)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        order.status === "cancelled"
                          ? "bg-[var(--color-brand-primary-light)] text-[var(--color-brand-primary)]"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </td>
                </tr>
              ))}
              {(orders ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-[var(--color-brand-muted)]">
                    لا يوجد طلبات
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
