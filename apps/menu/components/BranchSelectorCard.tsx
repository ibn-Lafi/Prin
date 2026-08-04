"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Navigation, Package, Store } from "lucide-react";
import type { Branch } from "@/lib/types";
import { useBranch } from "@/hooks/useBranch";
import { useUserLocation } from "@/hooks/useUserLocation";
import { distanceKm } from "@/lib/geo";
import { BranchPickerSheet } from "@/components/BranchPickerSheet";

// بطاقة الفرع المختار — تظهر بأعلى الصفحة الرئيسية، وبالضغط عليها تفتح
// صفحة اختيار الفرع الكاملة (BranchPickerSheet).
export function BranchSelectorCard({ branches }: { branches: Branch[] }) {
  const { selectedBranchId } = useBranch();
  const { location } = useUserLocation();
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const selectedBranch = branches.find((b) => b.id === selectedBranchId) ?? null;

  const nearestId = useMemo(() => {
    if (!location) return null;
    let best: { id: string; km: number } | null = null;
    for (const branch of branches) {
      if (branch.latitude == null || branch.longitude == null) continue;
      const km = distanceKm(location, { latitude: branch.latitude, longitude: branch.longitude });
      if (!best || km < best.km) best = { id: branch.id, km };
    }
    return best?.id ?? null;
  }, [branches, location]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsPickerOpen(true)}
        className="flex w-full items-center gap-2 rounded-2xl bg-[var(--color-brand-card)] p-2.5 shadow-sm shadow-black/5 ring-1 ring-black/5"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary-light)]">
          <Store className="h-5 w-5 text-[var(--color-brand-primary)]" strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1 text-right">
          <span className="block text-xs text-[var(--color-brand-muted)]">
            {selectedBranch ? "الفرع المحدد" : "اختر فرع الاستلام"}
          </span>
          <span className="block truncate font-bold text-[var(--color-brand-text)]">
            {selectedBranch ? selectedBranch.name : "اضغط لاختيار فرع"}
          </span>
        </span>
        {selectedBranch && selectedBranch.id === nearestId && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
            <Navigation className="h-3 w-3" strokeWidth={2} />
            الأقرب
          </span>
        )}
        {selectedBranch && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--color-brand-primary-light)] px-2 py-1 text-xs font-semibold text-[var(--color-brand-primary)]">
            <Package className="h-3 w-3" strokeWidth={2} />
            استلام
          </span>
        )}
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-background)]">
          <ChevronDown className="h-4 w-4 text-[var(--color-brand-text)]" strokeWidth={2} />
        </span>
      </button>

      {isPickerOpen && <BranchPickerSheet branches={branches} onClose={() => setIsPickerOpen(false)} />}
    </>
  );
}
