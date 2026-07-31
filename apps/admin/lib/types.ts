export type Employee = {
  id: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

export type Reward = {
  id: string;
  name: string;
  description: string | null;
  points_cost: number;
  discount_amount: number;
  is_active: boolean;
};

export type RestaurantSettings = {
  restaurant_name: string;
  vat_number: string | null;
  tax_rate_percent: number;
  opening_time: string;
  closing_time: string;
  is_accepting_orders: boolean;
};
