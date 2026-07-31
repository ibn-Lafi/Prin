import type { ThermalPrinter } from "node-thermal-printer";
import type { KitchenPrintPayload, CustomerPrintPayload } from "@brin/utils";

function amount(value: number): string {
  return `${value.toFixed(2)} ريال`;
}

// فاتورة مختصرة للمطبخ: أصناف + كمية + ملاحظات فقط، بدون أي أسعار (حسب المواصفة).
export function renderKitchenTicket(
  printer: ThermalPrinter,
  payload: KitchenPrintPayload,
): void {
  printer.alignCenter();
  printer.setTextDoubleHeight();
  printer.bold(true);
  printer.println(`طلب #${payload.dailyOrderNumber}`);
  printer.bold(false);
  printer.setTextNormal();
  printer.println(payload.channel === "online" ? "طلب إلكتروني" : "طلب كاشير");
  printer.drawLine();

  printer.alignRight();
  for (const item of payload.items) {
    printer.bold(true);
    printer.println(`${item.quantity} × ${item.name}`);
    printer.bold(false);
    for (const modifier of item.modifiers) {
      printer.println(`  - ${modifier}`);
    }
    if (item.notes) {
      printer.println(`  ملاحظة: ${item.notes}`);
    }
  }

  printer.drawLine();
  printer.alignCenter();
  printer.println(new Date(payload.orderDate).toLocaleDateString("ar-SA"));
  printer.cut();
}

// فاتورة كاملة للعميل: أصناف + أسعار + ضريبة + إجمالي + رقم الطلب + QR متوافق مع ZATCA.
export function renderCustomerReceipt(
  printer: ThermalPrinter,
  payload: CustomerPrintPayload,
): void {
  printer.alignCenter();
  printer.bold(true);
  printer.setTextDoubleHeight();
  printer.println(payload.restaurantName);
  printer.setTextNormal();
  printer.bold(false);
  if (payload.vatNumber) {
    printer.println(`الرقم الضريبي: ${payload.vatNumber}`);
  }
  printer.println(`طلب #${payload.dailyOrderNumber}`);
  printer.println(new Date(payload.createdAt).toLocaleString("ar-SA"));
  if (payload.customerName || payload.customerPhone) {
    printer.println([payload.customerName, payload.customerPhone].filter(Boolean).join(" — "));
  }
  printer.drawLine();

  printer.alignRight();
  for (const item of payload.items) {
    printer.leftRight(amount(item.unitPrice * item.quantity), `${item.quantity} × ${item.name}`);
    for (const modifier of item.modifiers) {
      if (modifier.priceDelta !== 0) {
        printer.leftRight(amount(modifier.priceDelta * item.quantity), `  ${modifier.name}`);
      } else {
        printer.println(`  ${modifier.name}`);
      }
    }
  }

  printer.drawLine();
  printer.leftRight(amount(payload.subtotal), "المجموع الفرعي");
  if (payload.discountAmount > 0) {
    printer.leftRight(
      `-${amount(payload.discountAmount)}`,
      payload.redeemedRewardName ? `خصم — ${payload.redeemedRewardName}` : "خصم",
    );
  }
  printer.leftRight(amount(payload.taxAmount), `الضريبة (${payload.taxRate}%)`);
  printer.bold(true);
  printer.leftRight(amount(payload.total), "الإجمالي");
  printer.bold(false);
  printer.drawLine();

  printer.alignCenter();
  printer.printQR(payload.zatcaQrBase64, { cellSize: 6, correction: "M", model: 2 });
  printer.println("شكراً لزيارتكم");
  printer.cut();
}
