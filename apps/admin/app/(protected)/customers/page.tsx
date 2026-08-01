import Link from "next/link";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";

  const supabase = createSupabaseServiceRoleClient();
  let query = supabase
    .from("customers")
    .select("id, full_name, phone, points_balance, registered_at")
    .order("registered_at", { ascending: false })
    .limit(100);

  if (q) {
    query = query.or(`phone.ilike.%${q}%,full_name.ilike.%${q}%`);
  }

  const { data: customers } = await query;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">العملاء</h1>

      <form
        method="get"
        className="flex items-end gap-3 rounded-2xl bg-[var(--color-brand-card)] p-4 ring-1 ring-[var(--color-brand-border)]"
      >
        <label className="flex flex-1 flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
          بحث بالاسم أو الجوال
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="0501234567"
            className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
          />
        </label>
        <button
          type="submit"
          className="rounded-xl bg-[var(--color-brand-primary)] px-4 py-2 text-sm font-semibold text-white"
        >
          بحث
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl bg-[var(--color-brand-card)] ring-1 ring-[var(--color-brand-border)]">
        <table className="w-full text-right text-sm">
          <thead className="bg-[var(--color-brand-background)] text-[var(--color-brand-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">الاسم</th>
              <th className="px-4 py-3 font-medium">الجوال</th>
              <th className="px-4 py-3 font-medium">رصيد النقاط</th>
              <th className="px-4 py-3 font-medium">تاريخ التسجيل</th>
            </tr>
          </thead>
          <tbody>
            {(customers ?? []).map((customer) => (
              <tr key={customer.id} className="border-t border-[var(--color-brand-border)]">
                <td className="px-4 py-3">
                  <Link href={`/customers/${customer.id}`} className="font-medium hover:underline">
                    {customer.full_name ?? "بدون اسم"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[var(--color-brand-muted)]">{customer.phone}</td>
                <td className="px-4 py-3">{customer.points_balance}</td>
                <td className="px-4 py-3 text-[var(--color-brand-muted)]">
                  {new Date(customer.registered_at).toLocaleDateString("ar-SA")}
                </td>
              </tr>
            ))}
            {(customers ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[var(--color-brand-muted)]">
                  لا يوجد عملاء مطابقون
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
