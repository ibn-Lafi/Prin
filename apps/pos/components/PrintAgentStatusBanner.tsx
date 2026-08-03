"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import { getPrintAgentStatusAction } from "@/app/(protected)/actions";
import { getStationId } from "@/lib/device";

const POLL_INTERVAL_MS = 10_000;
const STALE_HEARTBEAT_MS = 30_000;

export function PrintAgentStatusBanner() {
  const [message, setMessage] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const stationId = getStationId();
      if (!stationId) {
        if (!cancelled) {
          setNeedsSetup(true);
          setMessage("لم يتم إعداد الطباعة لهذا الجهاز بعد");
        }
        return;
      }
      setNeedsSetup(false);

      const status = await getPrintAgentStatusAction(stationId);
      if (cancelled) return;

      if (!status || !status.lastHeartbeatAt) {
        setMessage("جهاز الطباعة غير متصل — لن تُطبع الطلبات تلقائياً");
        return;
      }

      const isStale = Date.now() - new Date(status.lastHeartbeatAt).getTime() > STALE_HEARTBEAT_MS;
      if (isStale) {
        setMessage("جهاز الطباعة غير متصل — لن تُطبع الطلبات تلقائياً");
      } else if (!status.kitchenPrinterConnected && !status.customerPrinterConnected) {
        setMessage("الطابعتان غير متصلتين — تحقق من الأجهزة");
      } else if (!status.kitchenPrinterConnected) {
        setMessage("طابعة المطبخ غير متصلة — تحقق من الجهاز");
      } else if (!status.customerPrinterConnected) {
        setMessage("طابعة العميل غير متصلة — تحقق من الجهاز");
      } else {
        setMessage(null);
      }
    }

    check();
    const interval = setInterval(check, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!message) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-red-600 px-4 py-2 text-sm font-medium text-white">
      <WifiOff className="h-4 w-4" strokeWidth={2} />
      {message}
      {needsSetup && (
        <Link href="/printer-settings" className="underline">
          إعداد الآن
        </Link>
      )}
    </div>
  );
}
