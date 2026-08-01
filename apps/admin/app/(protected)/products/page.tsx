import Link from "next/link";
import { Plus } from "lucide-react";
import { formatCurrency } from "@brin/utils";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";

export default async function ProductsPage() {
  const supabase = createSupabaseServiceRoleClient();
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("id, name").order("display_order", { ascending: true }),
    supabase
      .from("products")
      .select("id, category_id, name, price, is_available, deleted_at")
      .order("name", { ascending: true }),
  ]);

  const categoryMap = new Map((categories ?? []).map((c) => [c.id, c.name]));
  const grouped = new Map<string, typeof products>();
  for (const product of products ?? []) {
    const key = product.category_id;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(product);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">المنتجات</h1>
        <Link
          href="/products/new"
          className="flex items-center gap-1.5 rounded-full bg-[var(--color-brand-primary)] px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          إضافة صنف
        </Link>
      </div>

      {Array.from(grouped.entries()).map(([categoryId, items]) => (
        <div key={categoryId} className="flex flex-col gap-3">
          <h2 className="font-semibold text-[var(--color-brand-muted)]">
            {categoryMap.get(categoryId) ?? "بدون فئة"}
          </h2>
          <div className="overflow-hidden rounded-2xl bg-[var(--color-brand-card)] ring-1 ring-[var(--color-brand-border)]">
            <table className="w-full text-right text-sm">
              <tbody>
                {(items ?? []).map((product) => (
                  <tr key={product.id} className="border-t border-[var(--color-brand-border)] first:border-t-0">
                    <td className="px-4 py-3">
                      <Link href={`/products/${product.id}`} className="font-medium hover:underline">
                        {product.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-brand-muted)]">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-4 py-3 text-left">
                      {product.deleted_at ? (
                        <span className="rounded-full bg-[var(--color-brand-background)] px-2.5 py-1 text-xs font-medium text-[var(--color-brand-muted)]">
                          محذوف
                        </span>
                      ) : (
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            product.is_available
                              ? "bg-green-100 text-green-700"
                              : "bg-[var(--color-brand-primary-light)] text-[var(--color-brand-primary)]"
                          }`}
                        >
                          {product.is_available ? "متوفر" : "نفد المخزون"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
