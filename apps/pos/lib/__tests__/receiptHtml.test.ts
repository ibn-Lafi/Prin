import { test } from "node:test";
import assert from "node:assert/strict";
import type { KitchenPrintPayload, CustomerPrintPayload } from "@brin/utils";
import { renderKitchenTicketHtml, renderCustomerReceiptHtml, renderTestTicketHtml } from "../receiptHtml";

const kitchenPayload: KitchenPrintPayload = {
  dailyOrderNumber: 7,
  orderDate: "2026-08-05",
  channel: "pos",
  notes: "بدون بصل",
  items: [{ name: "برجر", quantity: 2, notes: null, modifiers: ["إضافي جبنة"] }],
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
  discountAmount: 5,
  redeemedRewardName: "خصم ولاء",
  codeDiscountAmount: 0,
  discountCode: null,
  taxRate: 15,
  taxAmount: 3.75,
  total: 28.75,
  zatcaQrBase64: "VEVTVA==",
};

test("renderKitchenTicketHtml embeds order number, item, notes, no prices", () => {
  const html = renderKitchenTicketHtml(kitchenPayload);
  assert.match(html, /<!doctype html>/);
  assert.ok(html.includes("طلب #7"));
  assert.ok(html.includes("برجر"));
  assert.ok(html.includes("إضافي جبنة"));
  assert.ok(html.includes("بدون بصل"));
  assert.ok(!html.includes("ريال")); // بدون أسعار بفاتورة المطبخ
});

test("renderCustomerReceiptHtml embeds prices, discount, total, and a QR image", async () => {
  const html = await renderCustomerReceiptHtml(customerPayload);
  assert.ok(html.includes("BRIN"));
  assert.ok(html.includes("طلب #7"));
  assert.ok(html.includes("خصم ولاء"));
  assert.ok(html.includes("28.75 ريال"));
  assert.match(html, /<img class="qr" src="data:image\/png;base64,/);
});

test("HTML output escapes special characters in free-text fields", () => {
  const html = renderKitchenTicketHtml({
    ...kitchenPayload,
    notes: '<script>alert("x")</script>',
  });
  assert.ok(!html.includes("<script>alert"));
  assert.ok(html.includes("&lt;script&gt;"));
});

test("renderTestTicketHtml produces a well-formed document with a QR image", async () => {
  const html = await renderTestTicketHtml();
  assert.match(html, /<!doctype html>/);
  assert.ok(html.includes("طباعة تجريبية"));
  assert.match(html, /<img class="qr" src="data:image\/png;base64,/);
});
