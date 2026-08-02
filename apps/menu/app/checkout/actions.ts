"use server";

import { revalidatePath } from "next/cache";
import type { KitchenPrintPayload } from "@brin/utils";
import type { Json } from "@brin/database";
import { getSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import type { DiscountCodePreview } from "@/lib/types";

/**
 * معاينة فقط — نفس منطق apps/pos بالضبط. الفحص الحقيقي (النافذ، الحد الأدنى،
 * عدد الاستخدامات) يُعاد كاملاً وبشكل ذرّي داخل create_online_order وقت
 * الإرسال الفعلي، فما نثق بنتيجة هذي الدالة وحدها.
 */
export async function lookupDiscountCodeAction(
  code: string,
  subtotal: number,
): Promise<{ error?: string; preview?: DiscountCodePreview }> {
  const trimmed = code.trim();
  if (!trimmed) return { error: "أدخل كود الخصم" };

  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from("discount_codes")
    .select("code, discount_type, value, min_order_amount, valid_from, valid_until, max_uses, times_used, is_active")
    .eq("code", trimmed.toUpperCase())
    .maybeSingle();

  if (!data || !data.is_active) return { error: "كود الخصم غير صالح" };

  const now = new Date();
  if (data.valid_from && now < new Date(data.valid_from)) {
    return { error: "كود الخصم لم يبدأ بعد" };
  }
  if (data.valid_until && now > new Date(data.valid_until)) {
    return { error: "انتهت صلاحية كود الخصم" };
  }
  if (data.max_uses !== null && data.times_used >= data.max_uses) {
    return { error: "تم الوصول للحد الأقصى لاستخدام هذا الكود" };
  }
  if (subtotal < data.min_order_amount) {
    return { error: `الحد الأدنى لاستخدام هذا الكود ${data.min_order_amount} ريال` };
  }

  return {
    preview: {
      code: data.code,
      discountType: data.discount_type as "percentage" | "fixed",
      value: data.value,
    },
  };
}

export type CheckoutItem = {
  kind: "product" | "combo";
  refId: string;
  quantity: number;
  modifierIds: string[];
};

export type PlaceOrderResult = { error?: string; orderId?: string; dailyOrderNumber?: number };

type RawOrderForKitchenPrint = {
  daily_order_number: number;
  order_date: string;
  channel: string;
  order_items: {
    quantity: number;
    notes: string | null;
    products: { name: string } | null;
    combos: { name: string } | null;
    order_item_modifiers: { modifiers: { name: string } | null }[];
  }[];
};

/** يبني ويُدرج مهمة طباعة المطبخ فقط (بدون جهاز محدد — أول عامل طباعة شغّال
 * يحجزها ذرّياً، راجع print-agent/src/jobQueue.ts) فور إنشاء الطلب مباشرة —
 * المطبخ يبدأ التحضير قبل ما العميل يوصل ويدفع. إيصال العميل يُطبع لاحقاً
 * بالكاشير وقت تحصيل الدفع (station_id محدد حينها). نعيد جلب الطلب كامل من
 * قاعدة البيانات دائماً (مو من بيانات السلة المرسلة)، نفس مبدأ
 * apps/pos/lib/printing.ts. */
async function queueKitchenPrintJob(orderId: string): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();
  const { data: rawOrder } = await supabase
    .from("orders")
    .select(
      `daily_order_number, order_date, channel,
       order_items ( quantity, notes,
         products ( name ), combos ( name ),
         order_item_modifiers ( modifiers ( name ) ) )`,
    )
    .eq("id", orderId)
    .maybeSingle();

  const order = rawOrder as unknown as RawOrderForKitchenPrint | null;
  if (!order) return;

  const payload: KitchenPrintPayload = {
    dailyOrderNumber: order.daily_order_number,
    orderDate: order.order_date,
    channel: order.channel,
    items: order.order_items.map((item) => ({
      name: item.products?.name ?? item.combos?.name ?? "صنف",
      quantity: item.quantity,
      notes: item.notes,
      modifiers: item.order_item_modifiers.map((m) => m.modifiers?.name ?? "").filter(Boolean),
    })),
  };

  await supabase.from("print_jobs").insert({
    order_id: orderId,
    target: "kitchen",
    payload: payload as unknown as Json,
    station_id: null,
  });
}

/** ينشئ طلباً فعلياً من المنيو الإلكتروني بدون دفع إلكتروني — الدفع يُحصَّل
 * بالكاشير وقت الاستلام. راجع migration 0035 لتفاصيل الآلية كاملة. */
export async function placeOrderAction(
  items: CheckoutItem[],
  discountCode: string | null,
): Promise<PlaceOrderResult> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };
  if (items.length === 0) return { error: "السلة فاضية" };

  const service = createSupabaseServiceRoleClient();
  const { data, error } = await service.rpc("create_online_order", {
    p_auth_user_id: user.id,
    p_items: items as unknown as Json,
    p_discount_code: discountCode,
  });

  if (error) return { error: error.message || "تعذّر إنشاء الطلب" };

  const created = data?.[0];
  if (!created) return { error: "تعذّر إنشاء الطلب" };

  await queueKitchenPrintJob(created.order_id);

  revalidatePath("/orders");
  return { orderId: created.order_id, dailyOrderNumber: created.daily_order_number };
}
