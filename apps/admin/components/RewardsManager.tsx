"use client";

import { useState, useTransition } from "react";
import { Plus, X, Pencil } from "lucide-react";
import { formatCurrency } from "@brin/utils";
import {
  createRewardAction,
  updateRewardAction,
  toggleRewardActiveAction,
  type RewardInput,
} from "@/app/(protected)/rewards/actions";
import { ImageUploadField } from "@/components/ImageUploadField";
import type { Reward } from "@/lib/types";

function RewardForm({
  title,
  initial,
  isPending,
  onSubmit,
  onCancel,
}: {
  title: string;
  initial: RewardInput;
  isPending: boolean;
  onSubmit: (input: RewardInput) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [pointsCost, setPointsCost] = useState(initial.pointsCost.toString());
  const [discountAmount, setDiscountAmount] = useState(initial.discountAmount.toString());
  const [imageUrl, setImageUrl] = useState(initial.imageUrl);

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
        placeholder="اسم المكافأة"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 outline-none focus:border-[var(--color-brand-primary)]"
      />
      <input
        type="text"
        placeholder="الوصف (اختياري)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 outline-none focus:border-[var(--color-brand-primary)]"
      />
      <label className="flex flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
        تكلفة النقاط
        <input
          type="number"
          inputMode="numeric"
          min="1"
          step="1"
          value={pointsCost}
          onChange={(e) => setPointsCost(e.target.value)}
          className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
        قيمة الخصم (ريال)
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={discountAmount}
          onChange={(e) => setDiscountAmount(e.target.value)}
          className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
        />
      </label>
      <ImageUploadField value={imageUrl} onChange={setImageUrl} folder="rewards" />
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          onSubmit({
            name,
            description,
            pointsCost: Number(pointsCost),
            discountAmount: Number(discountAmount),
            imageUrl,
          })
        }
        className="rounded-xl bg-[var(--color-brand-primary)] px-4 py-2.5 font-semibold text-white disabled:opacity-50"
      >
        {isPending ? "جارِ الحفظ..." : "حفظ"}
      </button>
    </div>
  );
}

export function RewardsManager({ rewards }: { rewards: Reward[] }) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate(input: RewardInput) {
    setError(null);
    startTransition(async () => {
      const result = await createRewardAction(input);
      if (result.error) {
        setError(result.error);
        return;
      }
      setIsCreating(false);
    });
  }

  function handleUpdate(rewardId: string, input: RewardInput) {
    setError(null);
    startTransition(async () => {
      const result = await updateRewardAction(rewardId, input);
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditingId(null);
    });
  }

  function handleToggle(rewardId: string, nextActive: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await toggleRewardActiveAction(rewardId, nextActive);
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
        {rewards.map((reward) =>
          editingId === reward.id ? (
            <RewardForm
              key={reward.id}
              title="تعديل المكافأة"
              isPending={isPending}
              initial={{
                name: reward.name,
                description: reward.description ?? "",
                pointsCost: reward.points_cost,
                discountAmount: reward.discount_amount,
                imageUrl: reward.image_url ?? "",
              }}
              onSubmit={(input) => handleUpdate(reward.id, input)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div
              key={reward.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--color-brand-card)] p-4 ring-1 ring-[var(--color-brand-border)]"
            >
              <div>
                <p className="font-semibold">{reward.name}</p>
                {reward.description && (
                  <p className="text-sm text-[var(--color-brand-muted)]">{reward.description}</p>
                )}
                <p className="mt-1 text-sm text-[var(--color-brand-muted)]">
                  {reward.points_cost} نقطة — خصم {formatCurrency(reward.discount_amount)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    reward.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-[var(--color-brand-background)] text-[var(--color-brand-muted)]"
                  }`}
                >
                  {reward.is_active ? "نشطة" : "معطّلة"}
                </span>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setEditingId(reward.id)}
                  className="flex items-center justify-center rounded-full bg-[var(--color-brand-background)] p-2 ring-1 ring-[var(--color-brand-border)] disabled:opacity-50"
                  aria-label="تعديل"
                >
                  <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleToggle(reward.id, !reward.is_active)}
                  className="rounded-full bg-[var(--color-brand-background)] px-3 py-1.5 text-xs font-medium ring-1 ring-[var(--color-brand-border)] disabled:opacity-50"
                >
                  {reward.is_active ? "تعطيل" : "تفعيل"}
                </button>
              </div>
            </div>
          ),
        )}
      </div>

      {isCreating ? (
        <RewardForm
          title="إضافة مكافأة"
          isPending={isPending}
          initial={{ name: "", description: "", pointsCost: 100, discountAmount: 0, imageUrl: "" }}
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
          إضافة مكافأة
        </button>
      )}
    </div>
  );
}
