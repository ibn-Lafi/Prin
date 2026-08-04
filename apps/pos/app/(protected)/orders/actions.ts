"use server";

import { normalizeSaudiPhone } from "@brin/utils";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { getSession } from "@/lib/session";
import { queueOrderPrintJobs } from "@/lib/printing";
import type { CustomerLookup, Reward, DiscountCodePreview } from "@/lib/types";

export type CreateOrderItem = {
  kind: "product" | "combo";
  refId: string;
  quantity: number;
  modifierIds: string[];
};

export type CreateOrderPayment = {
  method: "cash" | "card_terminal";
  amount: number;
};

export type CreateOrderInput = {
  items: CreateOrderItem[];
  customerPhone: string | null;
  customerName: string | null;
  payments: CreateOrderPayment[];
  rewardId: string | null;
  discountCode: string | null;
  stationId: string | null;
  branchId: string | null;
};

export type CreateOrderResult = {
  error?: string;
  orderId?: string;
  dailyOrderNumber?: number;
};

export async function createOrderAction(input: CreateOrderInput): Promise<CreateOrderResult> {
  const session = await getSession();
  if (!session) {
    return { error: "الجلسة منتهية — سجّل الدخول من جديد" };
  }

  if (input.items.length === 0) {
    return { error: "التذكرة فارغة" };
  }

  if (!input.branchId) {
    return { error: "فرع هذا الجهاز غير مضبوط — راجع صفحة إعدادات الطباعة" };
  }

  // توحيد صيغة الجوال لـ E.164 قبل حفظه — نفس الصيغة اللي يستخدمها المنيو
  // الإلكتروني (OTP) بالضبط، وإلا عميل مسجّل مسبقاً بالمنيو (أو يسجّل لاحقاً)
  // يصير له صفّان منفصلان بجدول customers ونقاطه تتوزّع بينهما بدل حساب واحد.
  let normalizedPhone: string | null = null;
  if (input.customerPhone && input.customerPhone.trim()) {
    normalizedPhone = normalizeSaudiPhone(input.customerPhone);
    if (!normalizedPhone) {
      return { error: "رقم الجوال غير صالح" };
    }
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase.rpc("create_pos_order", {
    p_employee_id: session.employeeId,
    p_branch_id: input.branchId,
    p_customer_phone: normalizedPhone,
    p_customer_name: input.customerName,
    p_items: input.items,
    p_payments: input.payments,
    p_reward_id: input.rewardId,
    p_discount_code: input.discountCode,
  });

  if (error) {
    return { error: error.message || "تعذّر إنشاء الطلب" };
  }

  const created = data?.[0];
  if (!created) {
    return { error: "تعذّر إنشاء الطلب" };
  }

  await queueOrderPrintJobs(created.order_id, input.stationId);

  return { orderId: created.order_id, dailyOrderNumber: created.daily_order_number };
}

/** يُستدعى عند إدخال جوال العميل بالدفع، لعرض رصيد نقاطه والمكافآت المتاحة له. */
export async function lookupCustomerAction(phone: string): Promise<CustomerLookup | null> {
  const session = await getSession();
  if (!session) return null;

  const normalized = normalizeSaudiPhone(phone);
  if (!normalized) return null;

  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from("customers")
    .select("id, full_name, points_balance")
    .eq("phone", normalized)
    .maybeSingle();

  if (!data) return null;

  return { id: data.id, fullName: data.full_name, pointsBalance: data.points_balance };
}

type RawRewardWithLink = {
  id: string;
  name: string | null;
  description: string | null;
  points_cost: number;
  discount_amount: number;
  products: { name: string; price: number } | null;
  combos: { name: string; price: number } | null;
};

/** المكافآت المربوطة بصنف/وجبة (product_id/combo_id) تُعرض بالاسم والسعر
 * الحيّين للصنف نفسه بدل القيم المخزّنة بجدول rewards — نفس منطق create_pos_order. */
export async function listActiveRewardsAction(): Promise<Reward[]> {
  const session = await getSession();
  if (!session) return [];

  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from("rewards")
    .select(
      "id, name, description, points_cost, discount_amount, products ( name, price ), combos ( name, price )",
    )
    .eq("is_active", true)
    .order("points_cost", { ascending: true });

  return ((data ?? []) as unknown as RawRewardWithLink[]).map((reward) => {
    const linked = reward.products ?? reward.combos;
    return {
      id: reward.id,
      name: linked?.name ?? reward.name ?? "",
      description: linked ? null : reward.description,
      pointsCost: reward.points_cost,
      discountAmount: linked?.price ?? reward.discount_amount,
    };
  });
}

/**
 * معاينة فقط — للسماح للواجهة تعرض الخصم قبل الإرسال. الفحص الحقيقي
 * (النافذ، الحد الأدنى، عدد الاستخدامات) يُعاد كاملاً وبشكل ذرّي داخل
 * create_pos_order وقت الإرسال الفعلي، فما نثق بنتيجة هذي الدالة وحدها.
 */
export async function lookupDiscountCodeAction(
  code: string,
  subtotal: number,
): Promise<{ error?: string; preview?: DiscountCodePreview }> {
  const session = await getSession();
  if (!session) return { error: "الجلسة منتهية — سجّل الدخول من جديد" };

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
