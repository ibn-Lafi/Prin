"use client";

import { useEffect, useState } from "react";

export type UserLocation = { latitude: number; longitude: number };
export type UserLocationStatus = "idle" | "loading" | "granted" | "denied";

// موقع العميل التقريبي — يُستخدم فقط لحساب مسافة كل فرع وترتيبها (الأقرب
// أولاً) بصفحة اختيار الفرع. يُطلب مرة عند فتح صفحة الاختيار، وبدون إذن
// المتصفح تبقى الفروع مرتّبة بترتيب العرض الافتراضي بدون مسافات — القائمة
// تعمل طبيعي بدون هذا الإذن، هو تحسين فقط.
export function useUserLocation(): { location: UserLocation | null; status: UserLocationStatus } {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [status, setStatus] = useState<UserLocationStatus>("idle");

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setStatus("granted");
      },
      () => setStatus("denied"),
      { timeout: 8000 },
    );
  }, []);

  return { location, status };
}
