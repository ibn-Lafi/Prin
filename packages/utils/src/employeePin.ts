import bcrypt from "bcryptjs";

/** يتحقق من كود PIN مقابل الهاش المخزّن (bcrypt عبر pgcrypto بقاعدة البيانات). */
export async function verifyEmployeePin(pin: string, pinHash: string): Promise<boolean> {
  return bcrypt.compare(pin, pinHash);
}

/** يُنشئ هاش bcrypt لكود PIN جديد — لإنشاء/تعديل موظف من لوحة الإدارة. */
export async function hashEmployeePin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}
