import { createSupabaseServiceRoleClient } from "@brin/database";
import type { KitchenPrintPayload, CustomerPrintPayload } from "@brin/utils";
import { config } from "./config";
import { getPrinter } from "./printers";
import { renderKitchenTicket, renderCustomerReceipt } from "./receipts";
import { getStationBranchId } from "./settingsSync";

const MAX_ATTEMPTS = 5;
const SWEEP_INTERVAL_MS = 15_000;

type PrintJobRow = {
  id: string;
  target: "kitchen" | "customer";
  payload: unknown;
  attempts: number;
  station_id: string | null;
  branch_id: string;
};

const supabase = createSupabaseServiceRoleClient();
const processingIds = new Set<string>();

// طابعة فعلية واحدة فقط بالجهاز — طلب المطبخ وطلب العميل لنفس الفاتورة
// صفّان منفصلان بـ print_jobs وقد يوصلان بنفس اللحظة تقريباً (queueOrderPrintJobs
// تُدرجهما معاً)، فبدون هذا التسلسل ممكن ينفّذ الاثنان clear()/execute() على
// نفس كائن الطابعة بنفس الوقت ويتداخل محتواهما ببعض. runOnPrinter يضمن ما
// تبدأ فاتورة بالطباعة الفعلية إلا بعد ما تخلص اللي قبلها كاملة (بما فيها القص).
let printerQueue: Promise<void> = Promise.resolve();

function runOnPrinter(task: () => Promise<void>): Promise<void> {
  const result = printerQueue.then(task, task);
  printerQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

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
      // مهمة بدون جهاز محدد (طلب إلكتروني) — تُقيَّد بفرع هذه المحطة، حتى لو
      // كانت المحطة شغّالة وجاهزة، عشان ما تُطبع تذكرة فرع ثاني هنا بالغلط.
      if (job.branch_id !== getStationBranchId()) return;

      const claimed = await claimUnassignedJob(job.id);
      if (!claimed) return;
    }

    await runOnPrinter(async () => {
      const printer = getPrinter();
      if (!printer) throw new Error("الطابعة غير مهيّأة — اضبط عنوانها من صفحة إعدادات الطباعة بالكاشير");

      printer.clear();
      if (job.target === "kitchen") {
        renderKitchenTicket(printer, job.payload as KitchenPrintPayload);
      } else {
        renderCustomerReceipt(printer, job.payload as CustomerPrintPayload);
      }
      await printer.execute();
    });

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
  const branchId = getStationBranchId();
  const orFilter = branchId
    ? `station_id.eq.${config.stationId},and(station_id.is.null,branch_id.eq.${branchId})`
    : `station_id.eq.${config.stationId}`;

  const { data, error } = await supabase
    .from("print_jobs")
    .select("id, target, payload, attempts, station_id, branch_id")
    .eq("status", "pending")
    .or(orFilter)
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
        if (job.station_id === null && job.branch_id !== getStationBranchId()) return;
        void processJob(job);
      },
    )
    .subscribe();
}
