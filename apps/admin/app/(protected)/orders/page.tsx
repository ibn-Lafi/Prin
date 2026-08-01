import Link from "next/link";
import { formatCurrency } from "@brin/utils";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";

const CHANNEL_LABELS: Record<string, string> = { pos: "كاشير", online: "إلكتروني" };
const STATUS_LABELS: Record<string, string> = {
  pending_payment: "بانتظار الدفع",
  received: "مستلم",
  accepted: "مقبول",
  cancelled: "ملغى",
};

function todayInRiyadh(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" });
}

type OrderListRow = {
  id: string;
  daily_order_number: number;
  channel: string;
  status: string;
  total: number;
  created_at: string;
  customers: { full_name: string | null; phone: string } | null;
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ channel?: string; status?: string; date?: string }>;
}) {
  const params = await searchParams;
  const channel = params.channel ?? "";
  const status = params.status ?? "";
  const date = params.date ?? todayInRiyadh();

  const supabase = createSupabaseServiceRoleClient();
  let query = supabase
    .from("orders")
    .select("id, daily_order_number, channel, status, total, created_at, customers ( full_name, phone )")
    .order("created_at", { ascending: false })
    .limit(200);

  if (channel) query = query.eq("channel", channel);
  if (status) query = query.eq("status", status);
  if (date) query = query.eq("order_date", date);

  const { data: rawOrders } = await query;
  const orders = rawOrders as unknown as OrderListRow[] | null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">الطلبات</h1>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-2xl bg-[var(--color-brand-card)] p-4 ring-1 ring-[var(--color-brand-border)]"
      >
        <label className="flex flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
          التاريخ
          <input
            type="date"
            name="date"
            defaultValue={date}
            className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
          القناة
          <select
            name="channel"
            defaultValue={channel}
            className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
          >
            <option value="">الكل</option>
            <option value="pos">كاشير</option>
            <option value="online">إلكتروني</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
          الحالة
          <select
            name="status"
            defaultValue={status}
            className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
          >
            <option value="">الكل</option>
            <option value="pending_payment">بانتظار الدفع</option>
            <option value="received">مستلم</option>
            <option value="accepted">مقبول</option>
            <option value="cancelled">ملغى</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded-xl bg-[var(--color-brand-primary)] px-4 py-2 text-sm font-semibold text-white"
        >
          فلترة
        </button>
        <Link
          href="/orders?date="
          className="rounded-xl bg-[var(--color-brand-background)] px-4 py-2 text-sm font-medium ring-1 ring-[var(--color-brand-border)]"
        >
          كل التواريخ
        </Link>
      </form>

      <div className="overflow-hidden rounded-2xl bg-[var(--color-brand-card)] ring-1 ring-[var(--color-brand-border)]">
        <table className="w-full text-right text-sm">
          <thead className="bg-[var(--color-brand-background)] text-[var(--color-brand-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">رقم الطلب</th>
              <th className="px-4 py-3 font-medium">الوقت</th>
              <th className="px-4 py-3 font-medium">القناة</th>
              <th className="px-4 py-3 font-medium">العميل</th>
              <th className="px-4 py-3 font-medium">الإجمالي</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((order) => (
              <tr key={order.id} className="border-t border-[var(--color-brand-border)]">
                <td className="px-4 py-3">
                  <Link href={`/orders/${order.id}`} className="font-medium hover:underline">
                    #{order.daily_order_number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[var(--color-brand-muted)]">
                  {new Date(order.created_at).toLocaleTimeString("ar-SA", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3 text-[var(--color-brand-muted)]">
                  {CHANNEL_LABELS[order.channel] ?? order.channel}
                </td>
                <td className="px-4 py-3 text-[var(--color-brand-muted)]">
                  {order.customers?.full_name ?? order.customers?.phone ?? "—"}
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
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-brand-muted)]">
                  لا توجد طلبات مطابقة
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
