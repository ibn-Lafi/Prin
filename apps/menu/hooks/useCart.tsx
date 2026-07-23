"use client";

import { useSyncExternalStore } from "react";
import { roundMoney } from "@brin/utils";

const CART_STORAGE_KEY = "brin-menu-cart";

export type CartModifier = {
  modifierId: string;
  name: string;
  priceDelta: number;
};

export type CartItem = {
  cartItemId: string;
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  modifiers: CartModifier[];
  notes?: string;
};

let cartItems: CartItem[] = [];
let isLoadedFromStorage = false;
const listeners = new Set<() => void>();

function loadFromStorageOnce() {
  if (isLoadedFromStorage || typeof window === "undefined") return;
  isLoadedFromStorage = true;
  const stored = window.localStorage.getItem(CART_STORAGE_KEY);
  if (!stored) return;
  try {
    cartItems = JSON.parse(stored) as CartItem[];
  } catch {
    window.localStorage.removeItem(CART_STORAGE_KEY);
  }
}

function persistAndNotify() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  loadFromStorageOnce();
  return cartItems;
}

function getServerSnapshot(): CartItem[] {
  return [];
}

export function addItem(item: Omit<CartItem, "cartItemId">) {
  cartItems = [...cartItems, { ...item, cartItemId: crypto.randomUUID() }];
  persistAndNotify();
}

export function removeItem(cartItemId: string) {
  cartItems = cartItems.filter((item) => item.cartItemId !== cartItemId);
  persistAndNotify();
}

export function updateQuantity(cartItemId: string, quantity: number) {
  if (quantity <= 0) {
    removeItem(cartItemId);
    return;
  }
  cartItems = cartItems.map((item) =>
    item.cartItemId === cartItemId ? { ...item, quantity } : item,
  );
  persistAndNotify();
}

export function clearCart() {
  cartItems = [];
  persistAndNotify();
}

export function computeItemTotal(item: CartItem): number {
  const modifiersTotal = item.modifiers.reduce((sum, m) => sum + m.priceDelta, 0);
  return roundMoney((item.unitPrice + modifiersTotal) * item.quantity);
}

export function useCart() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const subtotal = roundMoney(items.reduce((sum, item) => sum + computeItemTotal(item), 0));

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clear: clearCart,
    itemTotal: computeItemTotal,
    subtotal,
  };
}
