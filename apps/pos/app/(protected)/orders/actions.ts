"use server";

import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { getSession } from "@/lib/session";
import { queueOrderPrintJobs } from "@/lib/printing";
import type { CustomerLookup, Reward } from "@/lib/types";

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
    return { error: "التذكرة فاضية" };
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase.rpc("create_pos_order", {
    p_employee_id: session.employeeId,
    p_customer_phone: input.customerPhone,
    p_customer_name: input.customerName,
    p_items: input.items,
    p_payments: input.payments,
    p_reward_id: input.rewardId,
  });

  if (error) {
    return { error: error.message || "تعذّر إنشاء الطلب" };
  }

  const created = data?.[0];
  if (!created) {
    return { error: "تعذّر إنشاء الطلب" };
  }

  await queueOrderPrintJobs(created.order_id);

  return { orderId: created.order_id, dailyOrderNumber: created.daily_order_number };
}

/** يُستدعى عند إدخال جوال العميل بالدفع، لعرض رصيد نقاطه والمكافآت المتاحة له. */
export async function lookupCustomerAction(phone: string): Promise<CustomerLookup | null> {
  const session = await getSession();
  if (!session) return null;

  const trimmed = phone.trim();
  if (!trimmed) return null;

  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from("customers")
    .select("id, full_name, points_balance")
    .eq("phone", trimmed)
    .maybeSingle();

  if (!data) return null;

  return { id: data.id, fullName: data.full_name, pointsBalance: data.points_balance };
}

export async function listActiveRewardsAction(): Promise<Reward[]> {
  const session = await getSession();
  if (!session) return [];

  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from("rewards")
    .select("id, name, description, points_cost, discount_amount")
    .eq("is_active", true)
    .order("points_cost", { ascending: true });

  return (data ?? []).map((reward) => ({
    id: reward.id,
    name: reward.name,
    description: reward.description,
    pointsCost: reward.points_cost,
    discountAmount: reward.discount_amount,
  }));
}
