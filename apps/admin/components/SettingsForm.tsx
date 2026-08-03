"use client";

import { useState, useTransition } from "react";
import { updateSettingsAction } from "@/app/(protected)/settings/actions";
import type { RestaurantSettings } from "@/lib/types";

export function SettingsForm({ settings }: { settings: RestaurantSettings }) {
  const [restaurantName, setRestaurantName] = useState(settings.restaurant_name);
  const [vatNumber, setVatNumber] = useState(settings.vat_number ?? "");
  const [taxRatePercent, setTaxRatePercent] = useState(settings.tax_rate_percent.toString());
  const [openingTime, setOpeningTime] = useState(settings.opening_time.slice(0, 5));
  const [closingTime, setClosingTime] = useState(settings.closing_time.slice(0, 5));
  const [isAcceptingOrders, setIsAcceptingOrders] = useState(settings.is_accepting_orders);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateSettingsAction({
        restaurantName,
        vatNumber,
        taxRatePercent: Number(taxRatePercent),
        openingTime,
        closingTime,
        isAcceptingOrders,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <div className="flex max-w-md flex-col gap-4 rounded-2xl bg-[var(--color-brand-card)] p-5 ring-1 ring-[var(--color-brand-border)]">
      <label className="flex flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
        اسم المطعم
        <input
          type="text"
          value={restaurantName}
          onChange={(e) => setRestaurantName(e.target.value)}
          className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
        الرقم الضريبي (VAT)
        <input
          type="text"
          value={vatNumber}
          onChange={(e) => setVatNumber(e.target.value)}
          placeholder="3xxxxxxxxxxxxx03"
          className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
        نسبة الضريبة (%)
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={taxRatePercent}
          onChange={(e) => setTaxRatePercent(e.target.value)}
          className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
        />
      </label>

      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
          وقت الفتح
          <input
            type="time"
            value={openingTime}
            onChange={(e) => setOpeningTime(e.target.value)}
            className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
          وقت الإغلاق
          <input
            type="time"
            value={closingTime}
            onChange={(e) => setClosingTime(e.target.value)}
            className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
          />
        </label>
      </div>

      <label className="flex items-center justify-between rounded-xl bg-[var(--color-brand-background)] px-3 py-2.5">
        <span className="text-sm font-medium">استقبال طلبات القائمة الإلكترونية</span>
        <input
          type="checkbox"
          checked={isAcceptingOrders}
          onChange={(e) => setIsAcceptingOrders(e.target.checked)}
          className="h-5 w-5 accent-[var(--color-brand-primary)]"
        />
      </label>

      {error && <p className="text-sm font-medium text-[var(--color-brand-primary)]">{error}</p>}
      {saved && !error && <p className="text-sm font-medium text-green-700">تم الحفظ</p>}

      <button
        type="button"
        disabled={isPending}
        onClick={handleSubmit}
        className="rounded-xl bg-[var(--color-brand-primary)] px-4 py-2.5 font-semibold text-white disabled:opacity-50"
      >
        {isPending ? "جارِ الحفظ..." : "حفظ التغييرات"}
      </button>
    </div>
  );
}
