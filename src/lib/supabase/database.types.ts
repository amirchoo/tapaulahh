export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      business_categories: {
        Row: {
          icon: string | null;
          id: string;
          name_en: string;
          name_ms: string;
          slug: string;
          sort_order: number;
        };
        Insert: {
          icon?: string | null;
          id?: string;
          name_en: string;
          name_ms: string;
          slug: string;
          sort_order?: number;
        };
        Update: {
          icon?: string | null;
          id?: string;
          name_en?: string;
          name_ms?: string;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      catalog_items: {
        Row: {
          business_id: string;
          created_at: string;
          description: string | null;
          id: string;
          is_available: boolean;
          name: string;
          photo_url: string | null;
          price_rm: number | null;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_available?: boolean;
          name: string;
          photo_url?: string | null;
          price_rm?: number | null;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          is_available?: boolean;
          name?: string;
          photo_url?: string | null;
          price_rm?: number | null;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "catalog_items_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "home_businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      favourites: {
        Row: {
          created_at: string;
          target_id: string;
          target_type: Database["public"]["Enums"]["content_type"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          target_id: string;
          target_type: Database["public"]["Enums"]["content_type"];
          user_id?: string;
        };
        Update: {
          created_at?: string;
          target_id?: string;
          target_type?: Database["public"]["Enums"]["content_type"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favourites_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      home_business_locations: {
        Row: {
          address: string | null;
          business_id: string;
          location: unknown;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          business_id: string;
          location: unknown;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          business_id?: string;
          location?: unknown;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "home_business_locations_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: true;
            referencedRelation: "home_businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      home_businesses: {
        Row: {
          category_id: string | null;
          created_at: string;
          delivery_notes: string | null;
          description: string | null;
          district: string;
          hours: string | null;
          id: string;
          instagram: string | null;
          logo_url: string | null;
          name: string;
          owner_id: string;
          public_lat: number | null;
          public_lng: number | null;
          public_location: unknown;
          slug: string;
          state: string;
          status: Database["public"]["Enums"]["business_status"];
          updated_at: string;
          whatsapp: string | null;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string;
          delivery_notes?: string | null;
          description?: string | null;
          district: string;
          hours?: string | null;
          id?: string;
          instagram?: string | null;
          logo_url?: string | null;
          name: string;
          owner_id?: string;
          public_lat?: number | null;
          public_lng?: number | null;
          public_location?: unknown;
          slug: string;
          state?: string;
          status?: Database["public"]["Enums"]["business_status"];
          updated_at?: string;
          whatsapp?: string | null;
        };
        Update: {
          category_id?: string | null;
          created_at?: string;
          delivery_notes?: string | null;
          description?: string | null;
          district?: string;
          hours?: string | null;
          id?: string;
          instagram?: string | null;
          logo_url?: string | null;
          name?: string;
          owner_id?: string;
          public_lat?: number | null;
          public_lng?: number | null;
          public_location?: unknown;
          slug?: string;
          state?: string;
          status?: Database["public"]["Enums"]["business_status"];
          updated_at?: string;
          whatsapp?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "home_businesses_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "business_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "home_businesses_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      pasar_schedules: {
        Row: {
          day_of_week: number;
          end_time: string;
          id: string;
          pasar_id: string;
          start_time: string;
        };
        Insert: {
          day_of_week: number;
          end_time: string;
          id?: string;
          pasar_id: string;
          start_time: string;
        };
        Update: {
          day_of_week?: number;
          end_time?: string;
          id?: string;
          pasar_id?: string;
          start_time?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pasar_schedules_pasar_id_fkey";
            columns: ["pasar_id"];
            isOneToOne: false;
            referencedRelation: "pasars";
            referencedColumns: ["id"];
          },
        ];
      };
      pasars: {
        Row: {
          address: string | null;
          boundary: unknown;
          created_at: string;
          description: string | null;
          district: string;
          id: string;
          lat: number | null;
          lng: number | null;
          location: unknown;
          name: string;
          parking_notes: string | null;
          photos: string[];
          slug: string;
          state: string;
          status: Database["public"]["Enums"]["pasar_status"];
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          boundary?: unknown;
          created_at?: string;
          description?: string | null;
          district: string;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          location: unknown;
          name: string;
          parking_notes?: string | null;
          photos?: string[];
          slug: string;
          state?: string;
          status?: Database["public"]["Enums"]["pasar_status"];
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          boundary?: unknown;
          created_at?: string;
          description?: string | null;
          district?: string;
          id?: string;
          lat?: number | null;
          lng?: number | null;
          location?: unknown;
          name?: string;
          parking_notes?: string | null;
          photos?: string[];
          slug?: string;
          state?: string;
          status?: Database["public"]["Enums"]["pasar_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          role: Database["public"]["Enums"]["user_role"];
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          created_at: string;
          details: string | null;
          id: string;
          reason: string;
          reporter_id: string;
          resolved_at: string | null;
          resolved_by: string | null;
          status: Database["public"]["Enums"]["report_status"];
          target_id: string;
          target_type: Database["public"]["Enums"]["content_type"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          details?: string | null;
          id?: string;
          reason: string;
          reporter_id?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: Database["public"]["Enums"]["report_status"];
          target_id: string;
          target_type: Database["public"]["Enums"]["content_type"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          details?: string | null;
          id?: string;
          reason?: string;
          reporter_id?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: Database["public"]["Enums"]["report_status"];
          target_id?: string;
          target_type?: Database["public"]["Enums"]["content_type"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_resolved_by_fkey";
            columns: ["resolved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      vendor_categories: {
        Row: {
          icon: string | null;
          id: string;
          name_en: string;
          name_ms: string;
          slug: string;
          sort_order: number;
        };
        Insert: {
          icon?: string | null;
          id?: string;
          name_en: string;
          name_ms: string;
          slug: string;
          sort_order?: number;
        };
        Update: {
          icon?: string | null;
          id?: string;
          name_en?: string;
          name_ms?: string;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      vendor_claims: {
        Row: {
          created_at: string;
          id: string;
          message: string | null;
          status: Database["public"]["Enums"]["claim_status"];
          updated_at: string;
          user_id: string;
          vendor_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          message?: string | null;
          status?: Database["public"]["Enums"]["claim_status"];
          updated_at?: string;
          user_id?: string;
          vendor_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          message?: string | null;
          status?: Database["public"]["Enums"]["claim_status"];
          updated_at?: string;
          user_id?: string;
          vendor_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vendor_claims_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vendor_claims_vendor_id_fkey";
            columns: ["vendor_id"];
            isOneToOne: false;
            referencedRelation: "vendors";
            referencedColumns: ["id"];
          },
        ];
      };
      vendor_items: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          is_available: boolean;
          name: string;
          photo_url: string | null;
          price_rm: number | null;
          sort_order: number;
          updated_at: string;
          vendor_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_available?: boolean;
          name: string;
          photo_url?: string | null;
          price_rm?: number | null;
          sort_order?: number;
          updated_at?: string;
          vendor_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          is_available?: boolean;
          name?: string;
          photo_url?: string | null;
          price_rm?: number | null;
          sort_order?: number;
          updated_at?: string;
          vendor_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vendor_items_vendor_id_fkey";
            columns: ["vendor_id"];
            isOneToOne: false;
            referencedRelation: "vendors";
            referencedColumns: ["id"];
          },
        ];
      };
      vendors: {
        Row: {
          category_id: string | null;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          owner_id: string | null;
          pasar_id: string;
          photos: string[];
          position: unknown;
          price_range: string | null;
          slug: string;
          status: Database["public"]["Enums"]["vendor_status"];
          updated_at: string;
          usual_days: number[];
        };
        Insert: {
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          owner_id?: string | null;
          pasar_id: string;
          photos?: string[];
          position?: unknown;
          price_range?: string | null;
          slug: string;
          status?: Database["public"]["Enums"]["vendor_status"];
          updated_at?: string;
          usual_days?: number[];
        };
        Update: {
          category_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          owner_id?: string | null;
          pasar_id?: string;
          photos?: string[];
          position?: unknown;
          price_range?: string | null;
          slug?: string;
          status?: Database["public"]["Enums"]["vendor_status"];
          updated_at?: string;
          usual_days?: number[];
        };
        Relationships: [
          {
            foreignKeyName: "vendors_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "vendor_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vendors_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vendors_pasar_id_fkey";
            columns: ["pasar_id"];
            isOneToOne: false;
            referencedRelation: "pasars";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_edit_vendor: { Args: { p_vendor_id: string }; Returns: boolean };
      can_moderate: { Args: never; Returns: boolean };
      fuzz_location: {
        Args: { point: unknown; seed: string };
        Returns: unknown;
      };
      is_admin: { Args: never; Returns: boolean };
      owns_business: { Args: { business: string }; Returns: boolean };
      pasars_near: {
        Args: {
          day_of_week?: number;
          lat: number;
          lng: number;
          radius_m?: number;
        };
        Returns: {
          address: string;
          distance_m: number;
          district: string;
          id: string;
          latitude: number;
          longitude: number;
          name: string;
          schedules: Json;
          slug: string;
        }[];
      };
      search_all: {
        Args: { query: string };
        Returns: {
          context: string;
          id: string;
          kind: Database["public"]["Enums"]["content_type"];
          name: string;
          parent_slug: string;
          score: number;
          slug: string;
        }[];
      };
      set_pasar_schedules: {
        Args: { p_pasar_id: string; p_schedules: Json };
        Returns: undefined;
      };
    };
    Enums: {
      business_status: "pending" | "approved" | "rejected";
      claim_status: "pending" | "approved" | "rejected";
      content_type: "pasar" | "vendor" | "business";
      pasar_status: "active" | "inactive";
      report_status: "open" | "resolved";
      user_role: "user" | "admin";
      vendor_status: "pending" | "active" | "inactive";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
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
      business_status: ["pending", "approved", "rejected"],
      claim_status: ["pending", "approved", "rejected"],
      content_type: ["pasar", "vendor", "business"],
      pasar_status: ["active", "inactive"],
      report_status: ["open", "resolved"],
      user_role: ["user", "admin"],
      vendor_status: ["pending", "active", "inactive"],
    },
  },
} as const;
