"use client";

import { useSyncExternalStore } from "react";
import { roundMoney } from "@brin/utils";

const TICKET_STORAGE_KEY = "brin-pos-ticket";

export type TicketModifier = {
  modifierId: string;
  name: string;
  priceDelta: number;
};

export type TicketItem = {
  ticketItemId: string;
  kind: "product" | "combo";
  refId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  modifiers: TicketModifier[];
};

let ticketItems: TicketItem[] = [];
let isLoadedFromStorage = false;
const listeners = new Set<() => void>();

function loadFromStorageOnce() {
  if (isLoadedFromStorage || typeof window === "undefined") return;
  isLoadedFromStorage = true;
  const stored = window.localStorage.getItem(TICKET_STORAGE_KEY);
  if (!stored) return;
  try {
    ticketItems = JSON.parse(stored) as TicketItem[];
  } catch {
    window.localStorage.removeItem(TICKET_STORAGE_KEY);
  }
}

function persistAndNotify() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(TICKET_STORAGE_KEY, JSON.stringify(ticketItems));
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  loadFromStorageOnce();
  return ticketItems;
}

function getServerSnapshot(): TicketItem[] {
  return [];
}

export function addItem(item: Omit<TicketItem, "ticketItemId">) {
  ticketItems = [...ticketItems, { ...item, ticketItemId: crypto.randomUUID() }];
  persistAndNotify();
}

export function removeItem(ticketItemId: string) {
  ticketItems = ticketItems.filter((item) => item.ticketItemId !== ticketItemId);
  persistAndNotify();
}

export function updateQuantity(ticketItemId: string, quantity: number) {
  if (quantity <= 0) {
    removeItem(ticketItemId);
    return;
  }
  ticketItems = ticketItems.map((item) =>
    item.ticketItemId === ticketItemId ? { ...item, quantity } : item,
  );
  persistAndNotify();
}

export function clearTicket() {
  ticketItems = [];
  persistAndNotify();
}

export function computeItemTotal(item: TicketItem): number {
  const modifiersTotal = item.modifiers.reduce((sum, m) => sum + m.priceDelta, 0);
  return roundMoney((item.unitPrice + modifiersTotal) * item.quantity);
}

export function useOrderTicket() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const subtotal = roundMoney(items.reduce((sum, item) => sum + computeItemTotal(item), 0));

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clear: clearTicket,
    itemTotal: computeItemTotal,
    subtotal,
  };
}
