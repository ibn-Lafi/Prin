"use server";

import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { getSession } from "@/lib/session";
import { queueOrderPrintJobs } from "@/lib/printing";

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
