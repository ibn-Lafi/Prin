"use client";

import { useEffect, useState } from "react";
import { Printer, CheckCircle2, AlertTriangle } from "lucide-react";
import { getPrintJobStatusAction } from "@/app/(protected)/actions";
import type { PrintJobStatus } from "@/lib/types";

const POLL_INTERVAL_MS = 1500;
const MAX_POLLS = 20;

const LABELS: Record<PrintJobStatus["target"], string> = {
  kitchen: "فاتورة المطبخ",
  customer: "فاتورة العميل",
};

export function PrintStatusIndicator({ orderId }: { orderId: string }) {
  const [jobs, setJobs] = useState<PrintJobStatus[]>([]);

  useEffect(() => {
    let cancelled = false;
    let pollCount = 0;

    async function poll() {
      const result = await getPrintJobStatusAction(orderId);
      if (cancelled) return;
      setJobs(result);

      pollCount += 1;
      const allSettled = result.length > 0 && result.every((job) => job.status !== "pending");
      if (!allSettled && pollCount < MAX_POLLS) {
        setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (jobs.length === 0) {
    return (
      <p className="flex items-center justify-center gap-1.5 text-xs text-[var(--color-brand-muted)]">
        <Printer className="h-3.5 w-3.5 animate-pulse" strokeWidth={1.75} />
        جارِ إرسال الطباعة...
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {jobs.map((job) => (
        <p
          key={job.target}
          className={`flex items-center justify-center gap-1.5 text-xs ${
            job.status === "failed" ? "text-[var(--color-brand-primary)]" : "text-[var(--color-brand-muted)]"
          }`}
        >
          {job.status === "printed" && <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} />}
          {job.status === "failed" && <AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.75} />}
          {job.status === "pending" && <Printer className="h-3.5 w-3.5 animate-pulse" strokeWidth={1.75} />}
          {LABELS[job.target]} —{" "}
          {job.status === "printed" ? "تمت الطباعة" : job.status === "failed" ? "تعذّرت الطباعة، تحقق من الجهاز" : "جارِ الطباعة..."}
        </p>
      ))}
    </div>
  );
}
