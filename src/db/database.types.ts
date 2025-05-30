// Generated database types for Supabase schema
export interface Database {
  public: {
    Tables: {
      containers: {
        Row: {
          container_id: string;
          user_id: string;
          name: string;
          type: "freezer" | "fridge";
          created_at: string;
        };
        Insert: {
          container_id?: string;
          user_id: string;
          name: string;
          type?: "freezer" | "fridge";
          created_at?: string;
        };
        Update: {
          container_id?: string;
          user_id?: string;
          name?: string;
          type?: "freezer" | "fridge";
          created_at?: string;
        };
      };
      shelves: {
        Row: {
          shelf_id: string;
          container_id: string;
          name: string;
          position: number;
          created_at: string;
        };
        Insert: {
          shelf_id?: string;
          container_id: string;
          name: string;
          position: number;
          created_at?: string;
        };
        Update: {
          shelf_id?: string;
          container_id?: string;
          name?: string;
          position?: number;
          created_at?: string;
        };
      };
      items: {
        Row: {
          item_id: string;
          shelf_id: string;
          name: string;
          quantity: number;
          created_at: string;
        };
        Insert: {
          item_id?: string;
          shelf_id: string;
          name: string;
          quantity?: number;
          created_at?: string;
        };
        Update: {
          item_id?: string;
          shelf_id?: string;
          name?: string;
          quantity?: number;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
} 