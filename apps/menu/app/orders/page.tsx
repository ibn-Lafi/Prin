import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import type { OrderWithItems } from "@/lib/types";
import { OrdersView } from "@/components/OrdersView";

type OrderRow = {
  id: string;
  daily_order_number: number;
  order_date: string;
  channel: "pos" | "online";
  status: string;
  total: number;
  created_at: string;
  order_items: {
    id: string;
    product_id: string | null;
    combo_id: string | null;
    quantity: number;
    unit_price: number;
    products: { name: string; image_url: string | null } | null;
    combos: { name: string; image_url: string | null } | null;
    order_item_modifiers: { modifier_id: string; price_delta: number; modifiers: { name: string } | null }[];
  }[];
};

export default async function OrdersPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/orders");
  }

  const { data: rawOrders } = await supabase
    .from("orders")
    .select(
      `id, daily_order_number, order_date, channel, status, total, created_at,
       order_items ( id, product_id, combo_id, quantity, unit_price,
         products ( name, image_url ), combos ( name, image_url ),
         order_item_modifiers ( modifier_id, price_delta, modifiers ( name ) ) )`,
    )
    .order("created_at", { ascending: false });

  const orders: OrderWithItems[] = ((rawOrders ?? []) as unknown as OrderRow[]).map((order) => ({
    id: order.id,
    daily_order_number: order.daily_order_number,
    order_date: order.order_date,
    channel: order.channel,
    status: order.status,
    total: order.total,
    created_at: order.created_at,
    items: order.order_items.map((item) => ({
      id: item.id,
      kind: item.product_id ? ("product" as const) : ("combo" as const),
      refId: item.product_id ?? item.combo_id ?? "",
      name: item.products?.name ?? item.combos?.name ?? "صنف",
      imageUrl: item.products?.image_url ?? item.combos?.image_url ?? null,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      modifiers: item.order_item_modifiers
        .filter((m) => m.modifiers?.name)
        .map((m) => ({ modifierId: m.modifier_id, name: m.modifiers!.name, priceDelta: m.price_delta })),
    })),
  }));

  return <OrdersView orders={orders} />;
}
