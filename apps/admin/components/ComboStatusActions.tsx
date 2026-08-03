"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  toggleComboAvailabilityAction,
  setComboDeletedAction,
  deleteComboAction,
} from "@/app/(protected)/combos/actions";

export function ComboStatusActions({
  comboId,
  isAvailable,
  isDeleted,
}: {
  comboId: string;
  isAvailable: boolean;
  isDeleted: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggleAvailability() {
    setError(null);
    startTransition(async () => {
      const result = await toggleComboAvailabilityAction(comboId, !isAvailable);
      if (result.error) setError(result.error);
    });
  }

  function handleToggleDeleted() {
    setError(null);
    startTransition(async () => {
      const result = await setComboDeletedAction(comboId, !isDeleted);
      if (result.error) setError(result.error);
    });
  }

  function handleDeletePermanently() {
    setError(null);
    if (!window.confirm("حذف نهائي لا يمكن التراجع عنه. هل أنت متأكد؟")) return;
    startTransition(async () => {
      const result = await deleteComboAction(comboId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/combos");
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
        {isAvailable ? "تعيين كنفدت" : "تعيين كمتوفرة"}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={handleToggleDeleted}
        className="rounded-xl bg-[var(--color-brand-primary-light)] px-4 py-2.5 text-sm font-medium text-[var(--color-brand-primary)] disabled:opacity-50"
      >
        {isDeleted ? "استرجاع الوجبة إلى القائمة" : "حذف الوجبة من القائمة"}
      </button>
      {error && <p className="text-sm font-medium text-[var(--color-brand-primary)]">{error}</p>}
      <hr className="border-[var(--color-brand-border)]" />
      <button
        type="button"
        disabled={isPending}
        onClick={handleDeletePermanently}
        className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        حذف الوجبة نهائياً
      </button>
      <p className="text-xs text-[var(--color-brand-muted)]">
        يحذف الوجبة من قاعدة البيانات نهائياً — يفشل إذا كانت الوجبة مستخدمة بطلبات سابقة، استخدم
        &quot;حذف الوجبة من القائمة&quot; أعلاه بدلاً من هذا في هذه الحالة.
      </p>
    </div>
  );
}
