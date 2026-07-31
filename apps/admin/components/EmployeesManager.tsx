"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { createEmployeeAction, toggleEmployeeActiveAction } from "@/app/(protected)/employees/actions";
import type { Employee } from "@/lib/types";

const ROLE_LABELS: Record<string, string> = { manager: "مدير", staff: "موظف" };

export function EmployeesManager({ employees }: { employees: Employee[] }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"manager" | "staff">("staff");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setFullName("");
    setRole("staff");
    setPin("");
    setError(null);
    setIsFormOpen(false);
  }

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const result = await createEmployeeAction({ fullName, role, pin });
      if (result.error) {
        setError(result.error);
        return;
      }
      resetForm();
    });
  }

  function handleToggle(employeeId: string, nextActive: boolean) {
    setRowError(null);
    startTransition(async () => {
      const result = await toggleEmployeeActiveAction(employeeId, nextActive);
      if (result.error) setRowError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {rowError && (
        <p className="rounded-xl bg-[var(--color-brand-primary-light)] px-4 py-2 text-sm font-medium text-[var(--color-brand-primary)]">
          {rowError}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl bg-[var(--color-brand-card)] ring-1 ring-[var(--color-brand-border)]">
        <table className="w-full text-right text-sm">
          <thead className="bg-[var(--color-brand-background)] text-[var(--color-brand-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">الاسم</th>
              <th className="px-4 py-3 font-medium">الصلاحية</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id} className="border-t border-[var(--color-brand-border)]">
                <td className="px-4 py-3 font-medium">{employee.full_name}</td>
                <td className="px-4 py-3 text-[var(--color-brand-muted)]">
                  {ROLE_LABELS[employee.role] ?? employee.role}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      employee.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-[var(--color-brand-background)] text-[var(--color-brand-muted)]"
                    }`}
                  >
                    {employee.is_active ? "نشط" : "معطّل"}
                  </span>
                </td>
                <td className="px-4 py-3 text-left">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleToggle(employee.id, !employee.is_active)}
                    className="rounded-full bg-[var(--color-brand-background)] px-3 py-1.5 text-xs font-medium ring-1 ring-[var(--color-brand-border)] disabled:opacity-50"
                  >
                    {employee.is_active ? "تعطيل" : "تفعيل"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isFormOpen ? (
        <div className="flex max-w-sm flex-col gap-3 rounded-2xl bg-[var(--color-brand-card)] p-4 ring-1 ring-[var(--color-brand-border)]">
          <div className="flex items-center justify-between">
            <p className="font-semibold">إضافة موظف</p>
            <button type="button" onClick={resetForm} aria-label="إغلاق">
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
          <input
            type="text"
            placeholder="الاسم الكامل"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 outline-none focus:border-[var(--color-brand-primary)]"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "manager" | "staff")}
            className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 outline-none focus:border-[var(--color-brand-primary)]"
          >
            <option value="staff">موظف</option>
            <option value="manager">مدير</option>
          </select>
          <input
            type="text"
            inputMode="numeric"
            placeholder="رمز PIN (4 أرقام)"
            value={pin}
            maxLength={4}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 outline-none focus:border-[var(--color-brand-primary)]"
          />
          {error && <p className="text-sm font-medium text-[var(--color-brand-primary)]">{error}</p>}
          <button
            type="button"
            disabled={isPending}
            onClick={handleCreate}
            className="rounded-xl bg-[var(--color-brand-primary)] px-4 py-2.5 font-semibold text-white disabled:opacity-50"
          >
            {isPending ? "جارِ الإضافة..." : "إضافة"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsFormOpen(true)}
          className="flex w-fit items-center gap-1.5 rounded-full bg-[var(--color-brand-primary)] px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          إضافة موظف
        </button>
      )}
    </div>
  );
}
