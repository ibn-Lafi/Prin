import type { Json } from "@brin/database";
import { buildZatcaQrBase64 } from "@brin/utils/server";
import type { KitchenPrintPayload, CustomerPrintPayload } from "@brin/utils";
import { createSupabaseServiceRoleClient } from "@/lib/supabaseClient";

type OrderForPrint = {
  id: string;
  branch_id: string;
  order_date: string;
  daily_order_number: number;
  channel: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  discount_amount: number;
  code_discount_amount: number;
  created_at: string;
  notes: string | null;
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

// يعيد جلب الطلب كاملاً من قاعدة البيانات دائماً (مو من حالة الواجهة) نفس
// مبدأ create_pos_order: لا نثق بأي بيانات وصلت من المتصفح لشيء يُطبع فعلياً
// على فاتورة ضريبية. يُستخدم من طباعة الكاشير (الجلستين معاً) وطباعة إيصال
// المنيو الإلكتروني عند تحصيل الدفع (إيصال العميل فقط).
async function buildPrintPayloads(
  orderId: string,
): Promise<
  { kitchenPayload: KitchenPrintPayload; customerPayload: CustomerPrintPayload; branchId: string } | null
> {
  const supabase = createSupabaseServiceRoleClient();

  const [{ data: rawOrder, error: orderError }, { data: settings }] = await Promise.all([
    supabase
      .from("orders")
      .select(
        `id, branch_id, order_date, daily_order_number, channel, subtotal, tax_amount, total, discount_amount, code_discount_amount, created_at, notes,
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
  if (orderError || !order) return null;

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
    notes: order.notes,
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

  return { kitchenPayload, customerPayload, branchId: order.branch_id };
}

export type QueuedPrintJob<T> = { id: string; payload: T };

// يُدرج إشعاراً خفيفاً لكل مهمة طباعة (بدون أي بيانات حساسة، فقط "توجد مهمة
// طباعة جديدة لهذا الفرع") — يسمح لأي تبويب كاشير مفتوح بنفس الفرع بالاشتراك
// اللحظي عبره ثم جلب المحتوى الفعلي عبر Server Action محمية بجلسة موظف. مفيد
// حتى للمهام التي يطبعها التبويب المنشئ لها فوراً بنفسه — شبكة أمان إضافية
// لو فشلت طباعتها الفورية وتحرّرت لاحقاً (راجع markFailedAction).
async function notifyPrintJobs(
  jobs: { id: string; branch_id: string; target: string }[],
): Promise<void> {
  if (jobs.length === 0) return;
  const supabase = createSupabaseServiceRoleClient();
  await supabase.from("print_job_notifications").insert(
    jobs.map((job) => ({ print_job_id: job.id, branch_id: job.branch_id, target: job.target })),
  );
}

// يبني ويُدرج مهمتي طباعة (مطبخ + عميل) بعد نجاح إنشاء/استلام أي طلب —
// stationId (معرّف جهاز الكاشير المحلي، يُولَّد تلقائياً بالمتصفح) يحدد أي
// تبويب يلتقط المهمتين — بدونه تبقيان بدون جهاز مستهدف (تُلتقطان عبر
// الاشتراك اللحظي من أي تبويب بنفس الفرع)، وbranch_id يقيّدهما لفرع الطلب
// نفسه دائماً، فما تُطبَعان بالغلط على طابعة فرع ثاني (راجع migration 0042).
// يُرجع الحمولتين الجاهزتين للطباعة الفورية بنفس التبويب المستدعي، بلا أي
// جولة realtime — الاشتراك اللحظي يبقى فقط لمهام لا يصاحبها تبويب كاشير
// وقت إدراجها (طلبات المنيو الإلكتروني).
export async function queueOrderPrintJobs(
  orderId: string,
  stationId: string | null,
): Promise<{ kitchen: QueuedPrintJob<KitchenPrintPayload>; customer: QueuedPrintJob<CustomerPrintPayload> } | null> {
  const payloads = await buildPrintPayloads(orderId);
  if (!payloads) return null;

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("print_jobs")
    .insert([
      {
        order_id: orderId,
        branch_id: payloads.branchId,
        target: "kitchen",
        payload: payloads.kitchenPayload as unknown as Json,
        station_id: stationId,
      },
      {
        order_id: orderId,
        branch_id: payloads.branchId,
        target: "customer",
        payload: payloads.customerPayload as unknown as Json,
        station_id: stationId,
      },
    ])
    .select("id, target, branch_id");

  if (error || !data) return null;

  await notifyPrintJobs(data);

  const kitchenRow = data.find((row) => row.target === "kitchen");
  const customerRow = data.find((row) => row.target === "customer");
  if (!kitchenRow || !customerRow) return null;

  return {
    kitchen: { id: kitchenRow.id, payload: payloads.kitchenPayload },
    customer: { id: customerRow.id, payload: payloads.customerPayload },
  };
}

// يُستخدم فقط عند تحصيل دفع طلب إلكتروني (pay-at-cashier) بالكاشير — مهمة
// طباعة المطبخ سبق وطُبعت فوراً وقت إنشاء الطلب بالمنيو الإلكتروني (بدون
// جهاز محدد)، فهنا نطبع إيصال العميل فقط، على جهاز الكاشير اللي حصّل الدفع.
export async function queueOnlineOrderCustomerReceipt(
  orderId: string,
  stationId: string | null,
): Promise<QueuedPrintJob<CustomerPrintPayload> | null> {
  const payloads = await buildPrintPayloads(orderId);
  if (!payloads) return null;

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("print_jobs")
    .insert({
      order_id: orderId,
      branch_id: payloads.branchId,
      target: "customer",
      payload: payloads.customerPayload as unknown as Json,
      station_id: stationId,
    })
    .select("id, target, branch_id")
    .single();

  if (error || !data) return null;

  await notifyPrintJobs([data]);

  return { id: data.id, payload: payloads.customerPayload };
}
