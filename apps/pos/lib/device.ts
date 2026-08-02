"use client";

import { useSyncExternalStore } from "react";

const STATION_ID_KEY = "brin_pos_station_id";
const listeners = new Set<() => void>();

function getSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STATION_ID_KEY);
}

function getServerSnapshot(): string | null {
  return null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** معرّف جهاز الكاشير الحالي — يخزَّن بمتصفح هذا الجهاز فقط (localStorage)،
 * مستقل عن جلسة الموظف (نفس الموظف ممكن يسجّل دخول من أي جهاز، لكن معرّف
 * الجهاز ثابت). لازم يطابق STATION_ID بملف .env لعامل الطباعة المثبّت
 * فعلياً على نفس الجهاز — راجع صفحة إعدادات الطباعة. نسخة الـ hook تتفاعل
 * تلقائياً مع أي تغيير عبر setStationId (آمنة لهيدريشن Next.js، ترجع null
 * بالسيرفر دائماً)، ونسخة الدالة العادية للقراءة الفورية بمعالِجات الأحداث. */
export function useStationId(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function getStationId(): string | null {
  return getSnapshot();
}

export function setStationId(stationId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STATION_ID_KEY, stationId);
  listeners.forEach((listener) => listener());
}
