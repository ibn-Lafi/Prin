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
  name: string;
  description: string | null;
  points_cost: number;
  discount_amount: number;
  image_url: string | null;
  is_active: boolean;
};

export type RestaurantSettings = {
  restaurant_name: string;
  vat_number: string | null;
  tax_rate_percent: number;
  opening_time: string;
  closing_time: string;
  is_accepting_orders: boolean;
  kitchen_printer_interface: string | null;
  customer_printer_interface: string | null;
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
