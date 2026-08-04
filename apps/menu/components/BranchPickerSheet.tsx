"use client";

import { useMemo, useState } from "react";
import { MapPin, Navigation, Search, Store, X } from "lucide-react";
import { isRestaurantOpen } from "@brin/utils";
import type { Branch } from "@/lib/types";
import { useBranch } from "@/hooks/useBranch";
import { useUserLocation } from "@/hooks/useUserLocation";
import { distanceKm } from "@/lib/geo";

type BranchWithDistance = Branch & { distanceKm: number | null };

function BranchRow({
  branch,
  isSelected,
  isNearest,
  disabled,
  onSelect,
}: {
  branch: BranchWithDistance;
  isSelected: boolean;
  isNearest: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-right transition-colors disabled:opacity-50 ${
        isSelected
          ? "border-[var(--color-brand-primary)] bg-[var(--color-brand-primary-light)]"
          : "border-[var(--color-brand-border)] bg-[var(--color-brand-card)]"
      }`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
          isSelected ? "bg-[var(--color-brand-primary)]" : "bg-[var(--color-brand-background)]"
        }`}
      >
        <Store className={`h-5 w-5 ${isSelected ? "text-white" : "text-[var(--color-brand-muted)]"}`} strokeWidth={1.75} />
      </span>
      <span className="min-w-0 flex-1">
        {isNearest && (
          <span className="mb-0.5 flex items-center gap-1 text-xs font-semibold text-green-700">
            <Navigation className="h-3 w-3" strokeWidth={2} />
            الأقرب إليك
          </span>
        )}
        <span
          className={`block truncate font-bold ${
            isSelected ? "text-[var(--color-brand-primary)]" : "text-[var(--color-brand-text)]"
          }`}
        >
          {branch.name}
        </span>
        {branch.address && (
          <span className="block truncate text-xs text-[var(--color-brand-muted)]">{branch.address}</span>
        )}
      </span>
      {branch.distanceKm != null && (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--color-brand-background)] px-2.5 py-1 text-xs font-medium text-[var(--color-brand-muted)]">
          <MapPin className="h-3 w-3" strokeWidth={1.75} />
          {branch.distanceKm < 1
            ? `${Math.round(branch.distanceKm * 1000)} م`
            : `${branch.distanceKm.toFixed(1)} كم`}
        </span>
      )}
    </button>
  );
}

export function BranchPickerSheet({ branches, onClose }: { branches: Branch[]; onClose: () => void }) {
  const { selectedBranchId, selectBranch } = useBranch();
  const { location } = useUserLocation();
  const [query, setQuery] = useState("");

  const withDistance: BranchWithDistance[] = useMemo(
    () =>
      branches.map((branch) => ({
        ...branch,
        distanceKm:
          location && branch.latitude != null && branch.longitude != null
            ? distanceKm(location, { latitude: branch.latitude, longitude: branch.longitude })
            : null,
      })),
    [branches, location],
  );

  const nearestId = useMemo(() => {
    const withKnownDistance = withDistance.filter((b) => b.distanceKm != null);
    if (withKnownDistance.length === 0) return null;
    return withKnownDistance.reduce((closest, b) => (b.distanceKm! < closest.distanceKm! ? b : closest))
      .id;
  }, [withDistance]);

  const q = query.trim().toLowerCase();
  const filtered = withDistance.filter(
    (b) => !q || b.name.toLowerCase().includes(q) || (b.address ?? "").toLowerCase().includes(q),
  );

  function sortByDistance(list: BranchWithDistance[]): BranchWithDistance[] {
    return [...list].sort((a, b) => {
      if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm;
      if (a.distanceKm != null) return -1;
      if (b.distanceKm != null) return 1;
      return 0;
    });
  }

  const openBranches = sortByDistance(
    filtered.filter((b) => isRestaurantOpen(b.opening_time, b.closing_time, b.is_accepting_orders)),
  );
  const closedBranches = sortByDistance(
    filtered.filter((b) => !isRestaurantOpen(b.opening_time, b.closing_time, b.is_accepting_orders)),
  );

  function handleSelect(branchId: string) {
    selectBranch(branchId);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-[var(--color-brand-background)] sm:rounded-3xl">
        <div className="relative flex shrink-0 items-center justify-center border-b border-[var(--color-brand-border)] bg-[var(--color-brand-card)] p-4">
          <h2 className="font-bold">اختر الفرع</h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute left-4 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand-background)]"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <div className="shrink-0 bg-[var(--color-brand-card)] p-4 pt-3">
          <label className="flex items-center gap-2.5 rounded-full bg-[var(--color-brand-background)] px-4 py-3 ring-1 ring-[var(--color-brand-border)]">
            <Search className="h-4 w-4 shrink-0 text-[var(--color-brand-muted)]" strokeWidth={2} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن فرع، حي..."
              className="w-full bg-transparent text-sm text-[var(--color-brand-text)] outline-none placeholder:text-[var(--color-brand-muted)]"
            />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {openBranches.length > 0 && (
            <div className="mb-5 flex flex-col gap-2.5">
              <p className="flex items-center gap-2 text-sm font-bold text-green-700">
                <span className="h-3.5 w-1 rounded-full bg-green-600" />
                الفروع المفتوحة
              </p>
              {openBranches.map((branch) => (
                <BranchRow
                  key={branch.id}
                  branch={branch}
                  isSelected={branch.id === selectedBranchId}
                  isNearest={branch.id === nearestId}
                  onSelect={() => handleSelect(branch.id)}
                />
              ))}
            </div>
          )}

          {closedBranches.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <p className="flex items-center gap-2 text-sm font-bold text-[var(--color-brand-muted)]">
                <span className="h-3.5 w-1 rounded-full bg-[var(--color-brand-border)]" />
                الفروع المغلقة حالياً
              </p>
              {closedBranches.map((branch) => (
                <BranchRow
                  key={branch.id}
                  branch={branch}
                  isSelected={false}
                  isNearest={false}
                  disabled
                  onSelect={() => {}}
                />
              ))}
            </div>
          )}

          {openBranches.length === 0 && closedBranches.length === 0 && (
            <p className="py-10 text-center text-sm text-[var(--color-brand-muted)]">لا توجد فروع مطابقة</p>
          )}
        </div>
      </div>
    </div>
  );
}
