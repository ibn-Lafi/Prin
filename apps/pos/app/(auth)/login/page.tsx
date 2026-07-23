"use client";

import { useState, useTransition } from "react";
import { Delete, Lock } from "lucide-react";
import { loginAction } from "./actions";

const KEYPAD = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export default function LoginPage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleKey(key: string) {
    if (isPending) return;
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
        const result = await loginAction(next);
        if (result?.error) {
          setError(result.error);
          setPin("");
        }
      });
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-8 px-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-primary-light)]">
          <Lock className="h-6 w-6 text-[var(--color-brand-primary)]" strokeWidth={1.75} />
        </div>
        <h1 className="text-xl font-bold">دخول الكاشير</h1>
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
