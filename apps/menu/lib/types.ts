export type Branch = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  opening_time: string;
  closing_time: string;
  is_accepting_orders: boolean;
};

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

// ربط سياقي: هذا الصنف يظهر كاقتراح إضافة سريعة بالسلة فقط لو صنف
// "triggerProductId" فعلاً مضاف بالسلة حالياً — يحدده الإدمن لكل صنف.
export type CartSuggestionLink = {
  triggerProductId: string;
  product: Product;
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
  // المكافآت المربوطة بصنف/وجبة حقيقية (بدل خصم نقدي عام) يمكن استبدالها لوحدها —
  // الصنف/الوجبة نفسها تُضاف للسلة تلقائياً وقت الاستبدال، راجع MenuBrowser.tsx.
  linkedItem: { kind: "product" | "combo"; refId: string } | null;
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
  kind: "product" | "combo";
  refId: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  modifiers: { modifierId: string; name: string; priceDelta: number }[];
};

export type OrderWithItems = OrderSummary & { items: OrderItemDetail[] };
