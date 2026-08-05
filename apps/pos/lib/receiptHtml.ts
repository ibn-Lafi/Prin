import QRCode from "qrcode";
import type { KitchenPrintPayload, CustomerPrintPayload } from "@brin/utils";

// طباعة عادية عبر المتصفح (window.print) على الطابعة المضبوطة أصلاً كطابعة
// نظام عادية بجهاز الكاشير — بدون أي تعريف خاص أو إقران USB، بنفس أسلوب أي
// برنامج آخر يطبع على نفس الجهاز. عرض الورق الحراري الشائع 80mm، ثابت هنا
// (لا يوجد إعداد لعرض مختلف حالياً).
const RECEIPT_STYLES = `
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 4mm;
    width: 80mm;
    font-family: "Segoe UI", Tahoma, Arial, sans-serif;
    font-size: 12px;
    color: #000;
    direction: rtl;
  }
  .center { text-align: center; }
  .right { text-align: right; }
  .bold { font-weight: 700; }
  .title { font-size: 18px; font-weight: 700; }
  .line { border-top: 1px dashed #000; margin: 6px 0; }
  .row { display: flex; justify-content: space-between; gap: 8px; }
  .muted { font-size: 11px; }
  .item { margin: 3px 0; }
  .modifier { font-size: 11px; padding-right: 10px; }
  img.qr { display: block; margin: 8px auto; width: 120px; height: 120px; }
`;

function wrap(bodyHtml: string): string {
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<style>${RECEIPT_STYLES}</style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function amount(value: number): string {
  return `${value.toFixed(2)} ريال`;
}

// فاتورة مختصرة للمطبخ: أصناف + كمية + ملاحظات فقط، بدون أي أسعار.
export function renderKitchenTicketHtml(payload: KitchenPrintPayload): string {
  const itemsHtml = payload.items
    .map((item) => {
      const modifiersHtml = item.modifiers.map((m) => `<div class="modifier">- ${escapeHtml(m)}</div>`).join("");
      const notesHtml = item.notes ? `<div class="modifier">ملاحظة: ${escapeHtml(item.notes)}</div>` : "";
      return `<div class="item bold">${item.quantity} × ${escapeHtml(item.name)}</div>${modifiersHtml}${notesHtml}`;
    })
    .join("");

  return wrap(`
    <div class="center title">طلب #${payload.dailyOrderNumber}</div>
    <div class="center">${payload.channel === "online" ? "طلب إلكتروني" : "طلب كاشير"}</div>
    <div class="line"></div>
    ${
      payload.notes
        ? `<div class="right bold">ملاحظات: ${escapeHtml(payload.notes)}</div><div class="line"></div>`
        : ""
    }
    <div class="right">${itemsHtml}</div>
    <div class="line"></div>
    <div class="center muted">${new Date(payload.orderDate).toLocaleDateString("ar-SA")}</div>
  `);
}

// فاتورة كاملة للعميل: أصناف + أسعار + ضريبة + إجمالي + رقم الطلب + QR متوافق مع ZATCA.
export async function renderCustomerReceiptHtml(payload: CustomerPrintPayload): Promise<string> {
  const qrDataUrl = await QRCode.toDataURL(payload.zatcaQrBase64, { margin: 1, width: 240 });

  const itemsHtml = payload.items
    .map((item) => {
      const modifiersHtml = item.modifiers
        .map((m) =>
          m.priceDelta !== 0
            ? `<div class="row modifier"><span>${amount(m.priceDelta * item.quantity)}</span><span>${escapeHtml(m.name)}</span></div>`
            : `<div class="modifier">${escapeHtml(m.name)}</div>`,
        )
        .join("");
      return `<div class="row item"><span>${amount(item.unitPrice * item.quantity)}</span><span>${item.quantity} × ${escapeHtml(item.name)}</span></div>${modifiersHtml}`;
    })
    .join("");

  return wrap(`
    <div class="center title">${escapeHtml(payload.restaurantName)}</div>
    ${payload.vatNumber ? `<div class="center">الرقم الضريبي: ${escapeHtml(payload.vatNumber)}</div>` : ""}
    <div class="center">طلب #${payload.dailyOrderNumber}</div>
    <div class="center muted">${new Date(payload.createdAt).toLocaleString("ar-SA")}</div>
    ${
      payload.customerName || payload.customerPhone
        ? `<div class="center muted">${[payload.customerName, payload.customerPhone]
            .filter((v): v is string => Boolean(v))
            .map(escapeHtml)
            .join(" — ")}</div>`
        : ""
    }
    <div class="line"></div>
    <div class="right">${itemsHtml}</div>
    <div class="line"></div>
    <div class="row"><span>${amount(payload.subtotal)}</span><span>المجموع الفرعي</span></div>
    ${
      payload.discountAmount > 0
        ? `<div class="row"><span>-${amount(payload.discountAmount)}</span><span>${payload.redeemedRewardName ? `خصم — ${escapeHtml(payload.redeemedRewardName)}` : "خصم"}</span></div>`
        : ""
    }
    ${
      payload.codeDiscountAmount > 0
        ? `<div class="row"><span>-${amount(payload.codeDiscountAmount)}</span><span>${payload.discountCode ? `خصم — كود ${escapeHtml(payload.discountCode)}` : "خصم كود"}</span></div>`
        : ""
    }
    <div class="row"><span>${amount(payload.taxAmount)}</span><span>الضريبة (${payload.taxRate}%)</span></div>
    <div class="row bold"><span>${amount(payload.total)}</span><span>الإجمالي</span></div>
    <div class="line"></div>
    <img class="qr" src="${qrDataUrl}" alt="QR" />
    <div class="center">شكراً لزيارتكم</div>
  `);
}

// فاتورة اختبار ثابتة — تفحص المسارات المستخدمة فعلياً (نص عربي، أرقام، QR)
// بضغطة واحدة من صفحة إعدادات الطباعة، بمعزل عن أي طلب حقيقي.
export async function renderTestTicketHtml(): Promise<string> {
  const qrDataUrl = await QRCode.toDataURL("TEST", { margin: 1, width: 240 });

  return wrap(`
    <div class="center title">BRIN</div>
    <div class="center">طباعة تجريبية</div>
    <div class="center muted">${new Date().toLocaleString("ar-SA")}</div>
    <div class="line"></div>
    <div class="row"><span>${amount(99.99)}</span><span>سطر اختباري بالأرقام والريال</span></div>
    <div class="line"></div>
    <img class="qr" src="${qrDataUrl}" alt="QR" />
    <div class="center">انتهت الطباعة التجريبية</div>
  `);
}
