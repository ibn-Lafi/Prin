import Link from "next/link";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";

const ACTION_LABELS: Record<string, string> = {
  order_cancel: "إلغاء طلب",
  refund: "استرجاع",
  price_change: "تعديل سعر",
  employee_login: "تسجيل دخول",
  employee_logout: "تسجيل خروج",
  manual_points_adjustment: "تعديل نقاط يدوي",
  settings_change: "تعديل إعدادات",
};

function todayInRiyadh(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" });
}

function daysAgoInRiyadh(days: number): string {
  const date = new Date(`${todayInRiyadh()}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

type AuditLogRow = {
  id: string;
  action_type: string;
  description: string;
  related_order_id: string | null;
  created_at: string;
  employees: { full_name: string } | null;
};

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ actionType?: string; from?: string }>;
}) {
  const params = await searchParams;
  const actionType = params.actionType ?? "";
  const from = params.from || daysAgoInRiyadh(6);

  const supabase = createSupabaseServiceRoleClient();
  let query = supabase
    .from("audit_log")
    .select("id, action_type, description, related_order_id, created_at, employees ( full_name )")
    .gte("created_at", `${from}T00:00:00Z`)
    .order("created_at", { ascending: false })
    .limit(300);

  if (actionType) query = query.eq("action_type", actionType);

  const { data: rawLogs } = await query;
  const logs = rawLogs as unknown as AuditLogRow[] | null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">سجل التدقيق</h1>

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-2xl bg-[var(--color-brand-card)] p-4 ring-1 ring-[var(--color-brand-border)]"
      >
        <label className="flex flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
          من تاريخ
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
          نوع العملية
          <select
            name="actionType"
            defaultValue={actionType}
            className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
          >
            <option value="">الكل</option>
            {Object.entries(ACTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-xl bg-[var(--color-brand-primary)] px-4 py-2 text-sm font-semibold text-white"
        >
          تصفية
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl bg-[var(--color-brand-card)] ring-1 ring-[var(--color-brand-border)]">
        <table className="w-full text-right text-sm">
          <thead className="bg-[var(--color-brand-background)] text-[var(--color-brand-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">الوقت</th>
              <th className="px-4 py-3 font-medium">الموظف</th>
              <th className="px-4 py-3 font-medium">النوع</th>
              <th className="px-4 py-3 font-medium">التفاصيل</th>
            </tr>
          </thead>
          <tbody>
            {(logs ?? []).map((log) => (
              <tr key={log.id} className="border-t border-[var(--color-brand-border)]">
                <td className="whitespace-nowrap px-4 py-3 text-[var(--color-brand-muted)]">
                  {new Date(log.created_at).toLocaleString("ar-SA")}
                </td>
                <td className="px-4 py-3">{log.employees?.full_name ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-[var(--color-brand-background)] px-2.5 py-1 text-xs font-medium">
                    {ACTION_LABELS[log.action_type] ?? log.action_type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {log.description}
                  {log.related_order_id && (
                    <Link
                      href={`/orders/${log.related_order_id}`}
                      className="mr-2 text-xs text-[var(--color-brand-primary)] hover:underline"
                    >
                      عرض الطلب
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {(logs ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[var(--color-brand-muted)]">
                  لا توجد سجلات مطابقة
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
