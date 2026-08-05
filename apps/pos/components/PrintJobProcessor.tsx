"use client";

import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@brin/database";
import { getBranchId, getDeviceId } from "@/lib/device";
import { fetchPrintJobAction, pollUnclaimedPrintJobsAction } from "@/app/(protected)/printer-settings/actions";
import { printJob } from "@/lib/printJob";

const SAFETY_NET_POLL_MS = 20_000;

// يلتقط مهام الطباعة التي لا يصاحبها تبويب كاشير وقت إدراجها — حالياً فقط
// فاتورة مطبخ طلبات المنيو الإلكتروني الجديدة (تُنشأ من apps/menu، بلا جهاز
// كاشير مستهدف). مسارَان متكاملان:
// - اشتراك لحظي بـ print_job_notifications (نفس نمط IncomingOrdersWatcher):
//   عند وصول إشعار، محاولة حجز المهمة ذرّياً ثم طباعتها فوراً.
// - استطلاع دوري خفيف (شبكة أمان) يغطي مهاماً فاتها الاشتراك اللحظي — تبويب
//   أُغلق وقت الإدراج ثم فُتح لاحقاً، أو مهمة تحرّرت بعد فشل طباعة سابقة.
export function PrintJobProcessor() {
  useEffect(() => {
    const rawBranchId = getBranchId();
    if (!rawBranchId) return;
    const branchId: string = rawBranchId;

    async function claimAndPrint(printJobId: string) {
      const deviceId = getDeviceId();
      if (!deviceId) return;
      const job = await fetchPrintJobAction(printJobId, deviceId);
      if (!job) return; // تبويب آخر سبقنا بالحجز، أو المهمة أُسندت مسبقاً
      await printJob(job.id, job.target, job.payload);
    }

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("pos-print-job-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "print_job_notifications",
          filter: `branch_id=eq.${branchId}`,
        },
        (payload) => {
          const notification = payload.new as { print_job_id: string } | undefined;
          if (!notification) return;
          void claimAndPrint(notification.print_job_id);
        },
      )
      .subscribe();

    async function sweep() {
      const jobs = await pollUnclaimedPrintJobsAction(branchId);
      for (const job of jobs) {
        await claimAndPrint(job.id);
      }
    }

    void sweep();
    const interval = setInterval(() => void sweep(), SAFETY_NET_POLL_MS);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  return null;
}
