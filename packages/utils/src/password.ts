import bcrypt from "bcryptjs";

/** يُنشئ هاش bcrypt لكلمة مرور حساب مدير جديد بلوحة الإدارة. */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/** يتحقق من كلمة المرور مقابل الهاش المخزّن. */
export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}
