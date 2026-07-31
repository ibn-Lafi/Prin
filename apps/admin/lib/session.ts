import { cookies } from "next/headers";
import {
  createEmployeeSessionToken,
  verifyEmployeeSessionToken,
  type EmployeeSessionPayload,
} from "@brin/utils/server";

const SESSION_COOKIE_NAME = "brin_admin_session";

function getSecret(): string {
  const value = process.env.EMPLOYEE_SESSION_SECRET;
  if (!value) {
    throw new Error('متغير البيئة "EMPLOYEE_SESSION_SECRET" مفقود');
  }
  return value;
}

// الجلسة "manager" حصراً — نفس آلية توقيع جلسة الكاشير (@brin/utils/server)
// لكن بكوكي منفصل، فدخول الكاشير لا يمنح أي صلاحية بلوحة الإدارة والعكس.
export async function createSession(employeeId: string): Promise<void> {
  const token = createEmployeeSessionToken(employeeId, "manager", getSecret());
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function getSession(): Promise<EmployeeSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyEmployeeSessionToken(token, getSecret());
  if (!payload || payload.role !== "manager") return null;
  return payload;
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
