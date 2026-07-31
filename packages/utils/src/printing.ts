// شكل حمولة (payload) مهام الطباعة — يُنتجها apps/pos عند إنشاء/استلام الطلب،
// ويستهلكها print-agent عند الطباعة الفعلية. مشترك بينهما لضمان تطابق الشكل.
export type KitchenPrintItem = {
  name: string;
  quantity: number;
  notes: string | null;
  modifiers: string[];
};

export type KitchenPrintPayload = {
  dailyOrderNumber: number;
  orderDate: string;
  channel: string;
  items: KitchenPrintItem[];
};

export type CustomerPrintItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  notes: string | null;
  modifiers: { name: string; priceDelta: number }[];
};

export type CustomerPrintPayload = {
  restaurantName: string;
  vatNumber: string;
  dailyOrderNumber: number;
  orderDate: string;
  createdAt: string;
  customerName: string | null;
  customerPhone: string | null;
  items: CustomerPrintItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  zatcaQrBase64: string;
};
