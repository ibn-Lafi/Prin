"use client";

import { useState, useTransition } from "react";
import { Printer, CheckCircle2, AlertTriangle } from "lucide-react";
import { useDeviceId } from "@/lib/device";
import { renderTestTicketHtml } from "@/lib/receiptHtml";
import { printHtml } from "@/lib/printViaBrowser";

export function PrinterSettingsView() {
  const deviceId = useDeviceId();

  const [testResult, setTestResult] = useState<"idle" | "success" | "error">("idle");
  const [testError, setTestError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleTestPrint() {
    setTestResult("idle");
    setTestError(null);
    startTransition(async () => {
      try {
        await printHtml(await renderTestTicketHtml());
        setTestResult("success");
      } catch (err) {
        setTestResult("error");
        setTestError(err instanceof Error ? err.message : String(err));
      }
    });
  }

  return (
    <div className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-2xl bg-[var(--color-brand-card)] p-5 ring-1 ring-[var(--color-brand-border)]">
        <p className="text-sm font-semibold">معرّف هذا الجهاز</p>
        <p className="text-xs text-[var(--color-brand-muted)]">
          يُولَّد تلقائياً ويُخزَّن بمتصفح هذا الجهاز فقط — للاستخدام الداخلي عند تشخيص مشاكل الطباعة، بلا حاجة لأي
          إدخال يدوي.
        </p>
        <div className="flex items-center justify-between rounded-xl bg-[var(--color-brand-background)] px-3 py-2.5">
          <span className="font-mono text-xs text-[var(--color-brand-muted)]">{deviceId ?? "..."}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-[var(--color-brand-card)] p-5 ring-1 ring-[var(--color-brand-border)]">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <Printer className="h-4 w-4 text-[var(--color-brand-muted)]" strokeWidth={1.75} />
          الطابعة
        </p>
        <p className="text-xs text-[var(--color-brand-muted)]">
          الطباعة تعتمد على أن الطابعة الحرارية مضبوطة أصلاً كطابعة نظام عادية بهذا الجهاز (بنفس الطريقة التي تطبع
          بها أي برنامج آخر عليها) — بلا أي إعداد إضافي هنا. طابعة واحدة فقط تطبع فاتورة المطبخ ثم فاتورة العميل
          تباعاً.
        </p>

        <button
          type="button"
          disabled={isPending}
          onClick={handleTestPrint}
          className="rounded-xl bg-[var(--color-brand-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          طباعة تجريبية
        </button>

        {testResult === "success" && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-green-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            تمت الطباعة — تحقق من الورق الخارج من الطابعة
          </p>
        )}
        {testResult === "error" && (
          <p className="flex items-start gap-1.5 text-sm font-medium text-[var(--color-brand-primary)]">
            <AlertTriangle className="h-4 w-4 shrink-0 translate-y-0.5" strokeWidth={1.75} />
            <span>تعذّرت الطباعة التجريبية{testError ? `: ${testError}` : ""}</span>
          </p>
        )}

        <p className="text-xs text-[var(--color-brand-muted)]">
          لطباعة تلقائية بلا أي نافذة تأكيد لكل فاتورة، تحتاج شغّل متصفح جهاز الكاشير بخيار التشغيل
          &quot;‎--kiosk-printing&quot; مع تحديد الطابعة الحرارية كطابعة افتراضية بنظام التشغيل — بدونه سيظهر مربع
          طباعة قياسي (اضغط طباعة) لكل فاتورة، وهو سلوك متصفح طبيعي.
        </p>
      </div>
    </div>
  );
}
