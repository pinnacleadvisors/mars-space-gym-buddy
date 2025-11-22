export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      check_ins: {
        Row: {
          check_in_time: string
          check_out_time: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          location: string | null
          user_id: string
        }
        Insert: {
          check_in_time?: string
          check_out_time?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          location?: string | null
          user_id: string
        }
        Update: {
          check_in_time?: string
          check_out_time?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          location?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_bookings: {
        Row: {
          class_id: string
          created_at: string | null
          id: string
          status: string | null
          user_id: string
        }
        Insert: {
          class_id: string
          created_at?: string | null
          id?: string
          status?: string | null
          user_id: string
        }
        Update: {
          class_id?: string
          created_at?: string | null
          id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_bookings_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_sessions: {
        Row: {
          capacity: number | null
          class_id: string | null
          created_at: string | null
          end_time: string
          id: string
          instructor: string | null
          name: string
          start_time: string
        }
        Insert: {
          capacity?: number | null
          class_id?: string | null
          created_at?: string | null
          end_time: string
          id?: string
          instructor?: string | null
          name: string
          start_time: string
        }
        Update: {
          capacity?: number | null
          class_id?: string | null
          created_at?: string | null
          end_time?: string
          id?: string
          instructor?: string | null
          name?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          capacity: number
          category: string | null
          created_at: string | null
          description: string | null
          duration: number
          id: string
          image_url: string | null
          instructor: string
          is_active: boolean | null
          name: string
          schedule: string
          updated_at: string | null
        }
        Insert: {
          capacity?: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration: number
          id?: string
          image_url?: string | null
          instructor: string
          is_active?: boolean | null
          name: string
          schedule: string
          updated_at?: string | null
        }
        Update: {
          capacity?: number
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number
          id?: string
          image_url?: string | null
          instructor?: string
          is_active?: boolean | null
          name?: string
          schedule?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      coupon_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          type: Database["public"]["Enums"]["coupon_type"]
          updated_at: string | null
          usage_limit: number | null
          valid_from: string | null
          valid_until: string | null
          value: number
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          type: Database["public"]["Enums"]["coupon_type"]
          updated_at?: string | null
          usage_limit?: number | null
          valid_from?: string | null
          valid_until?: string | null
          value: number
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          type?: Database["public"]["Enums"]["coupon_type"]
          updated_at?: string | null
          usage_limit?: number | null
          valid_from?: string | null
          valid_until?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupon_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_usage: {
        Row: {
          coupon_id: string
          created_at: string | null
          id: string
          order_id: string | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          coupon_id: string
          created_at?: string | null
          id?: string
          order_id?: string | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          coupon_id?: string
          created_at?: string | null
          id?: string
          order_id?: string | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupon_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          access_level: string | null
          created_at: string | null
          duration_days: number
          id: string
          name: string
          price: number
        }
        Insert: {
          access_level?: string | null
          created_at?: string | null
          duration_days: number
          id?: string
          name: string
          price: number
        }
        Update: {
          access_level?: string | null
          created_at?: string | null
          duration_days?: number
          id?: string
          name?: string
          price?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          emergency_contact: string | null
          emergency_contact_phone: string | null
          full_name: string | null
          health_notes: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          emergency_contact?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          health_notes?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          emergency_contact?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          health_notes?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reward_claims: {
        Row: {
          claimed_at: string
          created_at: string | null
          id: string
          qr_code_data: Json | null
          qr_session_id: string | null
          qr_timestamp: number | null
          reward_type: string | null
          user_id: string
        }
        Insert: {
          claimed_at?: string
          created_at?: string | null
          id?: string
          qr_code_data?: Json | null
          qr_session_id?: string | null
          qr_timestamp?: number | null
          reward_type?: string | null
          user_id: string
        }
        Update: {
          claimed_at?: string
          created_at?: string | null
          id?: string
          qr_code_data?: Json | null
          qr_session_id?: string | null
          qr_timestamp?: number | null
          reward_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_memberships: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          membership_id: string
          payment_status: string | null
          start_date: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          membership_id: string
          payment_status?: string | null
          start_date?: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          membership_id?: string
          payment_status?: string | null
          start_date?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_memberships_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_reward: {
        Args: {
          _qr_session_id: string
          _qr_timestamp: number
          _reward_type?: string
          _user_id: string
        }
        Returns: Json
      }
      get_coupon_usage_count: { Args: { _coupon_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_valid_membership: { Args: { _user_id: string }; Returns: boolean }
      is_coupon_valid: { Args: { _code: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "staff" | "member"
      coupon_type: "percentage" | "money_off"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff", "member"],
      coupon_type: ["percentage", "money_off"],
    },
  },
} as const
