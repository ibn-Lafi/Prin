import Link from "next/link";
import { formatCurrency } from "@brin/utils";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "كاش",
  card_terminal: "شبكة",
  online_moyasar: "دفع إلكتروني",
};

function todayInRiyadh(): Date {
  const parts = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" }).split("-");
  return new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysAgo(days: number): string {
  const date = todayInRiyadh();
  date.setUTCDate(date.getUTCDate() - days);
  return toDateString(date);
}

function monthStart(): string {
  const date = todayInRiyadh();
  date.setUTCDate(1);
  return toDateString(date);
}

type ReportRow = {
  total: number;
  tax_amount: number;
  employee_id: string | null;
  payments: { method: string; amount: number }[];
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const today = toDateString(todayInRiyadh());
  const from = params.from || today;
  const to = params.to || today;

  const supabase = createSupabaseServiceRoleClient();
  const { data: rawOrders } = await supabase
    .from("orders")
    .select("total, tax_amount, employee_id, payments ( method, amount )")
    .in("status", ["received", "accepted", "completed"])
    .gte("order_date", from)
    .lte("order_date", to);

  const orders = (rawOrders ?? []) as unknown as ReportRow[];

  const employeeIds = Array.from(
    new Set(orders.map((o) => o.employee_id).filter((v): v is string => v !== null)),
  );
  const { data: employees } = employeeIds.length
    ? await supabase.from("employees").select("id, full_name").in("id", employeeIds)
    : { data: [] };
  const employeeName = (id: string) => (employees ?? []).find((e) => e.id === id)?.full_name ?? "—";

  const orderCount = orders.length;
  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const totalTax = orders.reduce((sum, o) => sum + o.tax_amount, 0);
  const averageOrder = orderCount > 0 ? totalSales / orderCount : 0;

  const byMethod = new Map<string, number>();
  for (const order of orders) {
    for (const payment of order.payments) {
      byMethod.set(payment.method, (byMethod.get(payment.method) ?? 0) + payment.amount);
    }
  }

  const byEmployee = new Map<string, { count: number; sales: number }>();
  for (const order of orders) {
    const key = order.employee_id ?? "—";
    const current = byEmployee.get(key) ?? { count: 0, sales: 0 };
    current.count += 1;
    current.sales += order.total;
    byEmployee.set(key, current);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">التقارير</h1>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-2xl bg-[var(--color-brand-card)] p-4 ring-1 ring-[var(--color-brand-border)]"
      >
        <label className="flex flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
          من
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
          إلى
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
          />
        </label>
        <button
          type="submit"
          className="rounded-xl bg-[var(--color-brand-primary)] px-4 py-2 text-sm font-semibold text-white"
        >
          عرض
        </button>
        <div className="flex gap-2">
          <Link
            href={`/reports?from=${today}&to=${today}`}
            className="rounded-xl bg-[var(--color-brand-background)] px-3 py-2 text-sm font-medium ring-1 ring-[var(--color-brand-border)]"
          >
            اليوم
          </Link>
          <Link
            href={`/reports?from=${daysAgo(6)}&to=${today}`}
            className="rounded-xl bg-[var(--color-brand-background)] px-3 py-2 text-sm font-medium ring-1 ring-[var(--color-brand-border)]"
          >
            آخر 7 أيام
          </Link>
          <Link
            href={`/reports?from=${monthStart()}&to=${today}`}
            className="rounded-xl bg-[var(--color-brand-background)] px-3 py-2 text-sm font-medium ring-1 ring-[var(--color-brand-border)]"
          >
            هذا الشهر
          </Link>
        </div>
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: "المبيعات", value: formatCurrency(totalSales) },
          { label: "عدد الطلبات", value: orderCount.toString() },
          { label: "متوسط الطلب", value: formatCurrency(averageOrder) },
          { label: "الضريبة المحصّلة", value: formatCurrency(totalTax) },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl bg-[var(--color-brand-card)] p-4 ring-1 ring-[var(--color-brand-border)]"
          >
            <p className="text-sm text-[var(--color-brand-muted)]">{stat.label}</p>
            <p className="text-xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-[var(--color-brand-card)] p-5 ring-1 ring-[var(--color-brand-border)]">
          <h2 className="mb-3 font-bold">حسب طريقة الدفع</h2>
          <div className="flex flex-col gap-2">
            {Array.from(byMethod.entries()).map(([method, amount]) => (
              <div key={method} className="flex justify-between text-sm">
                <span className="text-[var(--color-brand-muted)]">
                  {PAYMENT_METHOD_LABELS[method] ?? method}
                </span>
                <span className="font-medium">{formatCurrency(amount)}</span>
              </div>
            ))}
            {byMethod.size === 0 && (
              <p className="text-sm text-[var(--color-brand-muted)]">لا توجد بيانات</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--color-brand-card)] p-5 ring-1 ring-[var(--color-brand-border)]">
          <h2 className="mb-3 font-bold">أداء الموظفين</h2>
          <div className="flex flex-col gap-2">
            {Array.from(byEmployee.entries()).map(([employeeId, stats]) => (
              <div key={employeeId} className="flex justify-between text-sm">
                <span className="text-[var(--color-brand-muted)]">
                  {employeeId === "—" ? "بدون موظف" : employeeName(employeeId)} ({stats.count} طلب)
                </span>
                <span className="font-medium">{formatCurrency(stats.sales)}</span>
              </div>
            ))}
            {byEmployee.size === 0 && (
              <p className="text-sm text-[var(--color-brand-muted)]">لا توجد بيانات</p>
            )}
          </div>
        </div>
      </div>

      <Link
        href="/reports/closing"
        className="w-fit rounded-full bg-[var(--color-brand-primary)] px-4 py-2.5 text-sm font-semibold text-white"
      >
        الإقفال اليومي
      </Link>
    </div>
  );
}
