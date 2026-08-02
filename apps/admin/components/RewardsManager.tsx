"use client";

import { useState, useTransition } from "react";
import { Plus, X, Pencil, UtensilsCrossed } from "lucide-react";
import { formatCurrency } from "@brin/utils";
import {
  createRewardAction,
  updateRewardAction,
  toggleRewardActiveAction,
  type RewardInput,
} from "@/app/(protected)/rewards/actions";
import { ImageUploadField } from "@/components/ImageUploadField";
import type { Reward, RewardLinkOption } from "@/lib/types";

function linkKey(kind: "product" | "combo", id: string): string {
  return `${kind}:${id}`;
}

function findLinkOption(linkOptions: RewardLinkOption[], productId: string | null, comboId: string | null) {
  if (productId) return linkOptions.find((o) => o.kind === "product" && o.id === productId);
  if (comboId) return linkOptions.find((o) => o.kind === "combo" && o.id === comboId);
  return undefined;
}

function RewardForm({
  title,
  initial,
  linkOptions,
  isPending,
  onSubmit,
  onCancel,
}: {
  title: string;
  initial: RewardInput;
  linkOptions: RewardLinkOption[];
  isPending: boolean;
  onSubmit: (input: RewardInput) => void;
  onCancel: () => void;
}) {
  const [linkValue, setLinkValue] = useState(
    initial.productId
      ? linkKey("product", initial.productId)
      : initial.comboId
        ? linkKey("combo", initial.comboId)
        : "",
  );
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [pointsCost, setPointsCost] = useState(initial.pointsCost.toString());
  const [discountAmount, setDiscountAmount] = useState(initial.discountAmount.toString());
  const [imageUrl, setImageUrl] = useState(initial.imageUrl);

  const isLinked = linkValue !== "";
  const selected = linkOptions.find((o) => linkKey(o.kind, o.id) === linkValue);
  const products = linkOptions.filter((o) => o.kind === "product");
  const combos = linkOptions.filter((o) => o.kind === "combo");

  function handleSubmit() {
    onSubmit({
      name: isLinked ? (selected?.name ?? "") : name,
      description: isLinked ? "" : description,
      pointsCost: Number(pointsCost),
      discountAmount: isLinked ? 0 : Number(discountAmount),
      imageUrl: isLinked ? "" : imageUrl,
      productId: isLinked && selected?.kind === "product" ? selected.id : null,
      comboId: isLinked && selected?.kind === "combo" ? selected.id : null,
    });
  }

  return (
    <div className="flex max-w-sm flex-col gap-3 rounded-2xl bg-[var(--color-brand-card)] p-4 ring-1 ring-[var(--color-brand-border)]">
      <div className="flex items-center justify-between">
        <p className="font-semibold">{title}</p>
        <button type="button" onClick={onCancel} aria-label="إغلاق">
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      <label className="flex flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
        نوع المكافأة
        <select
          value={linkValue}
          onChange={(e) => setLinkValue(e.target.value)}
          className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
        >
          <option value="">خصم نقدي عام (يدوي)</option>
          {products.length > 0 && (
            <optgroup label="أصناف">
              {products.map((o) => (
                <option key={linkKey(o.kind, o.id)} value={linkKey(o.kind, o.id)}>
                  {o.name} — {formatCurrency(o.price)}
                </option>
              ))}
            </optgroup>
          )}
          {combos.length > 0 && (
            <optgroup label="وجبات">
              {combos.map((o) => (
                <option key={linkKey(o.kind, o.id)} value={linkKey(o.kind, o.id)}>
                  {o.name} — {formatCurrency(o.price)}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </label>

      {isLinked ? (
        <p className="rounded-xl bg-[var(--color-brand-background)] px-3 py-2.5 text-xs text-[var(--color-brand-muted)]">
          الخصم عند الاستبدال = سعر الصنف الحالي ({selected ? formatCurrency(selected.price) : "—"}) — يتحدّث
          تلقائياً لو تغيّر سعر الصنف بعدين، والاسم والصورة تُسحب منه مباشرة.
        </p>
      ) : (
        <>
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
        </>
      )}

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

      <button
        type="button"
        disabled={isPending}
        onClick={handleSubmit}
        className="rounded-xl bg-[var(--color-brand-primary)] px-4 py-2.5 font-semibold text-white disabled:opacity-50"
      >
        {isPending ? "جارِ الحفظ..." : "حفظ"}
      </button>
    </div>
  );
}

export function RewardsManager({
  rewards,
  linkOptions,
}: {
  rewards: Reward[];
  linkOptions: RewardLinkOption[];
}) {
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
        {rewards.map((reward) => {
          const linked = findLinkOption(linkOptions, reward.product_id, reward.combo_id);
          const displayName = linked?.name ?? reward.name ?? "—";
          const displayDiscount = linked?.price ?? reward.discount_amount;
          const displayImage = linked?.imageUrl ?? reward.image_url;
          const isBrokenLink = (reward.product_id || reward.combo_id) && !linked;

          return editingId === reward.id ? (
            <RewardForm
              key={reward.id}
              title="تعديل المكافأة"
              linkOptions={linkOptions}
              isPending={isPending}
              initial={{
                name: reward.name ?? "",
                description: reward.description ?? "",
                pointsCost: reward.points_cost,
                discountAmount: reward.discount_amount,
                imageUrl: reward.image_url ?? "",
                productId: reward.product_id,
                comboId: reward.combo_id,
              }}
              onSubmit={(input) => handleUpdate(reward.id, input)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div
              key={reward.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--color-brand-card)] p-4 ring-1 ring-[var(--color-brand-border)]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--color-brand-primary-light)]">
                  {displayImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={displayImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <UtensilsCrossed className="h-5 w-5 text-[var(--color-brand-primary)]/40" strokeWidth={1.5} />
                  )}
                </div>
                <div>
                  <p className="font-semibold">
                    {isBrokenLink ? "صنف/وجبة محذوفة" : displayName}
                    {linked && (
                      <span className="mr-2 rounded-full bg-[var(--color-brand-background)] px-2 py-0.5 text-xs font-normal text-[var(--color-brand-muted)]">
                        {linked.kind === "product" ? "صنف" : "وجبة"}
                      </span>
                    )}
                  </p>
                  {reward.description && !linked && (
                    <p className="text-sm text-[var(--color-brand-muted)]">{reward.description}</p>
                  )}
                  <p className="mt-1 text-sm text-[var(--color-brand-muted)]">
                    {reward.points_cost} نقطة — خصم {formatCurrency(displayDiscount)}
                  </p>
                </div>
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
          );
        })}
      </div>

      {isCreating ? (
        <RewardForm
          title="إضافة مكافأة"
          linkOptions={linkOptions}
          isPending={isPending}
          initial={{
            name: "",
            description: "",
            pointsCost: 100,
            discountAmount: 0,
            imageUrl: "",
            productId: null,
            comboId: null,
          }}
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
