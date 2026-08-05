"use client";

import type { KitchenPrintPayload, CustomerPrintPayload } from "@brin/utils";
import { markPrintedAction, markFailedAction } from "@/app/(protected)/printer-settings/actions";
import { renderKitchenTicketHtml, renderCustomerReceiptHtml } from "./receiptHtml";
import { printHtml } from "./printViaBrowser";

// تسلسل الطباعة داخل التبويب — يضمن عدم تداخل طباعة فاتورتين (مطبخ ثم عميل)
// لو وصلتا بنفس اللحظة تقريباً، ولا يفتح أكثر من نافذة طباعة بنفس الوقت.
let printQueue: Promise<void> = Promise.resolve();

function runOnPrinter(task: () => Promise<void>): Promise<void> {
  const result = printQueue.then(task, task);
  printQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

// نقطة الطباعة الفعلية المشتركة — يستدعيها كل من: التبويب المُنشئ للمهمة
// (طباعة فورية فور نجاح الطلب، بدون أي جولة realtime، راجع CheckoutDialog/
// CollectPaymentDialog) ومعالج المهام غير المُسندة (PrintJobProcessor). طباعة
// عادية عبر المتصفح (window.print) على الطابعة المضبوطة كطابعة نظام بجهاز
// الكاشير — بدون أي إقران أو تعريف خاص. عند الفشل تُحرَّر المهمة
// (markFailedAction) ليقدر أي تبويب آخر بنفس الفرع يلتقطها لاحقاً.
export async function printJob(
  jobId: string,
  target: "kitchen" | "customer",
  payload: KitchenPrintPayload | CustomerPrintPayload,
): Promise<void> {
  try {
    await runOnPrinter(async () => {
      const html =
        target === "kitchen"
          ? renderKitchenTicketHtml(payload as KitchenPrintPayload)
          : await renderCustomerReceiptHtml(payload as CustomerPrintPayload);
      await printHtml(html);
    });
    await markPrintedAction(jobId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await markFailedAction(jobId, message);
  }
}
