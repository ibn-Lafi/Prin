"use client";

import { useState, useTransition } from "react";
import { Plus, X, Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from "@brin/utils";
import {
  createComboModifierGroupAction,
  updateComboModifierGroupAction,
  deleteComboModifierGroupAction,
  createComboModifierAction,
  updateComboModifierAction,
  toggleComboModifierAvailabilityAction,
  deleteComboModifierAction,
  type ModifierGroupInput,
  type ModifierInput,
} from "@/app/(protected)/combos/actions";
import type { ModifierGroup, Modifier } from "@/lib/types";

function GroupForm({
  title,
  initial,
  isPending,
  onSubmit,
  onCancel,
}: {
  title: string;
  initial: ModifierGroupInput;
  isPending: boolean;
  onSubmit: (input: ModifierGroupInput) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [isRequired, setIsRequired] = useState(initial.isRequired);
  const [minSelect, setMinSelect] = useState(initial.minSelect.toString());
  const [maxSelect, setMaxSelect] = useState(initial.maxSelect.toString());
  const [displayOrder, setDisplayOrder] = useState(initial.displayOrder.toString());

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-[var(--color-brand-background)] p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{title}</p>
        <button type="button" onClick={onCancel} aria-label="إغلاق">
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
      <input
        type="text"
        placeholder="اسم المجموعة (مثال: حجم الوجبة)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-lg border border-[var(--color-brand-border)] bg-[var(--color-brand-card)] px-3 py-2 text-sm outline-none focus:border-[var(--color-brand-primary)]"
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isRequired}
          onChange={(e) => setIsRequired(e.target.checked)}
          className="h-4 w-4 accent-[var(--color-brand-primary)]"
        />
        اختيار إجباري
      </label>
      <div className="flex gap-2">
        <label className="flex flex-1 flex-col gap-1 text-xs text-[var(--color-brand-muted)]">
          حد أدنى
          <input
            type="number"
            min="0"
            step="1"
            value={minSelect}
            onChange={(e) => setMinSelect(e.target.value)}
            className="rounded-lg border border-[var(--color-brand-border)] bg-[var(--color-brand-card)] px-3 py-2 text-sm text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-xs text-[var(--color-brand-muted)]">
          حد أقصى
          <input
            type="number"
            min="1"
            step="1"
            value={maxSelect}
            onChange={(e) => setMaxSelect(e.target.value)}
            className="rounded-lg border border-[var(--color-brand-border)] bg-[var(--color-brand-card)] px-3 py-2 text-sm text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-xs text-[var(--color-brand-muted)]">
          الترتيب
          <input
            type="number"
            step="1"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(e.target.value)}
            className="rounded-lg border border-[var(--color-brand-border)] bg-[var(--color-brand-card)] px-3 py-2 text-sm text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
          />
        </label>
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          onSubmit({
            name,
            isRequired,
            minSelect: Number(minSelect) || 0,
            maxSelect: Number(maxSelect) || 1,
            displayOrder: Number(displayOrder) || 0,
          })
        }
        className="rounded-lg bg-[var(--color-brand-primary)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isPending ? "جارِ الحفظ..." : "حفظ"}
      </button>
    </div>
  );
}

function ModifierForm({
  initial,
  isPending,
  onSubmit,
  onCancel,
}: {
  initial: ModifierInput;
  isPending: boolean;
  onSubmit: (input: ModifierInput) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [priceDelta, setPriceDelta] = useState(initial.priceDelta.toString());
  const [displayOrder, setDisplayOrder] = useState(initial.displayOrder.toString());

  return (
    <div className="flex items-center gap-2 rounded-lg bg-[var(--color-brand-card)] p-2 ring-1 ring-[var(--color-brand-border)]">
      <input
        type="text"
        placeholder="اسم الخيار"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 rounded-lg border border-[var(--color-brand-border)] px-2 py-1.5 text-sm outline-none focus:border-[var(--color-brand-primary)]"
      />
      <input
        type="number"
        step="0.01"
        placeholder="فرق السعر"
        value={priceDelta}
        onChange={(e) => setPriceDelta(e.target.value)}
        className="w-24 rounded-lg border border-[var(--color-brand-border)] px-2 py-1.5 text-sm outline-none focus:border-[var(--color-brand-primary)]"
      />
      <input
        type="number"
        step="1"
        placeholder="الترتيب"
        value={displayOrder}
        onChange={(e) => setDisplayOrder(e.target.value)}
        className="w-16 rounded-lg border border-[var(--color-brand-border)] px-2 py-1.5 text-sm outline-none focus:border-[var(--color-brand-primary)]"
      />
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          onSubmit({ name, priceDelta: Number(priceDelta) || 0, displayOrder: Number(displayOrder) || 0 })
        }
        className="rounded-lg bg-[var(--color-brand-primary)] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
      >
        حفظ
      </button>
      <button type="button" onClick={onCancel} aria-label="إلغاء">
        <X className="h-4 w-4" strokeWidth={2} />
      </button>
    </div>
  );
}

function ModifierRow({
  modifier,
  comboId,
  onError,
}: {
  modifier: Modifier;
  comboId: string;
  onError: (message: string | null) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleUpdate(input: ModifierInput) {
    onError(null);
    startTransition(async () => {
      const result = await updateComboModifierAction(modifier.id, comboId, input);
      if (result.error) {
        onError(result.error);
        return;
      }
      setIsEditing(false);
    });
  }

  function handleToggle() {
    onError(null);
    startTransition(async () => {
      const result = await toggleComboModifierAvailabilityAction(modifier.id, comboId, !modifier.is_available);
      if (result.error) onError(result.error);
    });
  }

  function handleDelete() {
    onError(null);
    startTransition(async () => {
      const result = await deleteComboModifierAction(modifier.id, comboId);
      if (result.error) onError(result.error);
    });
  }

  if (isEditing) {
    return (
      <ModifierForm
        initial={{
          name: modifier.name,
          priceDelta: modifier.price_delta,
          displayOrder: modifier.display_order,
        }}
        isPending={isPending}
        onSubmit={handleUpdate}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-[var(--color-brand-card)] px-3 py-2 ring-1 ring-[var(--color-brand-border)]">
      <span className="text-sm">
        {modifier.name}
        {modifier.price_delta !== 0 && (
          <span className="text-[var(--color-brand-muted)]"> ({formatCurrency(modifier.price_delta)})</span>
        )}
      </span>
      <div className="flex items-center gap-1.5">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            modifier.is_available
              ? "bg-green-100 text-green-700"
              : "bg-[var(--color-brand-background)] text-[var(--color-brand-muted)]"
          }`}
        >
          {modifier.is_available ? "متاح" : "معطّل"}
        </span>
        <button type="button" disabled={isPending} onClick={() => setIsEditing(true)} aria-label="تعديل">
          <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
        <button type="button" disabled={isPending} onClick={handleToggle} aria-label="تفعيل/تعطيل">
          {modifier.is_available ? "تعطيل" : "تفعيل"}
        </button>
        <button type="button" disabled={isPending} onClick={handleDelete} aria-label="حذف">
          <Trash2 className="h-3.5 w-3.5 text-[var(--color-brand-primary)]" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

function GroupCard({ group, comboId }: { group: ModifierGroup; comboId: string }) {
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [isAddingModifier, setIsAddingModifier] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleUpdateGroup(input: ModifierGroupInput) {
    setError(null);
    startTransition(async () => {
      const result = await updateComboModifierGroupAction(group.id, comboId, input);
      if (result.error) {
        setError(result.error);
        return;
      }
      setIsEditingGroup(false);
    });
  }

  function handleDeleteGroup() {
    setError(null);
    startTransition(async () => {
      const result = await deleteComboModifierGroupAction(group.id, comboId);
      if (result.error) setError(result.error);
    });
  }

  function handleCreateModifier(input: ModifierInput) {
    setError(null);
    startTransition(async () => {
      const result = await createComboModifierAction(group.id, comboId, input);
      if (result.error) {
        setError(result.error);
        return;
      }
      setIsAddingModifier(false);
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-[var(--color-brand-card)] p-4 ring-1 ring-[var(--color-brand-border)]">
      {isEditingGroup ? (
        <GroupForm
          title="تعديل المجموعة"
          initial={{
            name: group.name,
            isRequired: group.is_required,
            minSelect: group.min_select,
            maxSelect: group.max_select,
            displayOrder: group.display_order,
          }}
          isPending={isPending}
          onSubmit={handleUpdateGroup}
          onCancel={() => setIsEditingGroup(false)}
        />
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">{group.name}</p>
            <p className="text-xs text-[var(--color-brand-muted)]">
              {group.is_required ? "إجباري" : "اختياري"} — من {group.min_select} إلى {group.max_select}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" disabled={isPending} onClick={() => setIsEditingGroup(true)} aria-label="تعديل المجموعة">
              <Pencil className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <button type="button" disabled={isPending} onClick={handleDeleteGroup} aria-label="حذف المجموعة">
              <Trash2 className="h-4 w-4 text-[var(--color-brand-primary)]" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {group.modifiers
          .slice()
          .sort((a, b) => a.display_order - b.display_order)
          .map((modifier) => (
            <ModifierRow key={modifier.id} modifier={modifier} comboId={comboId} onError={setError} />
          ))}
      </div>

      {isAddingModifier ? (
        <ModifierForm
          initial={{ name: "", priceDelta: 0, displayOrder: group.modifiers.length }}
          isPending={isPending}
          onSubmit={handleCreateModifier}
          onCancel={() => setIsAddingModifier(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setIsAddingModifier(true)}
          className="flex w-fit items-center gap-1.5 rounded-full bg-[var(--color-brand-background)] px-3 py-1.5 text-xs font-medium ring-1 ring-[var(--color-brand-border)]"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          إضافة خيار
        </button>
      )}

      {error && <p className="text-sm font-medium text-[var(--color-brand-primary)]">{error}</p>}
    </div>
  );
}

export function ComboModifierGroupsManager({
  comboId,
  groups,
}: {
  comboId: string;
  groups: ModifierGroup[];
}) {
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreateGroup(input: ModifierGroupInput) {
    setError(null);
    startTransition(async () => {
      const result = await createComboModifierGroupAction(comboId, input);
      if (result.error) {
        setError(result.error);
        return;
      }
      setIsAddingGroup(false);
    });
  }

  return (
    <div className="flex max-w-md flex-col gap-4">
      {groups.map((group) => (
        <GroupCard key={group.id} group={group} comboId={comboId} />
      ))}

      {isAddingGroup ? (
        <div className="rounded-2xl bg-[var(--color-brand-card)] p-4 ring-1 ring-[var(--color-brand-border)]">
          <GroupForm
            title="إضافة مجموعة تعديل"
            initial={{ name: "", isRequired: false, minSelect: 0, maxSelect: 1, displayOrder: groups.length }}
            isPending={isPending}
            onSubmit={handleCreateGroup}
            onCancel={() => setIsAddingGroup(false)}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAddingGroup(true)}
          className="flex w-fit items-center gap-1.5 rounded-full bg-[var(--color-brand-primary)] px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          إضافة مجموعة تعديل
        </button>
      )}

      {error && <p className="text-sm font-medium text-[var(--color-brand-primary)]">{error}</p>}
    </div>
  );
}
