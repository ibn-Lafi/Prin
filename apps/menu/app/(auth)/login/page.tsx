"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { normalizeSaudiPhone } from "@brin/utils";
import { sendOtpAction, verifyOtpAction } from "./actions";

type Step = "phone" | "otp";

export default function LoginPage() {
  const router = useRouter();
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
      router.push("/account");
    });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-4">
      <h1 className="text-xl font-bold">تسجيل الدخول</h1>

      {step === "phone" && (
        <>
          <label className="flex flex-col gap-1">
            <span>رقم الجوال</span>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="05xxxxxxxx"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="rounded border px-3 py-2"
            />
          </label>
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={isPending}
            className="rounded bg-[var(--color-brand-primary)] px-4 py-2 text-white disabled:opacity-50"
          >
            {isPending ? "جارِ الإرسال..." : "إرسال الكود"}
          </button>
        </>
      )}

      {step === "otp" && (
        <>
          <p>أرسلنا كود التحقق لرقم {normalizedPhone}</p>
          <label className="flex flex-col gap-1">
            <span>كود التحقق</span>
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="rounded border px-3 py-2"
            />
          </label>
          <button
            type="button"
            onClick={handleVerifyOtp}
            disabled={isPending}
            className="rounded bg-[var(--color-brand-primary)] px-4 py-2 text-white disabled:opacity-50"
          >
            {isPending ? "جارِ التحقق..." : "تأكيد"}
          </button>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </main>
  );
}
