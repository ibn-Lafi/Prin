"use client";

import { useEffect, useState, useTransition } from "react";
import { Usb, CheckCircle2, AlertTriangle } from "lucide-react";
import { useDeviceId } from "@/lib/device";
import {
  isWebUsbSupported,
  requestPrinterPairing,
  getPairedPrinter,
  setCurrentDevice,
  getCurrentDevice,
  printBytes,
} from "@/lib/webUsbPrinter";
import { renderTestTicket } from "@/lib/escpos";

export function PrinterSettingsView() {
  const deviceId = useDeviceId();

  const [supported, setSupported] = useState(true);
  const [pairedDeviceName, setPairedDeviceName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<"idle" | "success" | "error">("idle");
  const [testError, setTestError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function init() {
      setSupported(isWebUsbSupported());
      const device = await getPairedPrinter();
      if (device) {
        setCurrentDevice(device);
        setPairedDeviceName(device.productName ?? "طابعة USB");
      }
    }
    void init();
  }, []);

  function handleConnect() {
    setError(null);
    startTransition(async () => {
      try {
        const device = await requestPrinterPairing();
        setCurrentDevice(device);
        setPairedDeviceName(device.productName ?? "طابعة USB");
      } catch (err) {
        setError(err instanceof Error ? err.message : "لم يتم اختيار طابعة");
      }
    });
  }

  function handleTestPrint() {
    setTestResult("idle");
    setTestError(null);
    setError(null);
    startTransition(async () => {
      try {
        if (!getCurrentDevice()) throw new Error("لا توجد طابعة متصلة");
        await printBytes(renderTestTicket());
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
          <Usb className="h-4 w-4 text-[var(--color-brand-muted)]" strokeWidth={1.75} />
          الطابعة
        </p>

        {!supported ? (
          <p className="text-sm font-medium text-[var(--color-brand-primary)]">
            هذا المتصفح لا يدعم الطباعة التلقائية — استخدم Chrome أو Edge.
          </p>
        ) : (
          <>
            <p className="text-xs text-[var(--color-brand-muted)]">
              وصّل طابعة الفواتير الحرارية بمنفذ USB بهذا الجهاز ثم اضغط &quot;توصيل الطابعة&quot; — إذن يُمنح مرة واحدة فقط،
              وبعدها تتصل الطابعة تلقائياً بكل فتح لهذه الصفحة. طابعة واحدة فقط تطبع فاتورة المطبخ ثم فاتورة العميل
              تباعاً، كل واحدة تُقص لوحدها.
            </p>

            {pairedDeviceName ? (
              <div className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2.5 text-sm font-medium text-green-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                متصل: {pairedDeviceName}
              </div>
            ) : (
              <button
                type="button"
                disabled={isPending}
                onClick={handleConnect}
                className="rounded-xl bg-[var(--color-brand-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                توصيل الطابعة
              </button>
            )}

            {pairedDeviceName && (
              <button
                type="button"
                disabled={isPending}
                onClick={handleTestPrint}
                className="rounded-xl bg-[var(--color-brand-background)] px-4 py-2.5 text-sm font-medium ring-1 ring-[var(--color-brand-border)] disabled:opacity-50"
              >
                طباعة تجريبية
              </button>
            )}

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
          </>
        )}

        {error && <p className="text-sm font-medium text-[var(--color-brand-primary)]">{error}</p>}
      </div>
    </div>
  );
}
