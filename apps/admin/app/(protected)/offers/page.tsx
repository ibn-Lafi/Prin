import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { OffersManager } from "@/components/OffersManager";
import type { DiscountCode } from "@/lib/types";

export default async function OffersPage() {
  const supabase = createSupabaseServiceRoleClient();
  const { data: rawCodes } = await supabase
    .from("discount_codes")
    .select(
      "id, code, discount_type, value, min_order_amount, valid_from, valid_until, max_uses, times_used, is_active",
    )
    .order("created_at", { ascending: false });

  const codes = rawCodes as unknown as DiscountCode[] | null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">العروض وأكواد الخصم</h1>
      <p className="text-sm text-[var(--color-brand-muted)]">
        إدارة الأكواد فقط حالياً — تطبيقها الفعلي على الطلبات (بالكاشير والقائمة الإلكترونية) خطوة قادمة منفصلة.
      </p>
      <OffersManager codes={codes ?? []} />
    </div>
  );
}
