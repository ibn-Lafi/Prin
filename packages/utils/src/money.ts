/** يقرّب لأقرب هللة (منزلتين عشريتين) لتفادي مشاكل الفاصلة العائمة. */
export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function calculateTax(subtotal: number, taxRatePercent: number): number {
  return roundMoney(subtotal * (taxRatePercent / 100));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 2,
  }).format(amount);
}
