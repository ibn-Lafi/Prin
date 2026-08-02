import Link from "next/link";
import { formatCurrency } from "@brin/utils";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { computeShiftTotalsMap } from "@/lib/shiftTotals";
import type { CashierShift } from "@/lib/types";

const PAGE_SIZE = 50;

export default async function ShiftsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const rangeStart = (page - 1) * PAGE_SIZE;
  const rangeEnd = rangeStart + PAGE_SIZE - 1;

  const supabase = createSupabaseServiceRoleClient();
  const { data: rawShifts, count } = await supabase
    .from("cashier_shifts")
    .select("id, employee_id, opened_at, closed_at", { count: "exact" })
    .order("opened_at", { ascending: false })
    .range(rangeStart, rangeEnd);

  const shifts = (rawShifts ?? []) as CashierShift[];
  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const employeeIds = Array.from(new Set(shifts.map((s) => s.employee_id)));
  const [{ data: employees }, totalsMap] = await Promise.all([
    employeeIds.length
      ? supabase.from("employees").select("id, full_name").in("id", employeeIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    computeShiftTotalsMap(shifts),
  ]);
  const employeeName = (id: string) => (employees ?? []).find((e) => e.id === id)?.full_name ?? "—";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">جلسات الكاشير</h1>

      <div className="overflow-x-auto rounded-2xl bg-[var(--color-brand-card)] ring-1 ring-[var(--color-brand-border)]">
        <table className="w-full text-right text-sm">
          <thead className="bg-[var(--color-brand-background)] text-[var(--color-brand-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">الموظف</th>
              <th className="px-4 py-3 font-medium">وقت الفتح</th>
              <th className="px-4 py-3 font-medium">وقت الإغلاق</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
              <th className="px-4 py-3 font-medium">كاش</th>
              <th className="px-4 py-3 font-medium">شبكة</th>
              <th className="px-4 py-3 font-medium">إلكتروني</th>
              <th className="px-4 py-3 font-medium">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map((shift) => {
              const totals = totalsMap.get(shift.id) ?? { cash: 0, cardTerminal: 0, online: 0, total: 0 };
              return (
                <tr key={shift.id} className="border-t border-[var(--color-brand-border)]">
                  <td className="px-4 py-3">
                    <Link href={`/shifts/${shift.id}`} className="font-medium hover:underline">
                      {employeeName(shift.employee_id)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[var(--color-brand-muted)]">
                    {new Date(shift.opened_at).toLocaleString("ar-SA")}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[var(--color-brand-muted)]">
                    {shift.closed_at ? new Date(shift.closed_at).toLocaleString("ar-SA") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        shift.closed_at
                          ? "bg-[var(--color-brand-background)] text-[var(--color-brand-muted)]"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {shift.closed_at ? "مغلقة" : "مفتوحة"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatCurrency(totals.cash)}</td>
                  <td className="px-4 py-3">{formatCurrency(totals.cardTerminal)}</td>
                  <td className="px-4 py-3">{formatCurrency(totals.online)}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(totals.total)}</td>
                </tr>
              );
            })}
            {shifts.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-[var(--color-brand-muted)]">
                  لا توجد جلسات
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--color-brand-muted)]">
            صفحة {page} من {totalPages} — {totalCount} جلسة
          </p>
          <div className="flex gap-2">
            <Link
              href={`/shifts?page=${Math.max(1, page - 1)}`}
              aria-disabled={page <= 1}
              className={`rounded-xl px-4 py-2 text-sm font-medium ring-1 ring-[var(--color-brand-border)] ${
                page <= 1
                  ? "pointer-events-none bg-[var(--color-brand-background)] text-[var(--color-brand-muted)] opacity-50"
                  : "bg-[var(--color-brand-background)]"
              }`}
            >
              السابق
            </Link>
            <Link
              href={`/shifts?page=${Math.min(totalPages, page + 1)}`}
              aria-disabled={page >= totalPages}
              className={`rounded-xl px-4 py-2 text-sm font-medium ring-1 ring-[var(--color-brand-border)] ${
                page >= totalPages
                  ? "pointer-events-none bg-[var(--color-brand-background)] text-[var(--color-brand-muted)] opacity-50"
                  : "bg-[var(--color-brand-background)]"
              }`}
            >
              التالي
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
