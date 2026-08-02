import { createSupabaseServiceRoleClient } from "@brin/database";
import type { KitchenPrintPayload, CustomerPrintPayload } from "@brin/utils";
import { config } from "./config";
import { getKitchenPrinter, getCustomerPrinter } from "./printers";
import { renderKitchenTicket, renderCustomerReceipt } from "./receipts";

const MAX_ATTEMPTS = 5;
const SWEEP_INTERVAL_MS = 15_000;

type PrintJobRow = {
  id: string;
  target: "kitchen" | "customer";
  payload: unknown;
  attempts: number;
  station_id: string | null;
};

const supabase = createSupabaseServiceRoleClient();
const processingIds = new Set<string>();

/** مهام المطبخ لطلبات المنيو الإلكتروني (pay-at-cashier) تُنشأ بدون جهاز
 * محدد (station_id فارغ) — أول عامل طباعة يشوفها يحاول يحجزها ذرّياً
 * (update ... where station_id is null) قبل الطباعة، فما ينطبع نفس الطلب
 * مرتين لو أكثر من عامل طباعة شغّال بنفس الوقت. */
async function claimUnassignedJob(jobId: string): Promise<boolean> {
  const { data } = await supabase
    .from("print_jobs")
    .update({ station_id: config.stationId })
    .eq("id", jobId)
    .is("station_id", null)
    .select("id")
    .maybeSingle();

  return data !== null;
}

async function processJob(job: PrintJobRow): Promise<void> {
  if (processingIds.has(job.id)) return;
  processingIds.add(job.id);

  try {
    if (job.station_id === null) {
      const claimed = await claimUnassignedJob(job.id);
      if (!claimed) return;
    }

    if (job.target === "kitchen") {
      const printer = getKitchenPrinter();
      if (!printer) throw new Error("طابعة المطبخ غير مهيّأة — اضبط عنوانها من لوحة الإدارة");
      printer.clear();
      renderKitchenTicket(printer, job.payload as KitchenPrintPayload);
      await printer.execute();
    } else {
      const printer = getCustomerPrinter();
      if (!printer) throw new Error("طابعة العميل غير مهيّأة — اضبط عنوانها من لوحة الإدارة");
      printer.clear();
      renderCustomerReceipt(printer, job.payload as CustomerPrintPayload);
      await printer.execute();
    }

    await supabase
      .from("print_jobs")
      .update({ status: "printed", printed_at: new Date().toISOString() })
      .eq("id", job.id);

    console.log(`[print] تمت طباعة ${job.target} — ${job.id}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const attempts = job.attempts + 1;
    const givingUp = attempts >= MAX_ATTEMPTS;

    await supabase
      .from("print_jobs")
      .update({
        attempts,
        status: givingUp ? "failed" : "pending",
        error_message: message,
      })
      .eq("id", job.id);

    console.error(
      `[print] فشلت طباعة ${job.target} — ${job.id} (محاولة ${attempts}/${MAX_ATTEMPTS}): ${message}`,
    );
  } finally {
    processingIds.delete(job.id);
  }
}

async function sweepPendingJobs(): Promise<void> {
  const { data, error } = await supabase
    .from("print_jobs")
    .select("id, target, payload, attempts, station_id")
    .eq("status", "pending")
    .or(`station_id.eq.${config.stationId},station_id.is.null`)
    .order("created_at", { ascending: true });

  if (error || !data) return;

  for (const job of data as PrintJobRow[]) {
    await processJob(job);
  }
}

export function startJobQueue(): void {
  void sweepPendingJobs();
  setInterval(() => void sweepPendingJobs(), SWEEP_INTERVAL_MS);

  // بدون فلترة بالاشتراك (يوصل كل الإدراجات) — نتحقق من station_id هنا
  // بنفسنا: مهام جهازي الخاصة، أو مهام بدون جهاز محدد (طلبات المنيو
  // الإلكتروني) نحاول نحجزها أولاً بـ claimUnassignedJob قبل الطباعة.
  supabase
    .channel("print-agent-jobs")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "print_jobs" },
      (payload) => {
        const job = payload.new as PrintJobRow;
        if (!job.target || !job.payload) return;
        if (job.station_id !== null && job.station_id !== config.stationId) return;
        void processJob(job);
      },
    )
    .subscribe();
}
