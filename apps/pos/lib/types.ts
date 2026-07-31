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
};

export type IncomingOrder = {
  id: string;
  dailyOrderNumber: number;
  total: number;
  customerName: string | null;
  customerPhone: string | null;
  items: { id: string; name: string; quantity: number; modifiers: string[] }[];
};

export type PrintJobStatus = {
  target: "kitchen" | "customer";
  status: "pending" | "printed" | "failed";
};

export type PrintAgentStatus = {
  lastHeartbeatAt: string | null;
  kitchenPrinterConnected: boolean;
  customerPrinterConnected: boolean;
};

export type CustomerLookup = {
  id: string;
  fullName: string | null;
  pointsBalance: number;
};

export type Reward = {
  id: string;
  name: string;
  description: string | null;
  pointsCost: number;
  discountAmount: number;
};
