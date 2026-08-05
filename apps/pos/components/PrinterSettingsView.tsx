"use client";

import { useEffect, useState } from "react";
import { Pencil, Usb } from "lucide-react";
import { useStationId, setStationId, useBranchId } from "@/lib/device";
import { linkStationBranchAction } from "@/app/(protected)/printer-settings/actions";

export function PrinterSettingsView() {
  const stationId = useStationId();
  const branchId = useBranchId();
  const [editingRequested, setEditingRequested] = useState(false);
  const isEditingStationId = editingRequested || !stationId;
  const [stationIdDraft, setStationIdDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  // يربط محطة الطباعة بفرع الجهاز تلقائياً كلما توفّر الاثنان معاً — عشان
  // مهام الطباعة غير المُسندة (طلبات إلكترونية) تنحصر بطابعات نفس الفرع.
  useEffect(() => {
    if (!stationId || !branchId) return;
    void linkStationBranchAction(stationId, branchId);
  }, [stationId, branchId]);

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

  return (
    <div className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-2xl bg-[var(--color-brand-card)] p-5 ring-1 ring-[var(--color-brand-border)]">
        <p className="text-sm font-semibold">معرّف هذا الجهاز</p>
        <p className="text-xs text-[var(--color-brand-muted)]">
          يجب أن يطابق تماماً STATION_ID المضبوط في ملف .env لعامل الطباعة المثبّت على هذا الجهاز فعلياً — يُخزَّن
          في متصفح هذا الجهاز فقط، بمعزل عن تسجيل دخول الموظف.
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
        <div className="flex flex-col gap-2 rounded-2xl bg-[var(--color-brand-card)] p-5 ring-1 ring-[var(--color-brand-border)]">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Usb className="h-4 w-4 text-[var(--color-brand-muted)]" strokeWidth={1.75} />
            الطابعة
          </p>
          <p className="text-xs text-[var(--color-brand-muted)]">
            وصّل طابعة الفواتير الحرارية بمنفذ USB بهذا الجهاز — عامل الطباعة يكتشفها ويطبع عليها تلقائياً بدون أي
            إعداد إضافي، خلال 15 ثانية من توصيلها. طابعة واحدة فقط تطبع فاتورة المطبخ ثم فاتورة العميل تباعاً، كل
            واحدة تُقص لوحدها.
          </p>
        </div>
      )}

      {error && isEditingStationId && (
        <p className="text-sm font-medium text-[var(--color-brand-primary)]">{error}</p>
      )}
    </div>
  );
}
