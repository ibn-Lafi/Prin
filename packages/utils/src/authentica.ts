const PHONE_E164_PATTERN = /^\+[1-9]\d{6,14}$/;

export class AuthenticaError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AuthenticaError";
  }
}

function getBaseUrl(): string {
  const value = process.env.AUTHENTICA_BASE_URL;
  if (!value) {
    throw new AuthenticaError('متغير البيئة "AUTHENTICA_BASE_URL" مفقود');
  }
  return value;
}

function getApiKey(): string {
  const value = process.env.AUTHENTICA_API_KEY;
  if (!value) {
    throw new AuthenticaError('متغير البيئة "AUTHENTICA_API_KEY" مفقود');
  }
  return value;
}

function assertValidPhone(phone: string): void {
  if (!PHONE_E164_PATTERN.test(phone)) {
    throw new AuthenticaError(
      `رقم جوال غير صالح: يجب أن يكون بصيغة E.164 (مثال: +9665XXXXXXXX)، وصلنا: ${phone}`,
    );
  }
}

async function callAuthentica(path: string, body: Record<string, string>): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${getBaseUrl()}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Authorization": getApiKey(),
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new AuthenticaError("تعذّر الوصول لخدمة Authentica (مشكلة شبكة)", error);
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new AuthenticaError(`فشل طلب Authentica (${response.status}): ${errorBody}`);
  }
}

/** يرسل كود OTP عبر SMS لرقم جوال بصيغة E.164 (مثال: +9665XXXXXXXX). */
export async function sendOtp(phone: string): Promise<void> {
  assertValidPhone(phone);
  await callAuthentica("/api/v2/send-otp", { method: "sms", phone });
}

/** يتحقق من كود OTP لرقم جوال. يرمي AuthenticaError لو الكود خاطئ أو منتهي. */
export async function verifyOtp(phone: string, otp: string): Promise<void> {
  assertValidPhone(phone);
  await callAuthentica("/api/v2/verify-otp", { phone, otp });
}
