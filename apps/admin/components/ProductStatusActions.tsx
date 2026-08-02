"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  toggleProductAvailabilityAction,
  setProductDeletedAction,
  deleteProductAction,
} from "@/app/(protected)/products/actions";

export function ProductStatusActions({
  productId,
  isAvailable,
  isDeleted,
}: {
  productId: string;
  isAvailable: boolean;
  isDeleted: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggleAvailability() {
    setError(null);
    startTransition(async () => {
      const result = await toggleProductAvailabilityAction(productId, !isAvailable);
      if (result.error) setError(result.error);
    });
  }

  function handleToggleDeleted() {
    setError(null);
    startTransition(async () => {
      const result = await setProductDeletedAction(productId, !isDeleted);
      if (result.error) setError(result.error);
    });
  }

  function handleDeletePermanently() {
    setError(null);
    if (!window.confirm("حذف نهائي لا يمكن التراجع عنه. متأكد؟")) return;
    startTransition(async () => {
      const result = await deleteProductAction(productId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/products");
    });
  }

  return (
    <div className="flex h-fit flex-col gap-3 rounded-2xl bg-[var(--color-brand-card)] p-5 ring-1 ring-[var(--color-brand-border)]">
      <p className="font-semibold">الحالة</p>
      <button
        type="button"
        disabled={isPending || isDeleted}
        onClick={handleToggleAvailability}
        className="rounded-xl bg-[var(--color-brand-background)] px-4 py-2.5 text-sm font-medium ring-1 ring-[var(--color-brand-border)] disabled:opacity-50"
      >
        {isAvailable ? "تعيين كنفد المخزون" : "تعيين كمتوفر"}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={handleToggleDeleted}
        className="rounded-xl bg-[var(--color-brand-primary-light)] px-4 py-2.5 text-sm font-medium text-[var(--color-brand-primary)] disabled:opacity-50"
      >
        {isDeleted ? "استرجاع الصنف للمنيو" : "حذف الصنف من المنيو"}
      </button>
      {error && <p className="text-sm font-medium text-[var(--color-brand-primary)]">{error}</p>}
      <hr className="border-[var(--color-brand-border)]" />
      <button
        type="button"
        disabled={isPending}
        onClick={handleDeletePermanently}
        className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        حذف الصنف نهائياً
      </button>
      <p className="text-xs text-[var(--color-brand-muted)]">
        يحذف الصنف من قاعدة البيانات نهائياً — يفشل لو الصنف مستخدم بطلبات سابقة أو ضمن وجبة، استخدم
        &quot;حذف الصنف من المنيو&quot; أعلاه بدل هذا في هذي الحالة.
      </p>
    </div>
  );
}
