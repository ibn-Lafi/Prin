import { notFound } from "next/navigation";
import { formatCurrency } from "@brin/utils";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { computeShiftTotalsMap } from "@/lib/shiftTotals";
import type { CashierShift } from "@/lib/types";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "كاش",
  card_terminal: "شبكة",
  online_moyasar: "دفع إلكتروني",
};

type PosOrderRow = {
  id: string;
  daily_order_number: number;
  total: number;
  created_at: string;
  payments: { method: string; amount: number }[];
};

type OnlineOrderRow = {
  id: string;
  daily_order_number: number;
  total: number;
  accepted_at: string | null;
};

export default async function ShiftDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseServiceRoleClient();

  const { data: rawShift } = await supabase
    .from("cashier_shifts")
    .select("id, employee_id, opened_at, closed_at")
    .eq("id", id)
    .maybeSingle();

  const shift = rawShift as CashierShift | null;
  if (!shift) notFound();

  const closedAt = shift.closed_at ?? new Date().toISOString();

  const [{ data: employee }, totalsMap, { data: rawPosOrders }, { data: rawOnlineOrders }] = await Promise.all([
    supabase.from("employees").select("full_name").eq("id", shift.employee_id).maybeSingle(),
    computeShiftTotalsMap([shift]),
    supabase
      .from("orders")
      .select("id, daily_order_number, total, created_at, payments ( method, amount )")
      .eq("employee_id", shift.employee_id)
      .eq("channel", "pos")
      .neq("status", "cancelled")
      .gte("created_at", shift.opened_at)
      .lte("created_at", closedAt)
      .order("created_at", { ascending: true }),
    supabase
      .from("orders")
      .select("id, daily_order_number, total, accepted_at")
      .eq("accepted_by_employee_id", shift.employee_id)
      .eq("channel", "online")
      .neq("status", "cancelled")
      .gte("accepted_at", shift.opened_at)
      .lte("accepted_at", closedAt)
      .order("accepted_at", { ascending: true }),
  ]);

  const totals = totalsMap.get(shift.id) ?? { cash: 0, cardTerminal: 0, online: 0, total: 0 };
  const posOrders = (rawPosOrders ?? []) as unknown as PosOrderRow[];
  const onlineOrders = (rawOnlineOrders ?? []) as unknown as OnlineOrderRow[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">جلسة {employee?.full_name ?? "—"}</h1>
        <span
          className={`rounded-full px-3 py-1.5 text-sm font-medium ${
            shift.closed_at
              ? "bg-[var(--color-brand-background)] text-[var(--color-brand-muted)]"
              : "bg-green-100 text-green-700"
          }`}
        >
          {shift.closed_at ? "مغلقة" : "مفتوحة"}
        </span>
      </div>

      <div className="flex gap-6 text-sm">
        <div>
          <p className="text-[var(--color-brand-muted)]">وقت الفتح</p>
          <p className="font-medium">{new Date(shift.opened_at).toLocaleString("ar-SA")}</p>
        </div>
        <div>
          <p className="text-[var(--color-brand-muted)]">وقت الإغلاق</p>
          <p className="font-medium">
            {shift.closed_at ? new Date(shift.closed_at).toLocaleString("ar-SA") : "— (لسه مفتوحة)"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-[var(--color-brand-card)] p-4 ring-1 ring-[var(--color-brand-border)]">
          <p className="text-xs text-[var(--color-brand-muted)]">كاش</p>
          <p className="text-lg font-bold">{formatCurrency(totals.cash)}</p>
        </div>
        <div className="rounded-2xl bg-[var(--color-brand-card)] p-4 ring-1 ring-[var(--color-brand-border)]">
          <p className="text-xs text-[var(--color-brand-muted)]">شبكة</p>
          <p className="text-lg font-bold">{formatCurrency(totals.cardTerminal)}</p>
        </div>
        <div className="rounded-2xl bg-[var(--color-brand-card)] p-4 ring-1 ring-[var(--color-brand-border)]">
          <p className="text-xs text-[var(--color-brand-muted)]">المنيو الإلكتروني</p>
          <p className="text-lg font-bold">{formatCurrency(totals.online)}</p>
        </div>
        <div className="rounded-2xl bg-[var(--color-brand-primary-light)] p-4">
          <p className="text-xs text-[var(--color-brand-primary)]">الإجمالي</p>
          <p className="text-lg font-bold text-[var(--color-brand-primary)]">{formatCurrency(totals.total)}</p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold">طلبات الكاشير ({posOrders.length})</h2>
        <div className="overflow-x-auto rounded-2xl bg-[var(--color-brand-card)] ring-1 ring-[var(--color-brand-border)]">
          <table className="w-full text-right text-sm">
            <thead className="bg-[var(--color-brand-background)] text-[var(--color-brand-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">رقم الطلب</th>
                <th className="px-4 py-3 font-medium">الوقت</th>
                <th className="px-4 py-3 font-medium">وسيلة الدفع</th>
                <th className="px-4 py-3 font-medium">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {posOrders.map((order) => (
                <tr key={order.id} className="border-t border-[var(--color-brand-border)]">
                  <td className="px-4 py-3 font-medium">#{order.daily_order_number}</td>
                  <td className="px-4 py-3 text-[var(--color-brand-muted)]">
                    {new Date(order.created_at).toLocaleTimeString("ar-SA", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-brand-muted)]">
                    {order.payments.map((p) => PAYMENT_METHOD_LABELS[p.method] ?? p.method).join("، ")}
                  </td>
                  <td className="px-4 py-3">{formatCurrency(order.total)}</td>
                </tr>
              ))}
              {posOrders.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-[var(--color-brand-muted)]">
                    ما فيه طلبات كاشير خلال هذي الجلسة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-bold">الطلبات الإلكترونية المقبولة ({onlineOrders.length})</h2>
        <div className="overflow-x-auto rounded-2xl bg-[var(--color-brand-card)] ring-1 ring-[var(--color-brand-border)]">
          <table className="w-full text-right text-sm">
            <thead className="bg-[var(--color-brand-background)] text-[var(--color-brand-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">رقم الطلب</th>
                <th className="px-4 py-3 font-medium">وقت القبول</th>
                <th className="px-4 py-3 font-medium">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {onlineOrders.map((order) => (
                <tr key={order.id} className="border-t border-[var(--color-brand-border)]">
                  <td className="px-4 py-3 font-medium">#{order.daily_order_number}</td>
                  <td className="px-4 py-3 text-[var(--color-brand-muted)]">
                    {order.accepted_at
                      ? new Date(order.accepted_at).toLocaleTimeString("ar-SA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">{formatCurrency(order.total)}</td>
                </tr>
              ))}
              {onlineOrders.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-[var(--color-brand-muted)]">
                    ما فيه طلبات إلكترونية مقبولة خلال هذي الجلسة
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
