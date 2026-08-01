"use client";

import { useState, useTransition } from "react";
import { Plus, X, Pencil } from "lucide-react";
import {
  createCategoryAction,
  updateCategoryAction,
  toggleCategoryActiveAction,
} from "@/app/(protected)/categories/actions";
import type { Category } from "@/lib/types";

function CategoryForm({
  title,
  initialName,
  initialOrder,
  isPending,
  onSubmit,
  onCancel,
}: {
  title: string;
  initialName: string;
  initialOrder: number;
  isPending: boolean;
  onSubmit: (name: string, displayOrder: number) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [displayOrder, setDisplayOrder] = useState(initialOrder.toString());

  return (
    <div className="flex max-w-sm flex-col gap-3 rounded-2xl bg-[var(--color-brand-card)] p-4 ring-1 ring-[var(--color-brand-border)]">
      <div className="flex items-center justify-between">
        <p className="font-semibold">{title}</p>
        <button type="button" onClick={onCancel} aria-label="إغلاق">
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
      <input
        type="text"
        placeholder="اسم الفئة"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 outline-none focus:border-[var(--color-brand-primary)]"
      />
      <label className="flex flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
        ترتيب العرض
        <input
          type="number"
          inputMode="numeric"
          step="1"
          value={displayOrder}
          onChange={(e) => setDisplayOrder(e.target.value)}
          className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
        />
      </label>
      <button
        type="button"
        disabled={isPending}
        onClick={() => onSubmit(name, Number(displayOrder) || 0)}
        className="rounded-xl bg-[var(--color-brand-primary)] px-4 py-2.5 font-semibold text-white disabled:opacity-50"
      >
        {isPending ? "جارِ الحفظ..." : "حفظ"}
      </button>
    </div>
  );
}

export function CategoriesManager({ categories }: { categories: Category[] }) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate(name: string, displayOrder: number) {
    setError(null);
    startTransition(async () => {
      const result = await createCategoryAction({ name, displayOrder });
      if (result.error) {
        setError(result.error);
        return;
      }
      setIsCreating(false);
    });
  }

  function handleUpdate(categoryId: string, name: string, displayOrder: number) {
    setError(null);
    startTransition(async () => {
      const result = await updateCategoryAction(categoryId, { name, displayOrder });
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditingId(null);
    });
  }

  function handleToggle(categoryId: string, nextActive: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await toggleCategoryActiveAction(categoryId, nextActive);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-xl bg-[var(--color-brand-primary-light)] px-4 py-2 text-sm font-medium text-[var(--color-brand-primary)]">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {categories.map((category) =>
          editingId === category.id ? (
            <CategoryForm
              key={category.id}
              title="تعديل الفئة"
              initialName={category.name}
              initialOrder={category.display_order}
              isPending={isPending}
              onSubmit={(name, order) => handleUpdate(category.id, name, order)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div
              key={category.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--color-brand-card)] p-4 ring-1 ring-[var(--color-brand-border)]"
            >
              <div>
                <p className="font-semibold">{category.name}</p>
                <p className="text-sm text-[var(--color-brand-muted)]">ترتيب: {category.display_order}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    category.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-[var(--color-brand-background)] text-[var(--color-brand-muted)]"
                  }`}
                >
                  {category.is_active ? "نشطة" : "معطّلة"}
                </span>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setEditingId(category.id)}
                  className="flex items-center justify-center rounded-full bg-[var(--color-brand-background)] p-2 ring-1 ring-[var(--color-brand-border)] disabled:opacity-50"
                  aria-label="تعديل"
                >
                  <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleToggle(category.id, !category.is_active)}
                  className="rounded-full bg-[var(--color-brand-background)] px-3 py-1.5 text-xs font-medium ring-1 ring-[var(--color-brand-border)] disabled:opacity-50"
                >
                  {category.is_active ? "تعطيل" : "تفعيل"}
                </button>
              </div>
            </div>
          ),
        )}
      </div>

      {isCreating ? (
        <CategoryForm
          title="إضافة فئة"
          initialName=""
          initialOrder={categories.length}
          isPending={isPending}
          onSubmit={handleCreate}
          onCancel={() => setIsCreating(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="flex w-fit items-center gap-1.5 rounded-full bg-[var(--color-brand-primary)] px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          إضافة فئة
        </button>
      )}
    </div>
  );
}
