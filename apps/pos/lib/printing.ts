import type { Json } from "@brin/database";
import { buildZatcaQrBase64 } from "@brin/utils/server";
import type { KitchenPrintPayload, CustomerPrintPayload } from "@brin/utils";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";

type OrderForPrint = {
  id: string;
  order_date: string;
  daily_order_number: number;
  channel: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  discount_amount: number;
  code_discount_amount: number;
  created_at: string;
  customers: { full_name: string | null; phone: string } | null;
  rewards: { name: string } | null;
  discount_codes: { code: string } | null;
  order_items: {
    id: string;
    quantity: number;
    unit_price: number;
    notes: string | null;
    products: { name: string } | null;
    combos: { name: string } | null;
    order_item_modifiers: { price_delta: number; modifiers: { name: string } | null }[];
  }[];
};

// يبني ويُدرج مهمتي طباعة (مطبخ + عميل) بعد نجاح إنشاء/استلام أي طلب — يُعاد جلب
// الطلب كاملاً من قاعدة البيانات دائماً (مو من حالة الواجهة) نفس مبدأ create_pos_order:
// لا نثق بأي بيانات وصلت من المتصفح لشيء يُطبع فعلياً على فاتورة ضريبية.
export async function queueOrderPrintJobs(orderId: string): Promise<void> {
  const supabase = createSupabaseServiceRoleClient();

  const [{ data: rawOrder, error: orderError }, { data: settings }] = await Promise.all([
    supabase
      .from("orders")
      .select(
        `id, order_date, daily_order_number, channel, subtotal, tax_amount, total, discount_amount, code_discount_amount, created_at,
         customers ( full_name, phone ),
         rewards ( name ),
         discount_codes ( code ),
         order_items ( id, quantity, unit_price, notes,
           products ( name ), combos ( name ),
           order_item_modifiers ( price_delta, modifiers ( name ) ) )`,
      )
      .eq("id", orderId)
      .maybeSingle(),
    supabase.from("restaurant_settings").select("restaurant_name, vat_number, tax_rate_percent").eq("id", 1).maybeSingle(),
  ]);

  const order = rawOrder as unknown as OrderForPrint | null;
  if (orderError || !order) return;

  const items = order.order_items.map((item) => ({
    name: item.products?.name ?? item.combos?.name ?? "صنف",
    quantity: item.quantity,
    unitPrice: item.unit_price,
    notes: item.notes,
    modifiers: item.order_item_modifiers
      .map((m) => ({ name: m.modifiers?.name ?? "", priceDelta: m.price_delta }))
      .filter((m) => m.name.length > 0),
  }));

  const kitchenPayload: KitchenPrintPayload = {
    dailyOrderNumber: order.daily_order_number,
    orderDate: order.order_date,
    channel: order.channel,
    items: items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      notes: item.notes,
      modifiers: item.modifiers.map((m) => m.name),
    })),
  };

  const sellerName = settings?.restaurant_name ?? "BRIN";
  const vatNumber = settings?.vat_number ?? "";

  const zatcaQrBase64 = buildZatcaQrBase64({
    sellerName,
    vatNumber,
    timestamp: order.created_at,
    totalWithVat: order.total,
    vatAmount: order.tax_amount,
  });

  const customerPayload: CustomerPrintPayload = {
    restaurantName: sellerName,
    vatNumber,
    dailyOrderNumber: order.daily_order_number,
    orderDate: order.order_date,
    createdAt: order.created_at,
    customerName: order.customers?.full_name ?? null,
    customerPhone: order.customers?.phone ?? null,
    items,
    subtotal: order.subtotal + order.discount_amount + order.code_discount_amount,
    discountAmount: order.discount_amount,
    redeemedRewardName: order.rewards?.name ?? null,
    codeDiscountAmount: order.code_discount_amount,
    discountCode: order.discount_codes?.code ?? null,
    taxRate: settings?.tax_rate_percent ?? 15,
    taxAmount: order.tax_amount,
    total: order.total,
    zatcaQrBase64,
  };

  await supabase.from("print_jobs").insert([
    { order_id: order.id, target: "kitchen", payload: kitchenPayload as unknown as Json },
    { order_id: order.id, target: "customer", payload: customerPayload as unknown as Json },
  ]);
}
