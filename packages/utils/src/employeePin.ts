import bcrypt from "bcryptjs";

/** يتحقق من كود PIN مقابل الهاش المخزّن (bcrypt عبر pgcrypto بقاعدة البيانات). */
export async function verifyEmployeePin(pin: string, pinHash: string): Promise<boolean> {
  return bcrypt.compare(pin, pinHash);
}
