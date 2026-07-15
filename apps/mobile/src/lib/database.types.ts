export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      market_categories: {
        Row: {
          active: boolean;
          color: string;
          description: string;
          icon: string;
          id: string;
          name: string;
          position: number;
        };
        Insert: {
          active?: boolean;
          color: string;
          description?: string;
          icon: string;
          id: string;
          name: string;
          position?: number;
        };
        Update: {
          active?: boolean;
          color?: string;
          description?: string;
          icon?: string;
          id?: string;
          name?: string;
          position?: number;
        };
        Relationships: [];
      };
      market_order_events: {
        Row: {
          actor_id: string | null;
          created_at: string;
          id: number;
          order_id: string;
          status: Database["public"]["Enums"]["market_order_status"];
        };
        Insert: {
          actor_id?: string | null;
          created_at?: string;
          id?: never;
          order_id: string;
          status: Database["public"]["Enums"]["market_order_status"];
        };
        Update: {
          actor_id?: string | null;
          created_at?: string;
          id?: never;
          order_id?: string;
          status?: Database["public"]["Enums"]["market_order_status"];
        };
        Relationships: [
          {
            foreignKeyName: "market_order_events_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "market_orders";
            referencedColumns: ["id"];
          },
        ];
      };
      market_order_items: {
        Row: {
          id: number;
          order_id: string;
          product_id: string;
          product_name: string;
          quantity: number;
          unit_price: number;
        };
        Insert: {
          id?: never;
          order_id: string;
          product_id: string;
          product_name: string;
          quantity: number;
          unit_price: number;
        };
        Update: {
          id?: never;
          order_id?: string;
          product_id?: string;
          product_name?: string;
          quantity?: number;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "market_order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "market_orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "market_order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "market_products";
            referencedColumns: ["id"];
          },
        ];
      };
      market_orders: {
        Row: {
          created_at: string;
          customer_id: string;
          delivery_address: string;
          id: string;
          status: Database["public"]["Enums"]["market_order_status"];
          store_id: string;
          total: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          customer_id: string;
          delivery_address: string;
          id?: string;
          status?: Database["public"]["Enums"]["market_order_status"];
          store_id: string;
          total: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          customer_id?: string;
          delivery_address?: string;
          id?: string;
          status?: Database["public"]["Enums"]["market_order_status"];
          store_id?: string;
          total?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "market_orders_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "market_stores";
            referencedColumns: ["id"];
          },
        ];
      };
      market_products: {
        Row: {
          available: boolean;
          created_at: string;
          description: string | null;
          id: string;
          image_url: string | null;
          name: string;
          price: number;
          stock: number;
          store_id: string;
          updated_at: string;
        };
        Insert: {
          available?: boolean;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          name: string;
          price: number;
          stock?: number;
          store_id: string;
          updated_at?: string;
        };
        Update: {
          available?: boolean;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          name?: string;
          price?: number;
          stock?: number;
          store_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "market_products_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "market_stores";
            referencedColumns: ["id"];
          },
        ];
      };
      market_profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          phone: string | null;
          role: Database["public"]["Enums"]["market_user_role"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          phone?: string | null;
          role?: Database["public"]["Enums"]["market_user_role"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          phone?: string | null;
          role?: Database["public"]["Enums"]["market_user_role"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      market_store_members: {
        Row: {
          created_at: string;
          role: Database["public"]["Enums"]["market_member_role"];
          store_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          role?: Database["public"]["Enums"]["market_member_role"];
          store_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          role?: Database["public"]["Enums"]["market_member_role"];
          store_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "market_store_members_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "market_stores";
            referencedColumns: ["id"];
          },
        ];
      };
      market_stores: {
        Row: {
          active: boolean;
          category_id: string;
          city: string;
          created_at: string;
          delivery_label: string | null;
          description: string;
          eta: string | null;
          featured: boolean;
          id: string;
          image_url: string | null;
          name: string;
          rating: number;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          category_id: string;
          city: string;
          created_at?: string;
          delivery_label?: string | null;
          description?: string;
          eta?: string | null;
          featured?: boolean;
          id?: string;
          image_url?: string | null;
          name: string;
          rating?: number;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          category_id?: string;
          city?: string;
          created_at?: string;
          delivery_label?: string | null;
          description?: string;
          eta?: string | null;
          featured?: boolean;
          id?: string;
          image_url?: string | null;
          name?: string;
          rating?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "market_stores_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "market_categories";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_order: {
        Args: { delivery_address: string; items: Json; target_store_id: string };
        Returns: string;
      };
      update_market_order_status: {
        Args: {
          next_status: Database["public"]["Enums"]["market_order_status"];
          target_order_id: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      market_member_role: "owner" | "manager" | "staff";
      market_order_status:
        "submitted" | "accepted" | "preparing" | "ready" | "completed" | "rejected" | "cancelled";
      market_user_role: "customer" | "merchant" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      market_member_role: ["owner", "manager", "staff"],
      market_order_status: [
        "submitted",
        "accepted",
        "preparing",
        "ready",
        "completed",
        "rejected",
        "cancelled",
      ],
      market_user_role: ["customer", "merchant", "admin"],
    },
  },
} as const;
