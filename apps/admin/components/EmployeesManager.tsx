"use client";

import { useState, useTransition } from "react";
import { Plus, X, Pencil } from "lucide-react";
import {
  createEmployeeAction,
  updateEmployeeAction,
  toggleEmployeeActiveAction,
} from "@/app/(protected)/employees/actions";
import type { Employee } from "@/lib/types";

const ROLE_LABELS: Record<string, string> = { manager: "مدير", staff: "موظف" };

function EmployeeForm({
  title,
  initialName,
  initialRole,
  initialUsername,
  pinRequired,
  credentialsRequired,
  isPending,
  onSubmit,
  onCancel,
}: {
  title: string;
  initialName: string;
  initialRole: "manager" | "staff";
  initialUsername: string;
  pinRequired: boolean;
  credentialsRequired: boolean;
  isPending: boolean;
  onSubmit: (
    fullName: string,
    role: "manager" | "staff",
    pin: string,
    username: string,
    password: string,
  ) => void;
  onCancel: () => void;
}) {
  const [fullName, setFullName] = useState(initialName);
  const [role, setRole] = useState<"manager" | "staff">(initialRole);
  const [pin, setPin] = useState("");
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState("");

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
        placeholder={pinRequired ? "رمز PIN للكاشير (4 أرقام)" : "رمز PIN جديد للكاشير (اتركه فارغاً للإبقاء كما هو)"}
        value={pin}
        maxLength={4}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
        className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 outline-none focus:border-[var(--color-brand-primary)]"
      />

      {role === "manager" && (
        <div className="flex flex-col gap-3 border-t border-[var(--color-brand-border)] pt-3">
          <p className="text-xs text-[var(--color-brand-muted)]">
            اعتماد الدخول للوحة الإدارة (منفصل عن رمز PIN الخاص بالكاشير)
          </p>
          <input
            type="text"
            placeholder="اسم المستخدم"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoCapitalize="off"
            autoCorrect="off"
            className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 outline-none focus:border-[var(--color-brand-primary)]"
          />
          <input
            type="password"
            placeholder={
              credentialsRequired ? "كلمة المرور (8 أحرف على الأقل)" : "كلمة مرور جديدة (اتركها فارغة للإبقاء كما هي)"
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 outline-none focus:border-[var(--color-brand-primary)]"
          />
        </div>
      )}

      <button
        type="button"
        disabled={isPending}
        onClick={() => onSubmit(fullName, role, pin, username, password)}
        className="rounded-xl bg-[var(--color-brand-primary)] px-4 py-2.5 font-semibold text-white disabled:opacity-50"
      >
        {isPending ? "جارِ الحفظ..." : "حفظ"}
      </button>
    </div>
  );
}

export function EmployeesManager({ employees }: { employees: Employee[] }) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate(
    fullName: string,
    role: "manager" | "staff",
    pin: string,
    username: string,
    password: string,
  ) {
    setError(null);
    startTransition(async () => {
      const result = await createEmployeeAction({ fullName, role, pin, username, password });
      if (result.error) {
        setError(result.error);
        return;
      }
      setIsCreating(false);
    });
  }

  function handleUpdate(
    employeeId: string,
    fullName: string,
    role: "manager" | "staff",
    pin: string,
    username: string,
    password: string,
  ) {
    setError(null);
    startTransition(async () => {
      const result = await updateEmployeeAction(employeeId, {
        fullName,
        role,
        newPin: pin,
        username,
        newPassword: password,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditingId(null);
    });
  }

  function handleToggle(employeeId: string, nextActive: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await toggleEmployeeActiveAction(employeeId, nextActive);
      if (result.error) setError(result.error);
    });
  }

  const editingEmployee = employees.find((e) => e.id === editingId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-xl bg-[var(--color-brand-primary-light)] px-4 py-2 text-sm font-medium text-[var(--color-brand-primary)]">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl bg-[var(--color-brand-card)] ring-1 ring-[var(--color-brand-border)]">
        <table className="w-full text-right text-sm">
          <thead className="bg-[var(--color-brand-background)] text-[var(--color-brand-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">الاسم</th>
              <th className="px-4 py-3 font-medium">الصلاحية</th>
              <th className="px-4 py-3 font-medium">اسم المستخدم</th>
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
                <td className="px-4 py-3 text-[var(--color-brand-muted)]">
                  {employee.username ?? "—"}
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
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => {
                        setIsCreating(false);
                        setEditingId(employee.id);
                      }}
                      className="flex items-center justify-center rounded-full bg-[var(--color-brand-background)] p-2 ring-1 ring-[var(--color-brand-border)] disabled:opacity-50"
                      aria-label="تعديل"
                    >
                      <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleToggle(employee.id, !employee.is_active)}
                      className="rounded-full bg-[var(--color-brand-background)] px-3 py-1.5 text-xs font-medium ring-1 ring-[var(--color-brand-border)] disabled:opacity-50"
                    >
                      {employee.is_active ? "تعطيل" : "تفعيل"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingEmployee && (
        <EmployeeForm
          title={`تعديل: ${editingEmployee.full_name}`}
          initialName={editingEmployee.full_name}
          initialRole={editingEmployee.role as "manager" | "staff"}
          initialUsername={editingEmployee.username ?? ""}
          pinRequired={false}
          credentialsRequired={!editingEmployee.username}
          isPending={isPending}
          onSubmit={(fullName, role, pin, username, password) =>
            handleUpdate(editingEmployee.id, fullName, role, pin, username, password)
          }
          onCancel={() => setEditingId(null)}
        />
      )}

      {!editingEmployee && isCreating && (
        <EmployeeForm
          title="إضافة موظف"
          initialName=""
          initialRole="staff"
          initialUsername=""
          pinRequired
          credentialsRequired
          isPending={isPending}
          onSubmit={handleCreate}
          onCancel={() => setIsCreating(false)}
        />
      )}

      {!editingEmployee && !isCreating && (
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="flex w-fit items-center gap-1.5 rounded-full bg-[var(--color-brand-primary)] px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          إضافة موظف
        </button>
      )}
    </div>
  );
}
