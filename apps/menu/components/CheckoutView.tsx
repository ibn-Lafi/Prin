"use client";

import Link from "next/link";
import { calculateTax, formatCurrency, roundMoney } from "@brin/utils";
import { useCart } from "@/hooks/useCart";

export function CheckoutView({
  customerPhone,
  taxRatePercent,
}: {
  customerPhone: string;
  taxRatePercent: number;
}) {
  const { items, itemTotal, subtotal } = useCart();

  const tax = calculateTax(subtotal, taxRatePercent);
  const total = roundMoney(subtotal + tax);

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-md px-4 py-10 text-center">
        <p>سلتك فاضية.</p>
        <Link href="/" className="mt-4 inline-block text-[var(--color-brand-primary)]">
          تصفّح المنيو
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-4 text-xl font-bold">تأكيد الطلب</h1>

      <section className="mb-4 rounded-lg border p-3">
        <p className="mb-1 font-semibold">معلومات الاستلام</p>
        <p className="text-sm text-gray-600">جوال: {customerPhone}</p>
        <p className="text-sm text-gray-600">استلام من الفرع (Counter Service)</p>
      </section>

      <section className="mb-4 flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.cartItemId} className="flex items-start justify-between border-b pb-2">
            <div>
              <p className="font-semibold">
                {item.name} × {item.quantity}
              </p>
              {item.modifiers.length > 0 && (
                <p className="text-xs text-gray-500">
                  {item.modifiers.map((m) => m.name).join("، ")}
                </p>
              )}
            </div>
            <span className="font-bold">{formatCurrency(itemTotal(item))}</span>
          </div>
        ))}
      </section>

      <section className="mb-6 flex flex-col gap-1">
        <div className="flex justify-between">
          <span>المجموع الفرعي</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>الضريبة ({taxRatePercent}%)</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold">
          <span>الإجمالي</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </section>

      <section className="rounded-lg border border-dashed p-4 text-center">
        <p className="mb-3 text-sm text-gray-600">
          الدفع الإلكتروني (مدى / Apple Pay / بطاقات) قيد التفعيل حالياً — الطلبات الإلكترونية غير
          متاحة مؤقتاً.
        </p>
        <button type="button" disabled className="w-full rounded bg-gray-300 px-4 py-3 text-white">
          الدفع — قريباً
        </button>
      </section>
    </main>
  );
}
