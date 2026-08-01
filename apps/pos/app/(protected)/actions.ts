"use server";

import { redirect } from "next/navigation";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { getSession, clearSession } from "@/lib/session";
import { queueOrderPrintJobs } from "@/lib/printing";
import type { ActiveOnlineOrder, IncomingOrder, PrintAgentStatus, PrintJobStatus } from "@/lib/types";

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
    .eq("status", "received")
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
export async function acceptIncomingOrderAction(orderId: string): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) {
    return { error: "الجلسة منتهية — سجّل الدخول من جديد" };
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ status: "accepted" })
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

  await queueOrderPrintJobs(orderId);

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
    .select("id, daily_order_number, status, total")
    .eq("channel", "online")
    .in("status", ["received", "accepted"])
    .order("created_at", { ascending: true });

  return (data ?? []).map((order) => ({
    id: order.id,
    dailyOrderNumber: order.daily_order_number,
    status: order.status as "received" | "accepted",
    total: order.total,
  }));
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

/** يُستطلَع دورياً بواجهة الكاشير لإظهار تنبيه فقد اتصال الطابعة/جهاز الطباعة. */
export async function getPrintAgentStatusAction(): Promise<PrintAgentStatus | null> {
  const session = await getSession();
  if (!session) return null;

  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from("print_agent_status")
    .select("last_heartbeat_at, kitchen_printer_connected, customer_printer_connected")
    .eq("id", 1)
    .maybeSingle();

  if (!data) return null;

  return {
    lastHeartbeatAt: data.last_heartbeat_at,
    kitchenPrinterConnected: data.kitchen_printer_connected,
    customerPrinterConnected: data.customer_printer_connected,
  };
}
