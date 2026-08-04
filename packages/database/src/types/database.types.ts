// يُولَّد هذا الملف من مخطط قاعدة البيانات — لا تعدّله يدوياً.
// لإعادة التوليد لاحقاً (من جهاز بدون قيود شبكة/Docker):
//   pnpm exec supabase gen types typescript --linked --schema public > packages/database/src/types/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      cash_closings: {
        Row: {
          id: string;
          closing_date: string;
          expected_cash: number;
          actual_cash: number;
          difference: number;
          closed_by_employee_id: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          closing_date: string;
          expected_cash: number;
          actual_cash: number;
          closed_by_employee_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          closing_date?: string;
          expected_cash?: number;
          actual_cash?: number;
          closed_by_employee_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          employee_id: string | null;
          action_type: string;
          description: string;
          related_order_id: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          employee_id?: string | null;
          action_type: string;
          description: string;
          related_order_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string | null;
          action_type?: string;
          description?: string;
          related_order_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          display_order: number;
          is_active: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          display_order?: number;
          is_active?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          display_order?: number;
          is_active?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      combo_items: {
        Row: {
          id: string;
          combo_id: string;
          product_id: string;
          quantity: number;
        };
        Insert: {
          id?: string;
          combo_id: string;
          product_id: string;
          quantity?: number;
        };
        Update: {
          id?: string;
          combo_id?: string;
          product_id?: string;
          quantity?: number;
        };
        Relationships: [];
      };
      combos: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          image_url: string | null;
          is_available: boolean;
          deleted_at: string | null;
          points_per_unit: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price: number;
          image_url?: string | null;
          is_available?: boolean;
          deleted_at?: string | null;
          points_per_unit?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          image_url?: string | null;
          is_available?: boolean;
          deleted_at?: string | null;
          points_per_unit?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          auth_user_id: string | null;
          full_name: string | null;
          phone: string;
          points_balance: number;
          registered_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          full_name?: string | null;
          phone: string;
          points_balance?: number;
          registered_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string | null;
          full_name?: string | null;
          phone?: string;
          points_balance?: number;
          registered_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      discount_codes: {
        Row: {
          id: string;
          code: string;
          discount_type: string;
          value: number;
          min_order_amount: number;
          valid_from: string | null;
          valid_until: string | null;
          max_uses: number | null;
          times_used: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          discount_type: string;
          value: number;
          min_order_amount?: number;
          valid_from?: string | null;
          valid_until?: string | null;
          max_uses?: number | null;
          times_used?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          discount_type?: string;
          value?: number;
          min_order_amount?: number;
          valid_from?: string | null;
          valid_until?: string | null;
          max_uses?: number | null;
          times_used?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      employees: {
        Row: {
          id: string;
          full_name: string;
          pin_hash: string;
          role: string;
          is_active: boolean;
          username: string | null;
          password_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          pin_hash: string;
          role: string;
          is_active?: boolean;
          username?: string | null;
          password_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          pin_hash?: string;
          role?: string;
          is_active?: boolean;
          username?: string | null;
          password_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      loyalty_points: {
        Row: {
          id: string;
          customer_id: string;
          points_change: number;
          reason: string;
          order_id: string | null;
          reward_id: string | null;
          created_by_employee_id: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          points_change: number;
          reason: string;
          order_id?: string | null;
          reward_id?: string | null;
          created_by_employee_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          points_change?: number;
          reason?: string;
          order_id?: string | null;
          reward_id?: string | null;
          created_by_employee_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      modifier_groups: {
        Row: {
          id: string;
          product_id: string | null;
          combo_id: string | null;
          name: string;
          is_required: boolean;
          min_select: number;
          max_select: number;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          combo_id?: string | null;
          name: string;
          is_required?: boolean;
          min_select?: number;
          max_select?: number;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          combo_id?: string | null;
          name?: string;
          is_required?: boolean;
          min_select?: number;
          max_select?: number;
          display_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      modifiers: {
        Row: {
          id: string;
          modifier_group_id: string;
          name: string;
          price_delta: number;
          is_available: boolean;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          modifier_group_id: string;
          name: string;
          price_delta?: number;
          is_available?: boolean;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          modifier_group_id?: string;
          name?: string;
          price_delta?: number;
          is_available?: boolean;
          display_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      order_daily_counters: {
        Row: {
          order_date: string;
          last_number: number;
        };
        Insert: {
          order_date: string;
          last_number?: number;
        };
        Update: {
          order_date?: string;
          last_number?: number;
        };
        Relationships: [];
      };
      order_item_modifiers: {
        Row: {
          id: string;
          order_item_id: string;
          modifier_id: string;
          price_delta: number;
        };
        Insert: {
          id?: string;
          order_item_id: string;
          modifier_id: string;
          price_delta?: number;
        };
        Update: {
          id?: string;
          order_item_id?: string;
          modifier_id?: string;
          price_delta?: number;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          combo_id: string | null;
          quantity: number;
          unit_price: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          combo_id?: string | null;
          quantity: number;
          unit_price: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          combo_id?: string | null;
          quantity?: number;
          unit_price?: number;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_date: string;
          daily_order_number: number;
          channel: string;
          status: string;
          subtotal: number;
          tax_amount: number;
          total: number;
          discount_amount: number;
          redeemed_reward_id: string | null;
          code_discount_amount: number;
          discount_code_id: string | null;
          customer_id: string | null;
          employee_id: string | null;
          cancelled_by_employee_id: string | null;
          cancellation_reason: string | null;
          cancelled_at: string | null;
          accepted_by_employee_id: string | null;
          accepted_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_date: string;
          daily_order_number: number;
          channel: string;
          status?: string;
          subtotal: number;
          tax_amount: number;
          total: number;
          discount_amount?: number;
          redeemed_reward_id?: string | null;
          code_discount_amount?: number;
          discount_code_id?: string | null;
          customer_id?: string | null;
          employee_id?: string | null;
          cancelled_by_employee_id?: string | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          accepted_by_employee_id?: string | null;
          accepted_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_date?: string;
          daily_order_number?: number;
          channel?: string;
          status?: string;
          subtotal?: number;
          tax_amount?: number;
          total?: number;
          discount_amount?: number;
          redeemed_reward_id?: string | null;
          code_discount_amount?: number;
          discount_code_id?: string | null;
          customer_id?: string | null;
          employee_id?: string | null;
          cancelled_by_employee_id?: string | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          accepted_by_employee_id?: string | null;
          accepted_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cashier_shifts: {
        Row: {
          id: string;
          employee_id: string;
          opened_at: string;
          closed_at: string | null;
        };
        Insert: {
          id?: string;
          employee_id: string;
          opened_at?: string;
          closed_at?: string | null;
        };
        Update: {
          id?: string;
          employee_id?: string;
          opened_at?: string;
          closed_at?: string | null;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          method: string;
          amount: number;
          status: string;
          moyasar_payment_id: string | null;
          refunded_amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          method: string;
          amount: number;
          status?: string;
          moyasar_payment_id?: string | null;
          refunded_amount?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          method?: string;
          amount?: number;
          status?: string;
          moyasar_payment_id?: string | null;
          refunded_amount?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      print_agent_status: {
        Row: {
          id: string;
          last_heartbeat_at: string | null;
          printer_connected: boolean;
          printer_interface: string | null;
          updated_at: string;
        };
        Insert: {
          id: string;
          last_heartbeat_at?: string | null;
          printer_connected?: boolean;
          printer_interface?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          last_heartbeat_at?: string | null;
          printer_connected?: boolean;
          printer_interface?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      print_jobs: {
        Row: {
          id: string;
          order_id: string;
          target: string;
          status: string;
          payload: Json;
          attempts: number;
          error_message: string | null;
          printed_at: string | null;
          station_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          target: string;
          status?: string;
          payload: Json;
          attempts?: number;
          error_message?: string | null;
          printed_at?: string | null;
          station_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          target?: string;
          status?: string;
          payload?: Json;
          attempts?: number;
          error_message?: string | null;
          printed_at?: string | null;
          station_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
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
          is_cart_suggestion: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          description?: string | null;
          calories?: number | null;
          price: number;
          image_url?: string | null;
          is_available?: boolean;
          deleted_at?: string | null;
          points_per_unit?: number;
          is_cart_suggestion?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          name?: string;
          description?: string | null;
          calories?: number | null;
          price?: number;
          image_url?: string | null;
          is_available?: boolean;
          deleted_at?: string | null;
          points_per_unit?: number;
          is_cart_suggestion?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      restaurant_settings: {
        Row: {
          id: number;
          restaurant_name: string;
          vat_number: string | null;
          tax_rate_percent: number;
          opening_time: string;
          closing_time: string;
          is_accepting_orders: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          restaurant_name?: string;
          vat_number?: string | null;
          tax_rate_percent?: number;
          opening_time?: string;
          closing_time?: string;
          is_accepting_orders?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          restaurant_name?: string;
          vat_number?: string | null;
          tax_rate_percent?: number;
          opening_time?: string;
          closing_time?: string;
          is_accepting_orders?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rewards: {
        Row: {
          id: string;
          name: string | null;
          description: string | null;
          points_cost: number;
          discount_amount: number;
          image_url: string | null;
          is_active: boolean;
          product_id: string | null;
          combo_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          description?: string | null;
          points_cost: number;
          discount_amount?: number;
          image_url?: string | null;
          is_active?: boolean;
          product_id?: string | null;
          combo_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          description?: string | null;
          points_cost?: number;
          discount_amount?: number;
          image_url?: string | null;
          is_active?: boolean;
          product_id?: string | null;
          combo_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      next_daily_order_number: {
        Args: { p_date: string };
        Returns: number;
      };
      create_pos_order: {
        Args: {
          p_employee_id: string;
          p_customer_phone: string | null;
          p_customer_name: string | null;
          p_items: Json;
          p_payments: Json;
          p_reward_id?: string | null;
          p_discount_code?: string | null;
        };
        Returns: {
          order_id: string;
          daily_order_number: number;
          order_date: string;
          total: number;
          discount_amount: number;
          code_discount_amount: number;
        }[];
      };
      create_online_order: {
        Args: {
          p_auth_user_id: string;
          p_items: Json;
          p_discount_code?: string | null;
          p_notes?: string | null;
          p_reward_id?: string | null;
        };
        Returns: {
          order_id: string;
          daily_order_number: number;
          order_date: string;
          total: number;
          discount_amount: number;
          code_discount_amount: number;
        }[];
      };
      collect_online_order_payment: {
        Args: {
          p_order_id: string;
          p_employee_id: string;
          p_payments: Json;
        };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
