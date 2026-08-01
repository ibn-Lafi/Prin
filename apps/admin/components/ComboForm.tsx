"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { createComboAction, updateComboAction, type ComboItemInput } from "@/app/(protected)/combos/actions";
import type { ComboWithItems } from "@/lib/types";

export function ComboForm({
  products,
  combo,
}: {
  products: { id: string; name: string }[];
  combo?: ComboWithItems;
}) {
  const router = useRouter();
  const [name, setName] = useState(combo?.name ?? "");
  const [description, setDescription] = useState(combo?.description ?? "");
  const [price, setPrice] = useState(combo?.price?.toString() ?? "");
  const [imageUrl, setImageUrl] = useState(combo?.image_url ?? "");
  const [items, setItems] = useState<ComboItemInput[]>(
    combo?.combo_items.map((item) => ({ productId: item.product_id, quantity: item.quantity })) ?? [
      { productId: products[0]?.id ?? "", quantity: 1 },
    ],
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function updateItem(index: number, patch: Partial<ComboItemInput>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, { productId: products[0]?.id ?? "", quantity: 1 }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    setError(null);
    setSaved(false);

    const input = { name, description, price: Number(price), imageUrl, items };

    startTransition(async () => {
      if (combo) {
        const result = await updateComboAction(combo.id, input);
        if (result.error) {
          setError(result.error);
          return;
        }
        setSaved(true);
      } else {
        const result = await createComboAction(input);
        if (result.error) {
          setError(result.error);
          return;
        }
        router.push(`/combos/${result.id}`);
      }
    });
  }

  return (
    <div className="flex max-w-md flex-col gap-4 rounded-2xl bg-[var(--color-brand-card)] p-5 ring-1 ring-[var(--color-brand-border)]">
      <label className="flex flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
        اسم الوجبة
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
        الوصف (اختياري)
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
        السعر (ريال)
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
        رابط الصورة (اختياري)
        <input
          type="text"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://..."
          className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
        />
      </label>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-[var(--color-brand-muted)]">الأصناف الداخلة بالوجبة</p>
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <select
              value={item.productId}
              onChange={(e) => updateItem(index, { productId: e.target.value })}
              className="flex-1 rounded-xl border border-[var(--color-brand-border)] px-3 py-2 text-sm text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              step="1"
              value={item.quantity}
              onChange={(e) => updateItem(index, { quantity: Number(e.target.value) || 1 })}
              className="w-16 rounded-xl border border-[var(--color-brand-border)] px-2 py-2 text-sm text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
            />
            <button
              type="button"
              onClick={() => removeItem(index)}
              disabled={items.length === 1}
              aria-label="إزالة"
              className="disabled:opacity-30"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="flex w-fit items-center gap-1.5 rounded-full bg-[var(--color-brand-background)] px-3 py-1.5 text-xs font-medium ring-1 ring-[var(--color-brand-border)]"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          إضافة صنف
        </button>
      </div>

      {error && <p className="text-sm font-medium text-[var(--color-brand-primary)]">{error}</p>}
      {saved && !error && <p className="text-sm font-medium text-green-700">تم الحفظ</p>}

      <button
        type="button"
        disabled={isPending}
        onClick={handleSubmit}
        className="rounded-xl bg-[var(--color-brand-primary)] px-4 py-2.5 font-semibold text-white disabled:opacity-50"
      >
        {isPending ? "جارِ الحفظ..." : combo ? "حفظ التغييرات" : "إنشاء الوجبة"}
      </button>
    </div>
  );
}
