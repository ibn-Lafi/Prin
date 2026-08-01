"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProductAction, updateProductAction } from "@/app/(protected)/products/actions";
import { ImageUploadField } from "@/components/ImageUploadField";
import type { Product } from "@/lib/types";

export function ProductForm({
  categories,
  product,
}: {
  categories: { id: string; name: string }[];
  product?: Product;
}) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState(product?.category_id ?? categories[0]?.id ?? "");
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [calories, setCalories] = useState(product?.calories?.toString() ?? "");
  const [price, setPrice] = useState(product?.price?.toString() ?? "");
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    setSaved(false);

    const input = {
      categoryId,
      name,
      description,
      calories: calories.trim() === "" ? null : Number(calories),
      price: Number(price),
      imageUrl,
    };

    startTransition(async () => {
      if (product) {
        const result = await updateProductAction(product.id, input);
        if (result.error) {
          setError(result.error);
          return;
        }
        setSaved(true);
      } else {
        const result = await createProductAction(input);
        if (result.error) {
          setError(result.error);
          return;
        }
        router.push(`/products/${result.id}`);
      }
    });
  }

  return (
    <div className="flex max-w-md flex-col gap-4 rounded-2xl bg-[var(--color-brand-card)] p-5 ring-1 ring-[var(--color-brand-border)]">
      <label className="flex flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
        الفئة
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
        اسم الصنف
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

      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
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
        <label className="flex flex-1 flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
          السعرات الحرارية
          <input
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
          />
        </label>
      </div>

      <ImageUploadField value={imageUrl} onChange={setImageUrl} folder="products" />

      {error && <p className="text-sm font-medium text-[var(--color-brand-primary)]">{error}</p>}
      {saved && !error && <p className="text-sm font-medium text-green-700">تم الحفظ</p>}

      <button
        type="button"
        disabled={isPending}
        onClick={handleSubmit}
        className="rounded-xl bg-[var(--color-brand-primary)] px-4 py-2.5 font-semibold text-white disabled:opacity-50"
      >
        {isPending ? "جارِ الحفظ..." : product ? "حفظ التغييرات" : "إنشاء الصنف"}
      </button>
    </div>
  );
}
