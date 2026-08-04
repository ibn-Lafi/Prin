"use client";

import { useState, useTransition } from "react";
import { setCartSuggestionsAction } from "@/app/(protected)/products/actions";

export function CartSuggestionsManager({
  productId,
  allProducts,
  initialSelectedIds,
}: {
  productId: string;
  allProducts: { id: string; name: string }[];
  initialSelectedIds: string[];
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggle(id: string) {
    setSaved(false);
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function handleSave() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await setCartSuggestionsAction(productId, selectedIds);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <div className="flex max-w-md flex-col gap-3 rounded-2xl bg-[var(--color-brand-card)] p-5 ring-1 ring-[var(--color-brand-border)]">
      <div>
        <h3 className="font-semibold">اقتراحات إضافة سريعة بالسلة</h3>
        <p className="text-xs text-[var(--color-brand-muted)]">
          الأصناف المحددة تظهر تلقائياً للعميل بصفحة السلة عند إضافة هذا الصنف — مثلاً: مشروب أو صوص مع البرجر
        </p>
      </div>

      {allProducts.length === 0 ? (
        <p className="text-sm text-[var(--color-brand-muted)]">لا توجد أصناف أخرى بعد.</p>
      ) : (
        <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
          {allProducts.map((product) => (
            <label
              key={product.id}
              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-[var(--color-brand-background)]"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(product.id)}
                onChange={() => toggle(product.id)}
                className="h-4 w-4 rounded border-[var(--color-brand-border)] accent-[var(--color-brand-primary)]"
              />
              {product.name}
            </label>
          ))}
        </div>
      )}

      {error && <p className="text-sm font-medium text-[var(--color-brand-primary)]">{error}</p>}
      {saved && !error && <p className="text-sm font-medium text-green-700">تم الحفظ</p>}

      <button
        type="button"
        disabled={isPending}
        onClick={handleSave}
        className="self-start rounded-xl bg-[var(--color-brand-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isPending ? "جارِ الحفظ..." : "حفظ الاقتراحات"}
      </button>
    </div>
  );
}
