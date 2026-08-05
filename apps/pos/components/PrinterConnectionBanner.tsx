"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import { isWebUsbSupported, getPairedPrinter, setCurrentDevice, onConnectionChange } from "@/lib/webUsbPrinter";

// بديل بانر heartbeat القديم — يعتمد مباشرة على أحداث navigator.usb للاتصال
// بدل استطلاع دوري لحالة عامل طباعة منفصل (لم يعد موجوداً). نقطة فشل واحدة
// فقط الآن (اتصال الطابعة بهذا التبويب)، بدل التمييز بين "عامل الطباعة غير
// متصل" و"الطابعة غير متصلة" بالنظام القديم.
export function PrinterConnectionBanner() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkPaired() {
      if (!isWebUsbSupported()) {
        setMessage("هذا المتصفح لا يدعم الطباعة التلقائية — استخدم Chrome أو Edge");
        return;
      }
      const device = await getPairedPrinter();
      if (cancelled) return;
      if (device) {
        setCurrentDevice(device);
        setMessage(null);
      } else {
        setMessage("لم يتم توصيل طابعة بهذا الجهاز بعد");
      }
    }

    void checkPaired();

    const unsubscribe = onConnectionChange((connected) => {
      if (connected) {
        void checkPaired();
      } else {
        setMessage("الطابعة غير متصلة — تحقق من الجهاز");
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  if (!message) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-red-600 px-4 py-2 text-sm font-medium text-white">
      <WifiOff className="h-4 w-4" strokeWidth={2} />
      {message}
      <Link href="/printer-settings" className="underline">
        إعداد الآن
      </Link>
    </div>
  );
}
