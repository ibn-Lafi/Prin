"use client";

import type { KitchenPrintPayload, CustomerPrintPayload } from "@brin/utils";
import { markPrintedAction, markFailedAction } from "@/app/(protected)/printer-settings/actions";
import { renderKitchenTicket, renderCustomerReceipt } from "./escpos";
import { printBytes, runOnPrinter } from "./webUsbPrinter";

// نقطة الطباعة الفعلية المشتركة — يستدعيها كل من: التبويب المُنشئ للمهمة
// (طباعة فورية فور نجاح الطلب، بدون أي جولة realtime، راجع CheckoutDialog/
// CollectPaymentDialog) ومعالج المهام غير المُسندة (PrintJobProcessor). عند
// الفشل تُحرَّر المهمة (markFailedAction) ليقدر أي تبويب آخر بنفس الفرع
// يلتقطها لاحقاً — نفس دور sweepPendingJobs بالنظام القديم.
export async function printJob(
  jobId: string,
  target: "kitchen" | "customer",
  payload: KitchenPrintPayload | CustomerPrintPayload,
): Promise<void> {
  try {
    await runOnPrinter(async () => {
      const bytes =
        target === "kitchen"
          ? renderKitchenTicket(payload as KitchenPrintPayload)
          : renderCustomerReceipt(payload as CustomerPrintPayload);
      await printBytes(bytes);
    });
    await markPrintedAction(jobId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await markFailedAction(jobId, message);
  }
}
