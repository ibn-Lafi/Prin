"use client";

import { useSyncExternalStore } from "react";
import { lookupCustomerAction, listActiveRewardsAction } from "@/app/(protected)/orders/actions";
import type { CustomerLookup, Reward } from "@/lib/types";

// حالة العميل/المكافأة مشتركة بين تبويب "استبدل" (ProductGrid) ونافذة الدفع
// (CheckoutDialog) — نفس نمط useOrderTicket.tsx (متجر خارجي + useSyncExternalStore)
// عشان لا نكرر البحث عن العميل مرتين، وتختار مكافأة من تبويب الاستبدال ثم
// تكمل الدفع بنفس الاختيار جاهزاً. تُصفّر بعد إتمام الطلب (راجع resetCheckoutCustomer).
type State = {
  phone: string;
  name: string;
  customer: CustomerLookup | null;
  hasSearched: boolean;
  isLookingUp: boolean;
  rewards: Reward[];
  selectedRewardId: string | null;
};

const initialState: State = {
  phone: "",
  name: "",
  customer: null,
  hasSearched: false,
  isLookingUp: false,
  rewards: [],
  selectedRewardId: null,
};

let state: State = initialState;

const listeners = new Set<() => void>();

function setState(partial: Partial<State>) {
  state = { ...state, ...partial };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

// دائماً الحالة الابتدائية الفارغة أثناء الـSSR — الحالة الفعلية (state) مشتركة
// على مستوى العملية (module-level)، فلو رجّعناها هنا ممكن يتسرّب رقم/اسم/نقاط
// عميل من طلب سابق بنفس العملية إلى HTML طلب كاشير مختلف تماماً. مثل نفس مبدأ
// useOrderTicket.tsx بالضبط.
function getServerSnapshot(): State {
  return initialState;
}

export function setCustomerPhone(phone: string) {
  setState({ phone, customer: null, hasSearched: false, selectedRewardId: null });
}

export function setCustomerName(name: string) {
  setState({ name });
}

export async function lookupCustomer(): Promise<void> {
  const phone = state.phone.trim();
  if (!phone) return;
  setState({ isLookingUp: true });
  const result = await lookupCustomerAction(phone);
  setState({
    isLookingUp: false,
    customer: result,
    hasSearched: true,
    name: result?.fullName && !state.name.trim() ? result.fullName : state.name,
  });
}

let rewardsLoaded = false;
export async function ensureRewardsLoaded(): Promise<void> {
  if (rewardsLoaded) return;
  rewardsLoaded = true;
  const rewards = await listActiveRewardsAction();
  setState({ rewards });
}

export function selectReward(rewardId: string | null) {
  setState({ selectedRewardId: rewardId });
}

/** يُستدعى فور إتمام الطلب (نفس لحظة clearTicket) — يمسح ربط العميل والمكافأة
 * المختارة، لكن يبقي قائمة المكافآت المحمّلة (لا تتغير من طلب لآخر). */
export function resetCheckoutCustomer() {
  setState({ phone: "", name: "", customer: null, hasSearched: false, selectedRewardId: null });
}

export function useCheckoutCustomer() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const canAfford = (reward: Reward) => (snapshot.customer?.pointsBalance ?? 0) >= reward.pointsCost;
  const selectedReward = snapshot.rewards.find(
    (r) => r.id === snapshot.selectedRewardId && canAfford(r),
  ) ?? null;

  return {
    ...snapshot,
    setPhone: setCustomerPhone,
    setName: setCustomerName,
    lookup: lookupCustomer,
    selectReward,
    canAfford,
    selectedReward,
  };
}
