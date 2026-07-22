/**
 * يحوّل رقم جوال سعودي بأي صيغة شائعة (05xxxxxxxx، 5xxxxxxxx، +9665xxxxxxxx)
 * إلى صيغة E.164 (+9665xxxxxxxx). يرجع null لو الرقم مو صالح.
 */
export function normalizeSaudiPhone(input: string): string | null {
  const digitsOnly = input.replace(/[^\d]/g, "");

  let localDigits: string | null = null;
  if (digitsOnly.startsWith("9665") && digitsOnly.length === 12) {
    localDigits = digitsOnly.slice(3);
  } else if (digitsOnly.startsWith("05") && digitsOnly.length === 10) {
    localDigits = digitsOnly.slice(1);
  } else if (digitsOnly.startsWith("5") && digitsOnly.length === 9) {
    localDigits = digitsOnly;
  }

  if (!localDigits || !/^5\d{8}$/.test(localDigits)) {
    return null;
  }

  return `+966${localDigits}`;
}
