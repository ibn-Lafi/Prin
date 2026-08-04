export type Branch = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  opening_time: string;
  closing_time: string;
  is_accepting_orders: boolean;
  is_active: boolean;
  display_order: number;
  latitude: number | null;
  longitude: number | null;
};

export type Employee = {
  id: string;
  full_name: string;
  role: string;
  is_active: boolean;
  username: string | null;
  created_at: string;
};

export type Reward = {
  id: string;
  name: string | null;
  description: string | null;
  points_cost: number;
  discount_amount: number;
  image_url: string | null;
  is_active: boolean;
  product_id: string | null;
  combo_id: string | null;
};

/** خيار ربط مكافأة بصنف أو وجبة حقيقية من المنيو — يُستخدم بدل إدخال اسم/صورة/قيمة خصم يدوياً. */
export type RewardLinkOption = {
  kind: "product" | "combo";
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
};

export type RestaurantSettings = {
  restaurant_name: string;
  vat_number: string | null;
  tax_rate_percent: number;
};

export type Category = {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
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
  points_per_unit: number;
};

export type ProductWithModifiers = Product & { modifier_groups: ModifierGroup[] };

export type Combo = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  deleted_at: string | null;
  points_per_unit: number;
};

export type ComboItem = {
  id: string;
  product_id: string;
  quantity: number;
};

export type ComboWithItems = Combo & { combo_items: ComboItem[]; modifier_groups: ModifierGroup[] };

export type DiscountCode = {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  value: number;
  min_order_amount: number;
  valid_from: string | null;
  valid_until: string | null;
  max_uses: number | null;
  times_used: number;
  is_active: boolean;
};

export type CashierShift = {
  id: string;
  employee_id: string;
  opened_at: string;
  closed_at: string | null;
};

export type ShiftTotals = {
  cash: number;
  cardTerminal: number;
  online: number;
  total: number;
};
