import type { PostgrestError } from "@supabase/supabase-js";

export class DatabaseQueryError extends Error {
  constructor(
    message: string,
    public readonly cause?: PostgrestError,
  ) {
    super(message);
    this.name = "DatabaseQueryError";
  }
}

/** طبقة موحّدة لمعالجة أخطاء استعلامات Supabase — ترمي خطأ واضح بدل تجاهله بهدوء. */
export function unwrapQuery<T>(result: { data: T | null; error: PostgrestError | null }): T {
  if (result.error) {
    throw new DatabaseQueryError("تعذّر الاتصال بقاعدة البيانات", result.error);
  }
  return (result.data ?? ([] as unknown as T)) as T;
}
