"use client";

import { useState, useTransition } from "react";
import { Plus, X, Pencil } from "lucide-react";
import {
  createBranchAction,
  updateBranchAction,
  toggleBranchActiveAction,
  toggleBranchAcceptingOrdersAction,
  type BranchInput,
} from "@/app/(protected)/branches/actions";
import type { Branch } from "@/lib/types";

function BranchForm({
  title,
  initial,
  isPending,
  onSubmit,
  onCancel,
}: {
  title: string;
  initial: BranchInput;
  isPending: boolean;
  onSubmit: (input: BranchInput) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [address, setAddress] = useState(initial.address);
  const [phone, setPhone] = useState(initial.phone);
  const [openingTime, setOpeningTime] = useState(initial.openingTime);
  const [closingTime, setClosingTime] = useState(initial.closingTime);
  const [isAcceptingOrders, setIsAcceptingOrders] = useState(initial.isAcceptingOrders);
  const [displayOrder, setDisplayOrder] = useState(initial.displayOrder.toString());

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
        placeholder="اسم الفرع"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 outline-none focus:border-[var(--color-brand-primary)]"
      />
      <input
        type="text"
        placeholder="العنوان (اختياري)"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 outline-none focus:border-[var(--color-brand-primary)]"
      />
      <input
        type="tel"
        placeholder="جوال الفرع (اختياري)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 outline-none focus:border-[var(--color-brand-primary)]"
      />
      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
          وقت الفتح
          <input
            type="time"
            value={openingTime}
            onChange={(e) => setOpeningTime(e.target.value)}
            className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm text-[var(--color-brand-muted)]">
          وقت الإغلاق
          <input
            type="time"
            value={closingTime}
            onChange={(e) => setClosingTime(e.target.value)}
            className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 text-[var(--color-brand-text)] outline-none focus:border-[var(--color-brand-primary)]"
          />
        </label>
      </div>
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
      <label className="flex items-center gap-2.5 text-sm text-[var(--color-brand-text)]">
        <input
          type="checkbox"
          checked={isAcceptingOrders}
          onChange={(e) => setIsAcceptingOrders(e.target.checked)}
          className="h-4 w-4 rounded border-[var(--color-brand-border)] accent-[var(--color-brand-primary)]"
        />
        يستقبل طلبات القائمة الإلكترونية
      </label>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          onSubmit({
            name,
            address,
            phone,
            openingTime,
            closingTime,
            isAcceptingOrders,
            displayOrder: Number(displayOrder) || 0,
          })
        }
        className="rounded-xl bg-[var(--color-brand-primary)] px-4 py-2.5 font-semibold text-white disabled:opacity-50"
      >
        {isPending ? "جارِ الحفظ..." : "حفظ"}
      </button>
    </div>
  );
}

export function BranchesManager({ branches }: { branches: Branch[] }) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate(input: BranchInput) {
    setError(null);
    startTransition(async () => {
      const result = await createBranchAction(input);
      if (result.error) {
        setError(result.error);
        return;
      }
      setIsCreating(false);
    });
  }

  function handleUpdate(branchId: string, input: BranchInput) {
    setError(null);
    startTransition(async () => {
      const result = await updateBranchAction(branchId, input);
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditingId(null);
    });
  }

  function handleToggleActive(branchId: string, nextActive: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await toggleBranchActiveAction(branchId, nextActive);
      if (result.error) setError(result.error);
    });
  }

  function handleToggleAccepting(branchId: string, next: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await toggleBranchAcceptingOrdersAction(branchId, next);
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
        {branches.map((branch) =>
          editingId === branch.id ? (
            <BranchForm
              key={branch.id}
              title="تعديل الفرع"
              initial={{
                name: branch.name,
                address: branch.address ?? "",
                phone: branch.phone ?? "",
                openingTime: branch.opening_time.slice(0, 5),
                closingTime: branch.closing_time.slice(0, 5),
                isAcceptingOrders: branch.is_accepting_orders,
                displayOrder: branch.display_order,
              }}
              isPending={isPending}
              onSubmit={(input) => handleUpdate(branch.id, input)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div
              key={branch.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--color-brand-card)] p-4 ring-1 ring-[var(--color-brand-border)]"
            >
              <div>
                <p className="font-semibold">{branch.name}</p>
                <p className="text-sm text-[var(--color-brand-muted)]">
                  {branch.address ? `${branch.address} — ` : ""}
                  {branch.opening_time.slice(0, 5)} – {branch.closing_time.slice(0, 5)}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    branch.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-[var(--color-brand-background)] text-[var(--color-brand-muted)]"
                  }`}
                >
                  {branch.is_active ? "نشط" : "معطّل"}
                </span>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleToggleAccepting(branch.id, !branch.is_accepting_orders)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 disabled:opacity-50 ${
                    branch.is_accepting_orders
                      ? "bg-[var(--color-brand-background)] text-[var(--color-brand-text)] ring-[var(--color-brand-border)]"
                      : "bg-[var(--color-brand-primary-light)] text-[var(--color-brand-primary)] ring-[var(--color-brand-primary)]"
                  }`}
                >
                  {branch.is_accepting_orders ? "يستقبل الطلبات الإلكترونية" : "الطلبات الإلكترونية موقوفة"}
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setEditingId(branch.id)}
                  className="flex items-center justify-center rounded-full bg-[var(--color-brand-background)] p-2 ring-1 ring-[var(--color-brand-border)] disabled:opacity-50"
                  aria-label="تعديل"
                >
                  <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleToggleActive(branch.id, !branch.is_active)}
                  className="rounded-full bg-[var(--color-brand-background)] px-3 py-1.5 text-xs font-medium ring-1 ring-[var(--color-brand-border)] disabled:opacity-50"
                >
                  {branch.is_active ? "تعطيل" : "تفعيل"}
                </button>
              </div>
            </div>
          ),
        )}

        {branches.length === 0 && (
          <p className="text-sm text-[var(--color-brand-muted)]">لا توجد فروع بعد — أضف أول فرع.</p>
        )}
      </div>

      {isCreating ? (
        <BranchForm
          title="إضافة فرع"
          initial={{
            name: "",
            address: "",
            phone: "",
            openingTime: "09:00",
            closingTime: "23:59",
            isAcceptingOrders: true,
            displayOrder: branches.length,
          }}
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
          إضافة فرع
        </button>
      )}
    </div>
  );
}
