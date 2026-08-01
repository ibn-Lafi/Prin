export type Category = {
  id: string;
  name: string;
  display_order: number;
};

export type Modifier = {
  id: string;
  name: string;
  price_delta: number;
  is_available: boolean;
  display_order: number;
};

export type ModifierGroup = {
  id: string;
  name: string;
  is_required: boolean;
  min_select: number;
  max_select: number;
  display_order: number;
  modifiers: Modifier[];
};

export type Product = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  calories: number | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  deleted_at: string | null;
  modifier_groups: ModifierGroup[];
};

export type Combo = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  deleted_at: string | null;
  modifier_groups: ModifierGroup[];
};

export type Reward = {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  discount_amount: number;
  image_url: string | null;
};

export type DiscountCodePreview = {
  code: string;
  discountType: "percentage" | "fixed";
  value: number;
};

export type OrderSummary = {
  id: string;
  daily_order_number: number;
  order_date: string;
  channel: "pos" | "online";
  status: string;
  total: number;
  created_at: string;
};

export type OrderItemDetail = {
  id: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  modifiers: { modifierId: string; name: string; priceDelta: number }[];
};

export type OrderWithItems = OrderSummary & { items: OrderItemDetail[] };
