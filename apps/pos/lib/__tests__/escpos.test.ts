import { test } from "node:test";
import assert from "node:assert/strict";
import type { KitchenPrintPayload, CustomerPrintPayload } from "@brin/utils";
import { renderKitchenTicket, renderCustomerReceipt, renderTestTicket } from "../escpos";

const ESC = 0x1b;
const GS = 0x1d;

const CODEPAGE_SELECT = [ESC, 0x74, 0x25];
const CUT_SEQUENCE = [ESC, 0x64, 0x04, ESC, 0x64, 0x04, GS, 0x56, 0x00, ESC, 0x40];

function startsWith(bytes: Uint8Array, prefix: number[]): boolean {
  return prefix.every((b, i) => bytes[i] === b);
}

function endsWith(bytes: Uint8Array, suffix: number[]): boolean {
  const offset = bytes.length - suffix.length;
  if (offset < 0) return false;
  return suffix.every((b, i) => bytes[offset + i] === b);
}

function includesSubsequence(bytes: Uint8Array, needle: number[]): boolean {
  outer: for (let i = 0; i <= bytes.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (bytes[i + j] !== needle[j]) continue outer;
    }
    return true;
  }
  return false;
}

const kitchenPayload: KitchenPrintPayload = {
  dailyOrderNumber: 7,
  orderDate: "2026-08-05",
  channel: "pos",
  notes: null,
  items: [{ name: "برجر", quantity: 2, notes: null, modifiers: [] }],
};

const customerPayload: CustomerPrintPayload = {
  restaurantName: "BRIN",
  vatNumber: "300000000000003",
  dailyOrderNumber: 7,
  orderDate: "2026-08-05",
  createdAt: "2026-08-05T12:00:00Z",
  customerName: null,
  customerPhone: null,
  items: [{ name: "برجر", quantity: 2, unitPrice: 15, notes: null, modifiers: [] }],
  subtotal: 30,
  discountAmount: 0,
  redeemedRewardName: null,
  codeDiscountAmount: 0,
  discountCode: null,
  taxRate: 15,
  taxAmount: 4.5,
  total: 34.5,
  zatcaQrBase64: "VEVTVA==", // base64("TEST")
};

test("renderKitchenTicket starts with CP864 select + center + double-height + bold, ends with cut", () => {
  const bytes = renderKitchenTicket(kitchenPayload);
  assert.ok(startsWith(bytes, [...CODEPAGE_SELECT, ESC, 0x61, 0x01, ESC, 0x21, 0x10, ESC, 0x45, 0x01]));
  assert.ok(endsWith(bytes, CUT_SEQUENCE));
});

test("renderCustomerReceipt embeds the ZATCA QR byte block and ends with cut", () => {
  const bytes = renderCustomerReceipt(customerPayload);
  assert.ok(startsWith(bytes, CODEPAGE_SELECT));
  assert.ok(endsWith(bytes, CUT_SEQUENCE));

  // طول البيانات المخزّنة = 8 (طول السلسلة "VEVTVA==" نفسها، وهي المطبوعة
  // حرفياً داخل رمز QR، وليست طول النص الأصلي "TEST" قبل الترميز) + 3 = 11
  const qrStore = [GS, 0x28, 0x6b, 11, 0, 0x31, 0x50, 0x30, ...Buffer.from("VEVTVA==", "ascii")];
  assert.ok(includesSubsequence(bytes, qrStore));

  const qrModel2 = [GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00];
  assert.ok(includesSubsequence(bytes, qrModel2));

  const qrPrint = [GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30];
  assert.ok(includesSubsequence(bytes, qrPrint));
});

test("renderTestTicket produces a well-formed, non-empty byte sequence", () => {
  const bytes = renderTestTicket();
  assert.ok(bytes.length > 0);
  assert.ok(startsWith(bytes, CODEPAGE_SELECT));
  assert.ok(endsWith(bytes, CUT_SEQUENCE));
});
