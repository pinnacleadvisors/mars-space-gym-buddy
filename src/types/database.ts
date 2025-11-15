export type Database = {
  public: {
    Tables: {
      check_ins: {
        Row: {
          id: string;
          user_id: string;
          check_in_time: string; // ISO timestamp
          check_out_time: string | null;
          duration_minutes: number | null;
          location: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          check_in_time: string;
          check_out_time?: string | null;
          duration_minutes?: number | null;
          location?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          check_in_time?: string;
          check_out_time?: string | null;
          duration_minutes?: number | null;
          location?: string | null;
          created_at?: string;
        };
      };

      class_bookings: {
        Row: {
          id: string;
          user_id: string;
          class_id: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          class_id: string;
          status: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          class_id?: string;
          status?: string;
          created_at?: string;
        };
      };

      class_sessions: {
        Row: {
          id: string;
          name: string;
          instructor: string;
          start_time: string;
          end_time: string;
          capacity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          instructor: string;
          start_time: string;
          end_time: string;
          capacity: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          instructor?: string;
          start_time?: string;
          end_time?: string;
          capacity?: number;
          created_at?: string;
        };
      };

      classes: {
        Row: {
          id: string;
          name: string;
          description: string;
          instructor: string;
          schedule: string;
          duration: number;
          capacity: number;
          category: string;
          image_url: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          instructor: string;
          schedule: string;
          duration: number;
          capacity: number;
          category: string;
          image_url: string;
          is_active: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          instructor?: string;
          schedule?: string;
          duration?: number;
          capacity?: number;
          category?: string;
          image_url?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };

      memberships: {
        Row: {
          id: string;
          name: string;
          price: number;
          duration_days: number;
          access_level: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          price: number;
          duration_days: number;
          access_level: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          price?: number;
          duration_days?: number;
          access_level?: string;
          created_at?: string;
        };
      };

      profiles: {
        Row: {
          id: string;
          full_name: string;
          avatar_url: string | null;
          phone: string | null;
          emergency_contact: string | null;
          emergency_contact_phone: string | null;
          date_of_birth: string | null;
          address: string | null;
          health_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          avatar_url?: string | null;
          phone?: string | null;
          emergency_contact?: string | null;
          emergency_contact_phone?: string | null;
          date_of_birth?: string | null;
          address?: string | null;
          health_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          avatar_url?: string | null;
          phone?: string | null;
          emergency_contact?: string | null;
          emergency_contact_phone?: string | null;
          date_of_birth?: string | null;
          address?: string | null;
          health_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      user_memberships: {
        Row: {
          id: string;
          user_id: string;
          membership_id: string;
          start_date: string;
          end_date: string;
          status: string;
          payment_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          membership_id: string;
          start_date: string;
          end_date: string;
          status: string;
          payment_status: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          membership_id?: string;
          start_date?: string;
          end_date?: string;
          status?: string;
          payment_status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };

      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: string;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};
