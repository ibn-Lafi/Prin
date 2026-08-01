import Link from "next/link";
import { Plus } from "lucide-react";
import { formatCurrency } from "@brin/utils";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";

export default async function CombosPage() {
  const supabase = createSupabaseServiceRoleClient();
  const { data: combos } = await supabase
    .from("combos")
    .select("id, name, price, is_available, deleted_at")
    .order("name", { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">الوجبات</h1>
        <Link
          href="/combos/new"
          className="flex items-center gap-1.5 rounded-full bg-[var(--color-brand-primary)] px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          إضافة وجبة
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl bg-[var(--color-brand-card)] ring-1 ring-[var(--color-brand-border)]">
        <table className="w-full text-right text-sm">
          <tbody>
            {(combos ?? []).map((combo) => (
              <tr key={combo.id} className="border-t border-[var(--color-brand-border)] first:border-t-0">
                <td className="px-4 py-3">
                  <Link href={`/combos/${combo.id}`} className="font-medium hover:underline">
                    {combo.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[var(--color-brand-muted)]">{formatCurrency(combo.price)}</td>
                <td className="px-4 py-3 text-left">
                  {combo.deleted_at ? (
                    <span className="rounded-full bg-[var(--color-brand-background)] px-2.5 py-1 text-xs font-medium text-[var(--color-brand-muted)]">
                      محذوفة
                    </span>
                  ) : (
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        combo.is_available
                          ? "bg-green-100 text-green-700"
                          : "bg-[var(--color-brand-primary-light)] text-[var(--color-brand-primary)]"
                      }`}
                    >
                      {combo.is_available ? "متوفرة" : "نفدت"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
