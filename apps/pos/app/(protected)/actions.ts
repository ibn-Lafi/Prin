"use server";

import { redirect } from "next/navigation";
import { roundMoney } from "@brin/utils";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { getSession, clearSession } from "@/lib/session";
import { queueOrderPrintJobs, queueOnlineOrderCustomerReceipt } from "@/lib/printing";
import type {
  ActiveOnlineOrder,
  IncomingOrder,
  PrintAgentStatus,
  PrintJobStatus,
  ShiftSummary,
} from "@/lib/types";

// شكل نتيجة الاستعلام المتداخل (Nested Select) — نصرّحه يدوياً ونكسره بـ "as"
// عند القراءة، بنفس نمط apps/menu، لأن database.types.ts لا يحمل معلومات
// العلاقات (Relationships) الكافية ليستنتجها Supabase تلقائياً.
type IncomingOrderRow = {
  id: string;
  daily_order_number: number;
  total: number;
  customers: { full_name: string | null; phone: string } | null;
  order_items: {
    id: string;
    quantity: number;
    products: { name: string } | null;
    combos: { name: string } | null;
    order_item_modifiers: { modifiers: { name: string } | null }[];
  }[];
};

export async function logoutAction(): Promise<void> {
  const session = await getSession();
  if (session) {
    const supabase = createSupabaseServiceRoleClient();
    await supabase.from("audit_log").insert({
      employee_id: session.employeeId,
      action_type: "employee_logout",
      description: "تسجيل خروج",
    });
  }
  await clearSession();
  redirect("/login");
}

/**
 * تُستدعى فور وصول إشعار Realtime (اللي ما يحمل غير id/إجمالي الطلب —
 * راجع migration 0018) لجلب التفاصيل الكاملة (العميل والأصناف) بأمان عبر
 * service_role، بدل ما نوسّع صلاحية القراءة العامة (anon) لتشمل بيانات حساسة.
 */
export async function fetchIncomingOrderDetailsAction(
  orderId: string,
): Promise<IncomingOrder | null> {
  const session = await getSession();
  if (!session) return null;

  const supabase = createSupabaseServiceRoleClient();
  const { data: rawData, error } = await supabase
    .from("orders")
    .select(
      `
      id, daily_order_number, total,
      customers ( full_name, phone ),
      order_items (
        id, quantity,
        products ( name ),
        combos ( name ),
        order_item_modifiers ( modifiers ( name ) )
      )
    `,
    )
    .eq("id", orderId)
    .eq("channel", "online")
    .maybeSingle();

  const data = rawData as unknown as IncomingOrderRow | null;
  if (error || !data) return null;

  return {
    id: data.id,
    dailyOrderNumber: data.daily_order_number,
    total: data.total,
    customerName: data.customers?.full_name ?? null,
    customerPhone: data.customers?.phone ?? null,
    items: (data.order_items ?? []).map((item) => ({
      id: item.id,
      name: item.products?.name ?? item.combos?.name ?? "صنف",
      quantity: item.quantity,
      modifiers: (item.order_item_modifiers ?? []).map((m) => m.modifiers?.name ?? "").filter(Boolean),
    })),
  };
}

/** يحوّل الطلب من "received" إلى "accepted" — بضمان ذرّي ضد استلام مزدوج من جهازين. */
export async function acceptIncomingOrderAction(
  orderId: string,
  stationId: string | null,
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) {
    return { error: "الجلسة منتهية — سجّل الدخول من جديد" };
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("orders")
    .update({
      status: "accepted",
      accepted_by_employee_id: session.employeeId,
      accepted_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("status", "received")
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: "تعذّر تحديث حالة الطلب" };
  }
  if (!data) {
    return { error: "الطلب تم استلامه مسبقاً من جهاز آخر" };
  }

  await queueOrderPrintJobs(orderId, stationId);

  return {};
}

/** قائمة الطلبات الإلكترونية النشطة (بانتظار القبول أو قيد التحضير) — تغذّي
 * شريط الطلبات العلوي بالكاشير. */
export async function listActiveOnlineOrdersAction(): Promise<ActiveOnlineOrder[]> {
  const session = await getSession();
  if (!session) return [];

  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from("orders")
    .select("id, daily_order_number, status, total, payments ( id )")
    .eq("channel", "online")
    .in("status", ["received", "accepted"])
    .order("created_at", { ascending: true });

  return ((data ?? []) as unknown as { id: string; daily_order_number: number; status: string; total: number; payments: { id: string }[] }[]).map(
    (order) => ({
      id: order.id,
      dailyOrderNumber: order.daily_order_number,
      status: order.status as "received" | "accepted",
      total: order.total,
      isPaid: (order.payments ?? []).length > 0,
    }),
  );
}

/** يحوّل طلب إلكتروني من "accepted" إلى "completed" — يُستخدم لما يُسلَّم
 * الطلب فعلياً للعميل بالفرع، فيخرج من قائمة الطلبات النشطة بالكاشير ويظهر
 * ضمن "الطلبات السابقة" بالمنيو الإلكتروني. */
export async function completeOnlineOrderAction(orderId: string): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) {
    return { error: "الجلسة منتهية — سجّل الدخول من جديد" };
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data: existingPayment } = await supabase
    .from("payments")
    .select("id")
    .eq("order_id", orderId)
    .limit(1)
    .maybeSingle();

  if (!existingPayment) {
    return { error: "يجب تحصيل الدفع قبل تسليم الطلب" };
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ status: "completed" })
    .eq("id", orderId)
    .eq("status", "accepted")
    .eq("channel", "online")
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: "تعذّر تحديث حالة الطلب" };
  }
  if (!data) {
    return { error: "تعذّر تحديث الطلب — تأكد أنه بحالة قيد التحضير" };
  }

  return {};
}

/** يحصّل دفع طلب إلكتروني (كاش/شبكة) وقت استلام العميل له بالكاشير — يستدعي
 * RPC ذرّية (collect_online_order_payment) تمنع التحصيل المزدوج وتمنح نقاط
 * الاكتساب، ثم يطبع إيصال العميل على جهاز هذا الكاشير تحديداً. */
export async function collectOnlinePaymentAction(
  orderId: string,
  payments: { method: "cash" | "card_terminal"; amount: number }[],
  stationId: string | null,
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) {
    return { error: "الجلسة منتهية — سجّل الدخول من جديد" };
  }

  if (payments.length === 0) {
    return { error: "أدخل مبلغ الدفع" };
  }

  const supabase = createSupabaseServiceRoleClient();
  const { error } = await supabase.rpc("collect_online_order_payment", {
    p_order_id: orderId,
    p_employee_id: session.employeeId,
    p_payments: payments,
  });

  if (error) {
    return { error: error.message || "تعذّر تحصيل الدفع" };
  }

  await queueOnlineOrderCustomerReceipt(orderId, stationId);

  return {};
}

type ShiftPosOrderRow = {
  payments: { method: string; amount: number }[];
};

/**
 * يغلق جلسة عمل الكاشير الحالية (المفتوحة منذ آخر تسجيل دخول) ويحسب ملخص
 * المبالغ خلالها: طلبات الكاشير المباشرة (بوقت الإنشاء) وطلبات المنيو
 * الإلكتروني اللي حصّل هذا الموظف دفعها فعلياً (بوقت التحصيل لا الإنشاء —
 * الطلب الإلكتروني قد يوصل قبل بداية الجلسة بوقت طويل ويُدفَع لاحقاً خلالها).
 * الأعمدة (كاش/شبكة/إلكتروني) تُحسب من دفعات payments الفعلية بغض النظر عن
 * القناة — لو طلب إلكتروني تُدفَع نقداً بالكاشير، يُحسب كاش حقيقي بالدرج
 * (وليس ضمن "إلكتروني")؛ عمود "إلكتروني" يبقى فعلياً لدفع إلكتروني حقيقي
 * (غير مفعّل بعد). تُستدعى عند الضغط على "خروج" قبل تنفيذ logoutAction الفعلي.
 */
export async function closeShiftAndSummarizeAction(): Promise<ShiftSummary | null> {
  const session = await getSession();
  if (!session) return null;

  const supabase = createSupabaseServiceRoleClient();

  const { data: shift } = await supabase
    .from("cashier_shifts")
    .select("id, opened_at")
    .eq("employee_id", session.employeeId)
    .is("closed_at", null)
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!shift) return null;

  const closedAt = new Date().toISOString();

  const [{ data: rawPosOrders }, { data: rawOnlineOrders }] = await Promise.all([
    supabase
      .from("orders")
      .select("payments ( method, amount )")
      .eq("employee_id", session.employeeId)
      .eq("channel", "pos")
      .neq("status", "cancelled")
      .gte("created_at", shift.opened_at)
      .lte("created_at", closedAt),
    supabase
      .from("orders")
      .select("payments ( method, amount )")
      .eq("accepted_by_employee_id", session.employeeId)
      .eq("channel", "online")
      .neq("status", "cancelled")
      .gte("accepted_at", shift.opened_at)
      .lte("accepted_at", closedAt),
  ]);

  const posOrders = (rawPosOrders ?? []) as unknown as ShiftPosOrderRow[];
  const onlineOrders = (rawOnlineOrders ?? []) as unknown as ShiftPosOrderRow[];

  let cash = 0;
  let cardTerminal = 0;
  let online = 0;
  for (const order of [...posOrders, ...onlineOrders]) {
    for (const payment of order.payments ?? []) {
      if (payment.method === "cash") cash += payment.amount;
      else if (payment.method === "card_terminal") cardTerminal += payment.amount;
      else if (payment.method === "online_moyasar") online += payment.amount;
    }
  }

  await supabase.from("cashier_shifts").update({ closed_at: closedAt }).eq("id", shift.id);

  return {
    cash: roundMoney(cash),
    cardTerminal: roundMoney(cardTerminal),
    online: roundMoney(online),
    total: roundMoney(cash + cardTerminal + online),
  };
}

/** يُستطلَع (polling) بعد إنشاء/استلام أي طلب لعرض حالة الطباعة بالواجهة. */
export async function getPrintJobStatusAction(orderId: string): Promise<PrintJobStatus[]> {
  const session = await getSession();
  if (!session) return [];

  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from("print_jobs")
    .select("target, status")
    .eq("order_id", orderId);

  return (data ?? []) as PrintJobStatus[];
}

/** يُستطلَع دورياً بواجهة الكاشير لإظهار تنبيه فقد اتصال الطابعة/جهاز الطباعة —
 * مقيّد بجهاز الكاشير الحالي (stationId) بدل حالة عامة لكل المطعم، حتى لا يشوف
 * كاشير جهاز A تنبيهاً بسبب طابعة جهاز B. */
export async function getPrintAgentStatusAction(stationId: string | null): Promise<PrintAgentStatus | null> {
  const session = await getSession();
  if (!session || !stationId) return null;

  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from("print_agent_status")
    .select("last_heartbeat_at, kitchen_printer_connected, customer_printer_connected")
    .eq("id", stationId)
    .maybeSingle();

  if (!data) return null;

  return {
    lastHeartbeatAt: data.last_heartbeat_at,
    kitchenPrinterConnected: data.kitchen_printer_connected,
    customerPrinterConnected: data.customer_printer_connected,
  };
}
