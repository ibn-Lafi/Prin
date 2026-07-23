const RESTAURANT_TIMEZONE = "Asia/Riyadh";

/** الوقت الحالي بتوقيت الرياض بصيغة "HH:mm" للمقارنة مع أوقات العمل. */
function currentTimeInRiyadh(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: RESTAURANT_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
}

/**
 * يتحقق هل المطعم يستقبل طلبات الآن: يجب أن يكون داخل ساعات العمل المضبوطة
 * من لوحة الإدارة، وأن يكون التبديل اليدوي (isAcceptingOrders) مفعّلاً.
 * openingTime/closingTime بصيغة "HH:mm" أو "HH:mm:ss" (كما تُخزَّن بـ Postgres).
 */
export function isRestaurantOpen(
  openingTime: string,
  closingTime: string,
  isAcceptingOrders: boolean,
): boolean {
  if (!isAcceptingOrders) return false;

  const now = currentTimeInRiyadh();
  const opening = openingTime.slice(0, 5);
  const closing = closingTime.slice(0, 5);

  if (opening <= closing) {
    return now >= opening && now < closing;
  }

  // ساعات عمل تمتد لما بعد منتصف الليل (مثال: 09:00 → 02:00)
  return now >= opening || now < closing;
}
