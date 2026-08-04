"use client";

import { useSyncExternalStore } from "react";

const BRANCH_STORAGE_KEY = "brin-menu-branch-id";

let selectedBranchId: string | null = null;
let isLoadedFromStorage = false;
const listeners = new Set<() => void>();

function loadFromStorageOnce() {
  if (isLoadedFromStorage || typeof window === "undefined") return;
  isLoadedFromStorage = true;
  selectedBranchId = window.localStorage.getItem(BRANCH_STORAGE_KEY) || null;
}

function persistAndNotify() {
  if (typeof window !== "undefined") {
    if (selectedBranchId) {
      window.localStorage.setItem(BRANCH_STORAGE_KEY, selectedBranchId);
    } else {
      window.localStorage.removeItem(BRANCH_STORAGE_KEY);
    }
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  loadFromStorageOnce();
  return selectedBranchId;
}

function getServerSnapshot(): string | null {
  return null;
}

export function selectBranch(branchId: string | null) {
  selectedBranchId = branchId;
  persistAndNotify();
}

/** الفرع الذي يختاره العميل عند الطلب — يُحفظ بمتصفحه (localStorage) عشان
 * يتذكّره بالزيارة الجاية، لكن يبقى قرار العميل يتغيّر بأي وقت من صفحة الدفع. */
export function useBranch() {
  const selectedBranchId = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { selectedBranchId, selectBranch };
}
