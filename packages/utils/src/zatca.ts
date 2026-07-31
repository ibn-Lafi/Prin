// ترميز QR للفاتورة الضريبية المبسطة (ZATCA Phase 1) — TLV ثم Base64.
// المراجع الخمسة الإلزامية: اسم البائع، الرقم الضريبي، الطابع الزمني،
// إجمالي الفاتورة شامل الضريبة، مبلغ الضريبة.
function tlvField(tag: number, value: string): Buffer {
  const valueBuffer = Buffer.from(value, "utf-8");
  return Buffer.concat([Buffer.from([tag, valueBuffer.length]), valueBuffer]);
}

export function buildZatcaQrBase64(params: {
  sellerName: string;
  vatNumber: string;
  timestamp: string;
  totalWithVat: number;
  vatAmount: number;
}): string {
  const buffer = Buffer.concat([
    tlvField(1, params.sellerName),
    tlvField(2, params.vatNumber),
    tlvField(3, params.timestamp),
    tlvField(4, params.totalWithVat.toFixed(2)),
    tlvField(5, params.vatAmount.toFixed(2)),
  ]);
  return buffer.toString("base64");
}
