import crypto from "node:crypto";

export type EmployeeRole = "manager" | "staff";

export type EmployeeSessionPayload = {
  employeeId: string;
  role: EmployeeRole;
  exp: number;
};

const SESSION_TTL_SECONDS = 12 * 60 * 60; // 12 ساعة — يغطي وردية عمل كاملة

function sign(data: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

/** يبني توكن جلسة موظف موقّع (HMAC) — بدون Supabase Auth، جلسة مخصصة بالكامل. */
export function createEmployeeSessionToken(
  employeeId: string,
  role: EmployeeRole,
  secret: string,
): string {
  const payload: EmployeeSessionPayload = {
    employeeId,
    role,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(data, secret);
  return `${data}.${signature}`;
}

/** يتحقق من توكن الجلسة (التوقيع + الصلاحية) ويرجّع بياناتها، أو null لو غير صالح. */
export function verifyEmployeeSessionToken(
  token: string,
  secret: string,
): EmployeeSessionPayload | null {
  const [data, signature] = token.split(".");
  if (!data || !signature) return null;

  const expectedSignature = sign(data, secret);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as EmployeeSessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
