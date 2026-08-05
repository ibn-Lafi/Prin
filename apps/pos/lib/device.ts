"use client";

import { useSyncExternalStore } from "react";

const DEVICE_ID_KEY = "brin_pos_device_id";
const BRANCH_ID_KEY = "brin_pos_branch_id";
const listeners = new Set<() => void>();

function getServerSnapshot(): string | null {
  return null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// معرّف جهاز الكاشير الحالي — يُولَّد تلقائياً (بدون أي إدخال يدوي) عند أول
// قراءة بالمتصفح ويبقى ثابتاً بعدها بـ localStorage. يحدد أي طلبات/مهام
// طباعة تخص هذا الجهاز تحديداً، ويحل محل معرّف المحطة اليدوي القديم.
function getDeviceIdSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  let id = window.localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function useDeviceId(): string | null {
  return useSyncExternalStore(subscribe, getDeviceIdSnapshot, getServerSnapshot);
}

export function getDeviceId(): string | null {
  return getDeviceIdSnapshot();
}

// منفذ طوارئ فقط (مثلاً استبدال جهاز الكاشير فعلياً) — يمسح المعرّف الحالي
// فيُولَّد واحد جديد تلقائياً عند أول قراءة تالية.
export function resetDeviceId(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEVICE_ID_KEY);
  listeners.forEach((listener) => listener());
}

function getBranchSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(BRANCH_ID_KEY);
}

/** فرع هذا الجهاز — يُضبط مرة وحدة (شاشة اختيار الفرع قبل أول تسجيل دخول)
 * ويبقى ثابتاً لكل طلبات/ورديات/مهام طباعة هذا الجهاز، بمعزل عن أي موظف
 * يسجّل دخول عليه. */
export function useBranchId(): string | null {
  return useSyncExternalStore(subscribe, getBranchSnapshot, getServerSnapshot);
}

export function getBranchId(): string | null {
  return getBranchSnapshot();
}

export function setBranchId(branchId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BRANCH_ID_KEY, branchId);
  listeners.forEach((listener) => listener());
}
