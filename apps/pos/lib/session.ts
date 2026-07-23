import { cookies } from "next/headers";
import {
  createEmployeeSessionToken,
  verifyEmployeeSessionToken,
  type EmployeeRole,
  type EmployeeSessionPayload,
} from "@brin/utils";

const SESSION_COOKIE_NAME = "brin_pos_session";

function getSecret(): string {
  const value = process.env.EMPLOYEE_SESSION_SECRET;
  if (!value) {
    throw new Error('متغير البيئة "EMPLOYEE_SESSION_SECRET" مفقود');
  }
  return value;
}

export async function createSession(employeeId: string, role: EmployeeRole): Promise<void> {
  const token = createEmployeeSessionToken(employeeId, role, getSecret());
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
  return verifyEmployeeSessionToken(token, getSecret());
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
