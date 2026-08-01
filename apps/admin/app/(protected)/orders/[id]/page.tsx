import { notFound } from "next/navigation";
import { formatCurrency } from "@brin/utils";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { CancelOrderButton } from "@/components/CancelOrderButton";

const CHANNEL_LABELS: Record<string, string> = { pos: "كاشير", online: "إلكتروني" };
const STATUS_LABELS: Record<string, string> = {
  pending_payment: "بانتظار الدفع",
  received: "مستلم",
  accepted: "مقبول",
  cancelled: "ملغى",
};
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "كاش",
  card_terminal: "شبكة",
  online_moyasar: "دفع إلكتروني",
};

type OrderDetailRow = {
  id: string;
  order_date: string;
  daily_order_number: number;
  channel: string;
  status: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  customer_id: string | null;
  employee_id: string | null;
  cancelled_by_employee_id: string | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  created_at: string;
  customers: { full_name: string | null; phone: string } | null;
  rewards: { name: string } | null;
  order_items: {
    id: string;
    quantity: number;
    unit_price: number;
    notes: string | null;
    products: { name: string } | null;
    combos: { name: string } | null;
    order_item_modifiers: { price_delta: number; modifiers: { name: string } | null }[];
  }[];
  payments: { id: string; method: string; amount: number; status: string }[];
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseServiceRoleClient();

  const { data: rawOrder } = await supabase
    .from("orders")
    .select(
      `id, order_date, daily_order_number, channel, status, subtotal, discount_amount, tax_amount, total,
       customer_id, employee_id, cancelled_by_employee_id, cancellation_reason, cancelled_at, created_at,
       customers ( full_name, phone ),
       rewards ( name ),
       order_items ( id, quantity, unit_price, notes,
         products ( name ), combos ( name ),
         order_item_modifiers ( price_delta, modifiers ( name ) ) ),
       payments ( id, method, amount, status )`,
    )
    .eq("id", id)
    .maybeSingle();

  const order = rawOrder as unknown as OrderDetailRow | null;
  if (!order) notFound();

  const employeeIds = [order.employee_id, order.cancelled_by_employee_id].filter(
    (v): v is string => v !== null,
  );
  const { data: employees } = employeeIds.length
    ? await supabase.from("employees").select("id, full_name").in("id", employeeIds)
    : { data: [] };
  const employeeName = (id: string | null) =>
    (employees ?? []).find((e) => e.id === id)?.full_name ?? "—";

  const canCancel = order.status === "received" || order.status === "accepted";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">طلب #{order.daily_order_number}</h1>
        <span
          className={`rounded-full px-3 py-1.5 text-sm font-medium ${
            order.status === "cancelled"
              ? "bg-[var(--color-brand-primary-light)] text-[var(--color-brand-primary)]"
              : "bg-green-100 text-green-700"
          }`}
        >
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      <div className="flex flex-wrap gap-6">
        <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl bg-[var(--color-brand-card)] p-5 ring-1 ring-[var(--color-brand-border)]">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[var(--color-brand-muted)]">القناة</p>
              <p className="font-medium">{CHANNEL_LABELS[order.channel] ?? order.channel}</p>
            </div>
            <div>
              <p className="text-[var(--color-brand-muted)]">الوقت</p>
              <p className="font-medium">{new Date(order.created_at).toLocaleString("ar-SA")}</p>
            </div>
            <div>
              <p className="text-[var(--color-brand-muted)]">العميل</p>
              <p className="font-medium">
                {order.customers
                  ? [order.customers.full_name, order.customers.phone].filter(Boolean).join(" — ")
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-[var(--color-brand-muted)]">الموظف</p>
              <p className="font-medium">{employeeName(order.employee_id)}</p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 border-t border-[var(--color-brand-border)] pt-3">
            {order.order_items.map((item) => (
              <div key={item.id} className="flex items-start justify-between text-sm">
                <div>
                  <p className="font-medium">
                    {item.quantity} × {item.products?.name ?? item.combos?.name ?? "صنف"}
                  </p>
                  {item.order_item_modifiers.length > 0 && (
                    <p className="text-xs text-[var(--color-brand-muted)]">
                      {item.order_item_modifiers.map((m) => m.modifiers?.name).filter(Boolean).join("، ")}
                    </p>
                  )}
                  {item.notes && <p className="text-xs text-[var(--color-brand-muted)]">{item.notes}</p>}
                </div>
                <span className="text-[var(--color-brand-muted)]">
                  {formatCurrency(item.unit_price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1 border-t border-[var(--color-brand-border)] pt-3 text-sm">
            <div className="flex justify-between text-[var(--color-brand-muted)]">
              <span>المجموع الفرعي</span>
              <span>{formatCurrency(order.subtotal + order.discount_amount)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-[var(--color-brand-primary)]">
                <span>خصم{order.rewards?.name ? ` — ${order.rewards.name}` : ""}</span>
                <span>-{formatCurrency(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-[var(--color-brand-muted)]">
              <span>الضريبة</span>
              <span>{formatCurrency(order.tax_amount)}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--color-brand-border)] pt-1 text-base font-bold">
              <span>الإجمالي</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1 border-t border-[var(--color-brand-border)] pt-3 text-sm">
            <p className="text-[var(--color-brand-muted)]">الدفع</p>
            {order.payments.map((payment) => (
              <div key={payment.id} className="flex justify-between">
                <span>{PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}</span>
                <span>{formatCurrency(payment.amount)}</span>
              </div>
            ))}
          </div>

          {order.status === "cancelled" && (
            <div className="flex flex-col gap-1 border-t border-[var(--color-brand-border)] pt-3 text-sm">
              <p className="font-medium text-[var(--color-brand-primary)]">تم الإلغاء</p>
              <p className="text-[var(--color-brand-muted)]">
                بواسطة: {employeeName(order.cancelled_by_employee_id)}
              </p>
              <p className="text-[var(--color-brand-muted)]">السبب: {order.cancellation_reason}</p>
              {order.cancelled_at && (
                <p className="text-[var(--color-brand-muted)]">
                  {new Date(order.cancelled_at).toLocaleString("ar-SA")}
                </p>
              )}
            </div>
          )}
        </div>

        {canCancel && <CancelOrderButton orderId={order.id} />}
      </div>
    </div>
  );
}
