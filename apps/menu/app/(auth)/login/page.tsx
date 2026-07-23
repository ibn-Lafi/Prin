"use client";

import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageSquareLock, Phone } from "lucide-react";
import { normalizeSaudiPhone } from "@brin/utils";
import { sendOtpAction, verifyOtpAction } from "./actions";

type Step = "phone" | "otp";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/account";
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>("phone");
  const [phoneInput, setPhoneInput] = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSendOtp() {
    setError(null);
    const phone = normalizeSaudiPhone(phoneInput);
    if (!phone) {
      setError("رقم الجوال غير صحيح، تأكد من كتابته بصيغة 05xxxxxxxx");
      return;
    }

    startTransition(async () => {
      const result = await sendOtpAction(phone);
      if (result.error) {
        setError(result.error);
        return;
      }
      setNormalizedPhone(phone);
      setStep("otp");
    });
  }

  function handleVerifyOtp() {
    setError(null);
    startTransition(async () => {
      const result = await verifyOtpAction(normalizedPhone, otp);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(redirectTo);
    });
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-57px)] max-w-sm flex-col justify-center gap-5 px-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-primary-light)]">
          {step === "phone" ? (
            <Phone className="h-6 w-6 text-[var(--color-brand-primary)]" strokeWidth={1.75} />
          ) : (
            <MessageSquareLock
              className="h-6 w-6 text-[var(--color-brand-primary)]"
              strokeWidth={1.75}
            />
          )}
        </div>
        <h1 className="text-xl font-bold">تسجيل الدخول</h1>
      </div>

      {step === "phone" && (
        <div className="flex flex-col gap-3 rounded-2xl bg-[var(--color-brand-card)] p-4 ring-1 ring-[var(--color-brand-border)]">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-[var(--color-brand-muted)]">رقم الجوال</span>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="05xxxxxxxx"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 outline-none focus:border-[var(--color-brand-primary)]"
            />
          </label>
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={isPending}
            className="rounded-2xl bg-[var(--color-brand-primary)] px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {isPending ? "جارِ الإرسال..." : "إرسال الكود"}
          </button>
        </div>
      )}

      {step === "otp" && (
        <div className="flex flex-col gap-3 rounded-2xl bg-[var(--color-brand-card)] p-4 ring-1 ring-[var(--color-brand-border)]">
          <p className="text-center text-sm text-[var(--color-brand-muted)]">
            أرسلنا كود التحقق لرقم {normalizedPhone}
          </p>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-[var(--color-brand-muted)]">كود التحقق</span>
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2.5 text-center text-lg tracking-widest outline-none focus:border-[var(--color-brand-primary)]"
            />
          </label>
          <button
            type="button"
            onClick={handleVerifyOtp}
            disabled={isPending}
            className="rounded-2xl bg-[var(--color-brand-primary)] px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {isPending ? "جارِ التحقق..." : "تأكيد"}
          </button>
        </div>
      )}

      {error && <p className="text-center text-sm text-[var(--color-brand-primary)]">{error}</p>}
    </main>
  );
}
