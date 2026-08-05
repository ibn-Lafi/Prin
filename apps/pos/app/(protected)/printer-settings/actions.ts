"use server";

import type { KitchenPrintPayload, CustomerPrintPayload } from "@brin/utils";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";
import { getSession } from "@/lib/session";

export type ActionResult = { error?: string };

const MAX_ATTEMPTS = 5;

export type FetchedPrintJob = {
  id: string;
  target: "kitchen" | "customer";
  payload: KitchenPrintPayload | CustomerPrintPayload;
};

/** تُحاول حجز مهمة طباعة غير مُسندة (طلب منيو إلكتروني بلا تبويب كاشير
 * مصاحب وقت إدراجها) لهذا الجهاز تحديداً — تحديث ذرّي ضد حجز مزدوج من أكثر
 * من تبويب كاشير مفتوح بنفس الفرع استلم نفس الإشعار اللحظي بنفس اللحظة.
 * أول تبويب ينجح بالتحديث يحصل على المحتوى الفعلي، البقية يرجع لهم null. */
export async function fetchPrintJobAction(printJobId: string, deviceId: string): Promise<FetchedPrintJob | null> {
  const session = await getSession();
  if (!session) return null;

  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from("print_jobs")
    .update({ station_id: deviceId })
    .eq("id", printJobId)
    .is("station_id", null)
    .select("id, target, payload")
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    target: data.target as "kitchen" | "customer",
    payload: data.payload as unknown as KitchenPrintPayload | CustomerPrintPayload,
  };
}

export async function markPrintedAction(printJobId: string): Promise<void> {
  const session = await getSession();
  if (!session) return;

  const supabase = createSupabaseServiceRoleClient();
  await supabase
    .from("print_jobs")
    .update({ status: "printed", printed_at: new Date().toISOString() })
    .eq("id", printJobId);
}

/** فشل الطباعة الفعلية (بعد نجاح الحجز أو الطباعة الفورية بنفس التبويب) —
 * يزيد عداد المحاولات، ويحرّر الحجز (station_id = null) ليقدر أي تبويب آخر
 * بنفس الفرع يلتقطها لاحقاً عبر pollUnclaimedPrintJobsAction، إلا لو استُنفد
 * الحد الأقصى للمحاولات فتصير "failed" نهائياً وتبقى مُسندة كما هي. */
export async function markFailedAction(printJobId: string, errorMessage: string): Promise<void> {
  const session = await getSession();
  if (!session) return;

  const supabase = createSupabaseServiceRoleClient();
  const { data: job } = await supabase
    .from("print_jobs")
    .select("attempts")
    .eq("id", printJobId)
    .maybeSingle();
  if (!job) return;

  const attempts = job.attempts + 1;
  const givingUp = attempts >= MAX_ATTEMPTS;

  await supabase
    .from("print_jobs")
    .update({
      attempts,
      status: givingUp ? "failed" : "pending",
      station_id: givingUp ? undefined : null,
      error_message: errorMessage,
    })
    .eq("id", printJobId);
}

export type UnclaimedPrintJob = { id: string };

/** شبكة أمان دورية (استطلاع خفيف، وليس اشتراك لحظي) — تغطي حالتين لا
 * يغطيهما الاشتراك اللحظي وحده: تبويب أُغلق وقت إدراج المهمة ثم فُتح لاحقاً،
 * أو مهمة تحرّرت بعد فشل طباعتها (راجع markFailedAction) بينما كل التبويبات
 * الأخرى كانت غافلة عن أي حدث جديد يُنبّهها. */
export async function pollUnclaimedPrintJobsAction(branchId: string): Promise<UnclaimedPrintJob[]> {
  const session = await getSession();
  if (!session) return [];

  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from("print_jobs")
    .select("id")
    .eq("branch_id", branchId)
    .eq("status", "pending")
    .is("station_id", null)
    .order("created_at", { ascending: true });

  return data ?? [];
}
