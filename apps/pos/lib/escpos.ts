import type { KitchenPrintPayload, CustomerPrintPayload } from "@brin/utils";
import { encodeCp864 } from "./cp864";

const WIDTH = 42;

const ESC = 0x1b;
const GS = 0x1d;

// نسخة مطابقة لمنطق _fold بمكتبة node-thermal-printer (breakLine: WORD) —
// يلف النص عند عرض السطر، يحاول القطع بعد آخر مسافة بدل منتصف كلمة.
function wordWrap(text: string, lineSize: number): string[] {
  const lineArray: string[] = [];
  const lines = String(text).split("\n");

  for (const rawLine of lines) {
    let currentLine = rawLine;
    while (currentLine.length > lineSize) {
      let line = currentLine.substring(0, lineSize);
      const lastSpaceRgx = /\s(?!.*\s)/;
      const idx = line.search(lastSpaceRgx);
      let nextIdx = lineSize;
      if (idx > 0) {
        line = line.substring(0, idx);
        nextIdx = idx + 1;
      }
      lineArray.push(line);
      currentLine = currentLine.substring(nextIdx);
    }
    if (currentLine.length > 0) lineArray.push(currentLine);
  }

  return lineArray;
}

function amount(value: number): string {
  return `${value.toFixed(2)} ريال`;
}

// يبني تسلسل بايتات ESC/POS خاماً مباشرة (بدل الاعتماد على node-thermal-printer،
// غير قابل للتحزيم بالمتصفح) — منقول حرفياً (نفس ترتيب الاستدعاءات بالضبط) من
// print-agent/src/receipts.ts القديم، مع استبدال كل استدعاء ببناء البايتات
// المطابقة تماماً (راجع node_modules/node-thermal-printer للتحقق من الجدول).
class TicketBuilder {
  private bytes: number[] = [];

  constructor() {
    // اختيار ترميز CP864 صراحة ببداية كل تذكرة — كل تذكرة هنا بايتات مستقلة
    // كاملة (بلا حالة سابقة موروثة من الطابعة)، على عكس النظام القديم الذي
    // كان يعتمد على إعادة بث نفس البايتات عبر clear() قبل كل تذكرة.
    this.bytes.push(ESC, 0x74, 0x25);
  }

  private pushBytes(bytes: ArrayLike<number>): void {
    for (let i = 0; i < bytes.length; i++) this.bytes.push(bytes[i] ?? 0);
  }

  private text(str: string): void {
    this.pushBytes(encodeCp864(str));
  }

  alignCenter(): void {
    this.bytes.push(ESC, 0x61, 0x01);
  }

  alignRight(): void {
    this.bytes.push(ESC, 0x61, 0x02);
  }

  setTextNormal(): void {
    this.bytes.push(ESC, 0x21, 0x00);
  }

  setTextDoubleHeight(): void {
    this.bytes.push(ESC, 0x21, 0x10);
  }

  bold(enabled: boolean): void {
    this.bytes.push(ESC, 0x45, enabled ? 0x01 : 0x00);
  }

  private newLine(): void {
    this.bytes.push(0x0a);
  }

  println(text: string): void {
    const wrapped = wordWrap(text, WIDTH).join("\n");
    if (wrapped) this.text(wrapped);
    this.newLine();
  }

  drawLine(): void {
    this.text("-".repeat(WIDTH));
    this.newLine();
  }

  leftRight(left: string, right: string): void {
    this.text(left);
    const padding = WIDTH - left.length - right.length;
    if (padding > 0) this.text(" ".repeat(padding));
    this.text(right);
    this.newLine();
  }

  printQR(data: string, opts: { cellSize: number; correction: "L" | "M" | "Q" | "H"; model: 1 | 2 | 3 }): void {
    const modelByte = opts.model === 1 ? 0x31 : opts.model === 3 ? 0x33 : 0x32;
    this.bytes.push(GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, modelByte, 0x00);

    this.bytes.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, opts.cellSize);

    const correctionByte = { L: 0x30, M: 0x31, Q: 0x32, H: 0x33 }[opts.correction];
    this.bytes.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, correctionByte);

    const dataBytes = new TextEncoder().encode(data);
    const storeLength = dataBytes.length + 3;
    const lsb = storeLength % 256;
    const msb = Math.floor(storeLength / 256);
    this.bytes.push(GS, 0x28, 0x6b, lsb, msb, 0x31, 0x50, 0x30);
    this.pushBytes(dataBytes);

    this.bytes.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30);
  }

  cut(): void {
    this.bytes.push(ESC, 0x64, 0x04);
    this.bytes.push(ESC, 0x64, 0x04);
    this.bytes.push(GS, 0x56, 0x00);
    this.bytes.push(ESC, 0x40);
  }

  toBytes(): Uint8Array {
    return new Uint8Array(this.bytes);
  }
}

// فاتورة مختصرة للمطبخ: أصناف + كمية + ملاحظات فقط، بدون أي أسعار (حسب المواصفة).
export function renderKitchenTicket(payload: KitchenPrintPayload): Uint8Array {
  const t = new TicketBuilder();

  t.alignCenter();
  t.setTextDoubleHeight();
  t.bold(true);
  t.println(`طلب #${payload.dailyOrderNumber}`);
  t.bold(false);
  t.setTextNormal();
  t.println(payload.channel === "online" ? "طلب إلكتروني" : "طلب كاشير");
  t.drawLine();

  if (payload.notes) {
    t.alignRight();
    t.bold(true);
    t.println(`ملاحظات: ${payload.notes}`);
    t.bold(false);
    t.drawLine();
  }

  t.alignRight();
  for (const item of payload.items) {
    t.bold(true);
    t.println(`${item.quantity} × ${item.name}`);
    t.bold(false);
    for (const modifier of item.modifiers) {
      t.println(`  - ${modifier}`);
    }
    if (item.notes) {
      t.println(`  ملاحظة: ${item.notes}`);
    }
  }

  t.drawLine();
  t.alignCenter();
  t.println(new Date(payload.orderDate).toLocaleDateString("ar-SA"));
  t.cut();

  return t.toBytes();
}

// فاتورة كاملة للعميل: أصناف + أسعار + ضريبة + إجمالي + رقم الطلب + QR متوافق مع ZATCA.
export function renderCustomerReceipt(payload: CustomerPrintPayload): Uint8Array {
  const t = new TicketBuilder();

  t.alignCenter();
  t.bold(true);
  t.setTextDoubleHeight();
  t.println(payload.restaurantName);
  t.setTextNormal();
  t.bold(false);
  if (payload.vatNumber) {
    t.println(`الرقم الضريبي: ${payload.vatNumber}`);
  }
  t.println(`طلب #${payload.dailyOrderNumber}`);
  t.println(new Date(payload.createdAt).toLocaleString("ar-SA"));
  if (payload.customerName || payload.customerPhone) {
    t.println([payload.customerName, payload.customerPhone].filter(Boolean).join(" — "));
  }
  t.drawLine();

  t.alignRight();
  for (const item of payload.items) {
    t.leftRight(amount(item.unitPrice * item.quantity), `${item.quantity} × ${item.name}`);
    for (const modifier of item.modifiers) {
      if (modifier.priceDelta !== 0) {
        t.leftRight(amount(modifier.priceDelta * item.quantity), `  ${modifier.name}`);
      } else {
        t.println(`  ${modifier.name}`);
      }
    }
  }

  t.drawLine();
  t.leftRight(amount(payload.subtotal), "المجموع الفرعي");
  if (payload.discountAmount > 0) {
    t.leftRight(
      `-${amount(payload.discountAmount)}`,
      payload.redeemedRewardName ? `خصم — ${payload.redeemedRewardName}` : "خصم",
    );
  }
  if (payload.codeDiscountAmount > 0) {
    t.leftRight(
      `-${amount(payload.codeDiscountAmount)}`,
      payload.discountCode ? `خصم — كود ${payload.discountCode}` : "خصم كود",
    );
  }
  t.leftRight(amount(payload.taxAmount), `الضريبة (${payload.taxRate}%)`);
  t.bold(true);
  t.leftRight(amount(payload.total), "الإجمالي");
  t.bold(false);
  t.drawLine();

  t.alignCenter();
  t.printQR(payload.zatcaQrBase64, { cellSize: 6, correction: "M", model: 2 });
  t.println("شكراً لزيارتكم");
  t.cut();

  return t.toBytes();
}

// فاتورة اختبار ثابتة — تفحص كل مسارات ESC/POS المستخدمة فعلياً (نص عربي،
// أرقام، QR) بضغطة واحدة من صفحة إعدادات الطباعة، بمعزل عن أي طلب حقيقي.
export function renderTestTicket(): Uint8Array {
  const t = new TicketBuilder();

  t.alignCenter();
  t.bold(true);
  t.setTextDoubleHeight();
  t.println("BRIN");
  t.setTextNormal();
  t.bold(false);
  t.println("طباعة تجريبية");
  t.println(new Date().toLocaleString("ar-SA"));
  t.drawLine();

  t.alignRight();
  t.leftRight(amount(99.99), "سطر اختباري بالأرقام والريال");
  t.drawLine();

  t.alignCenter();
  t.printQR(btoa("TEST"), { cellSize: 6, correction: "M", model: 2 });
  t.println("انتهت الطباعة التجريبية");
  t.cut();

  return t.toBytes();
}
