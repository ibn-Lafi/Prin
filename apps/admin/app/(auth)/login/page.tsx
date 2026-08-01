"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await loginAction(username, password);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-8 px-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-primary-light)]">
          <ShieldCheck className="h-6 w-6 text-[var(--color-brand-primary)]" strokeWidth={1.75} />
        </div>
        <h1 className="text-xl font-bold">دخول لوحة الإدارة</h1>
        <p className="text-sm text-[var(--color-brand-muted)]">
          أدخل اسم المستخدم وكلمة المرور الخاصة بحساب المدير
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
        <input
          type="text"
          autoComplete="username"
          placeholder="اسم المستخدم"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isPending}
          className="w-full rounded-xl border border-[var(--color-brand-border)] bg-[var(--color-brand-card)] px-4 py-3 outline-none focus:border-[var(--color-brand-primary)] disabled:opacity-50"
        />
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending}
            className="w-full rounded-xl border border-[var(--color-brand-border)] bg-[var(--color-brand-card)] px-4 py-3 pl-11 outline-none focus:border-[var(--color-brand-primary)] disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute top-1/2 left-3 -translate-y-1/2 text-[var(--color-brand-muted)]"
            aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
          >
            {showPassword ? (
              <EyeOff className="h-4.5 w-4.5" strokeWidth={1.75} />
            ) : (
              <Eye className="h-4.5 w-4.5" strokeWidth={1.75} />
            )}
          </button>
        </div>

        {error && (
          <p className="text-center text-sm font-medium text-[var(--color-brand-primary)]">{error}</p>
        )}

        <button
          type="submit"
          disabled={isPending || !username || !password}
          className="mt-2 w-full rounded-xl bg-[var(--color-brand-primary)] px-4 py-3 font-semibold text-white disabled:opacity-50"
        >
          {isPending ? "جارِ الدخول..." : "دخول"}
        </button>
      </form>
    </main>
  );
}
