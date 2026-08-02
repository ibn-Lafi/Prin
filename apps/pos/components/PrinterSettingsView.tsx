"use client";

import { useEffect, useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { useStationId, setStationId } from "@/lib/device";
import {
  getStationPrinterSettingsAction,
  saveStationPrinterSettingsAction,
} from "@/app/(protected)/printer-settings/actions";

export function PrinterSettingsView() {
  const stationId = useStationId();
  const [editingRequested, setEditingRequested] = useState(false);
  const isEditingStationId = editingRequested || !stationId;
  const [stationIdDraft, setStationIdDraft] = useState("");
  const [kitchenInterface, setKitchenInterface] = useState("");
  const [customerInterface, setCustomerInterface] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!stationId) return;

    let cancelled = false;
    async function loadSettings() {
      const settings = await getStationPrinterSettingsAction(stationId!);
      if (cancelled) return;
      setKitchenInterface(settings?.kitchenPrinterInterface ?? "");
      setCustomerInterface(settings?.customerPrinterInterface ?? "");
    }
    void loadSettings();
    return () => {
      cancelled = true;
    };
  }, [stationId]);

  function handleSaveStationId() {
    const trimmed = stationIdDraft.trim();
    if (!trimmed) {
      setError("معرّف الجهاز مطلوب");
      return;
    }
    setError(null);
    setStationId(trimmed);
    setEditingRequested(false);
  }

  function handleSavePrinters() {
    if (!stationId) return;
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await saveStationPrinterSettingsAction(stationId, {
        kitchenPrinterInterface: kitchenInterface,
        customerPrinterInterface: customerInterface,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <div className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-2xl bg-[var(--color-brand-card)] p-5 ring-1 ring-[var(--color-brand-border)]">
        <p className="text-sm font-semibold">معرّف هذا الجهاز</p>
        <p className="text-xs text-[var(--color-brand-muted)]">
          لازم يطابق بالضبط STATION_ID المضبوط بملف .env لعامل الطباعة المثبّت على هذا الجهاز فعلياً — يُخزَّن
          بمتصفح هذا الجهاز بس، مستقل عن تسجيل دخول الموظف.
        </p>
        {isEditingStationId ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={stationIdDraft}
              onChange={(e) => setStationIdDraft(e.target.value)}
              placeholder="مثال: cashier-1"
              className="flex-1 rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
            />
            <button
              type="button"
              onClick={handleSaveStationId}
              className="shrink-0 rounded-xl bg-[var(--color-brand-primary)] px-4 py-2.5 text-sm font-semibold text-white"
            >
              حفظ
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-xl bg-[var(--color-brand-background)] px-3 py-2.5">
            <span className="font-mono text-sm">{stationId}</span>
            <button
              type="button"
              onClick={() => {
                setStationIdDraft(stationId ?? "");
                setEditingRequested(true);
              }}
              className="flex items-center gap-1 text-xs font-medium text-[var(--color-brand-muted)]"
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
              تغيير
            </button>
          </div>
        )}
      </div>

      {stationId && !isEditingStationId && (
        <div className="flex flex-col gap-3 rounded-2xl bg-[var(--color-brand-card)] p-5 ring-1 ring-[var(--color-brand-border)]">
          <p className="text-sm font-semibold">إعدادات الطباعة</p>
          <label className="flex flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
            عنوان طابعة المطبخ
            <input
              type="text"
              value={kitchenInterface}
              onChange={(e) => setKitchenInterface(e.target.value)}
              placeholder="printer:/dev/usb/lp0 أو tcp://192.168.1.50:9100"
              className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
            عنوان طابعة العميل
            <input
              type="text"
              value={customerInterface}
              onChange={(e) => setCustomerInterface(e.target.value)}
              placeholder="printer:/dev/usb/lp1 أو tcp://192.168.1.51:9100"
              className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
            />
          </label>
          <p className="text-xs text-[var(--color-brand-muted)]">
            يقرأها عامل الطباعة تلقائياً خلال 15 ثانية من الحفظ، بدون إعادة تشغيل — بشرط تطابق STATION_ID.
          </p>

          {error && <p className="text-sm font-medium text-[var(--color-brand-primary)]">{error}</p>}
          {saved && !error && <p className="text-sm font-medium text-green-700">تم الحفظ</p>}

          <button
            type="button"
            disabled={isPending}
            onClick={handleSavePrinters}
            className="rounded-xl bg-[var(--color-brand-primary)] px-4 py-2.5 font-semibold text-white disabled:opacity-50"
          >
            {isPending ? "جارِ الحفظ..." : "حفظ التغييرات"}
          </button>
        </div>
      )}

      {error && isEditingStationId && (
        <p className="text-sm font-medium text-[var(--color-brand-primary)]">{error}</p>
      )}
    </div>
  );
}
