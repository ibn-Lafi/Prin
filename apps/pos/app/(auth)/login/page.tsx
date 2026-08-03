"use client";

import { useEffect, useState, useTransition } from "react";
import { ChevronRight, Delete, Lock, User } from "lucide-react";
import { listActiveEmployeesAction, loginAction, type EmployeeOption } from "./actions";

const KEYPAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export default function LoginPage() {
  const [employees, setEmployees] = useState<EmployeeOption[] | null>(null);
  const [selected, setSelected] = useState<EmployeeOption | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    listActiveEmployeesAction().then(setEmployees);
  }, []);

  function handleSelect(employee: EmployeeOption) {
    setError(null);
    setPin("");
    setSelected(employee);
  }

  function handleBack() {
    setError(null);
    setPin("");
    setSelected(null);
  }

  function handleKey(key: string) {
    if (isPending || !selected) return;
    setError(null);

    if (key === "⌫") {
      setPin((current) => current.slice(0, -1));
      return;
    }

    if (pin.length >= 4) return;
    const next = pin + key;
    setPin(next);

    if (next.length === 4) {
      startTransition(async () => {
        const result = await loginAction(selected.id, next);
        if (result?.error) {
          setError(result.error);
          setPin("");
        }
      });
    }
  }

  if (!selected) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-8 px-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-primary-light)]">
            <User className="h-6 w-6 text-[var(--color-brand-primary)]" strokeWidth={1.75} />
          </div>
          <h1 className="text-xl font-bold">دخول الكاشير</h1>
          <p className="text-sm text-[var(--color-brand-muted)]">اختر اسمك</p>
        </div>

        <div className="grid w-full grid-cols-2 gap-3">
          {(employees ?? []).map((employee) => (
            <button
              key={employee.id}
              type="button"
              onClick={() => handleSelect(employee)}
              className="flex flex-col items-center gap-2 rounded-2xl bg-[var(--color-brand-card)] p-4 shadow-md shadow-black/5 transition-all duration-100 active:translate-y-0.5 active:shadow-sm"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-brand-primary-light)] text-[var(--color-brand-primary)]">
                <User className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <span className="text-sm font-semibold text-[var(--color-brand-text)]">
                {employee.full_name}
              </span>
            </button>
          ))}
        </div>

        {employees !== null && employees.length === 0 && (
          <p className="text-sm text-[var(--color-brand-muted)]">لا توجد حسابات كاشير مفعّلة</p>
        )}
      </main>
    );
  }

  return (
    <main className="relative mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-8 px-4">
      <button
        type="button"
        onClick={handleBack}
        className="absolute top-4 right-4 flex items-center gap-1 text-sm text-[var(--color-brand-muted)]"
      >
        <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
        رجوع
      </button>

      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-primary-light)]">
          <Lock className="h-6 w-6 text-[var(--color-brand-primary)]" strokeWidth={1.75} />
        </div>
        <h1 className="text-xl font-bold">مرحباً {selected.full_name}</h1>
        <p className="text-sm text-[var(--color-brand-muted)]">أدخل كود PIN الخاص بك</p>
      </div>

      <div className="flex gap-3" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-4 w-4 rounded-full ${
              i < pin.length ? "bg-[var(--color-brand-primary)]" : "bg-[var(--color-brand-border)]"
            }`}
          />
        ))}
      </div>

      <p className="h-5 text-sm font-medium text-[var(--color-brand-primary)]">{error}</p>

      <div className="grid grid-cols-3 gap-4">
        {KEYPAD.map((key, index) =>
          key === "" ? (
            <span key={index} />
          ) : (
            <button
              key={index}
              type="button"
              onClick={() => handleKey(key)}
              disabled={isPending}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-brand-card)] text-xl font-semibold text-[var(--color-brand-text)] shadow-md shadow-black/5 transition-all duration-100 active:translate-y-0.5 active:shadow-sm disabled:opacity-50"
            >
              {key === "⌫" ? <Delete className="h-5 w-5" strokeWidth={1.75} /> : key}
            </button>
          ),
        )}
      </div>
    </main>
  );
}
