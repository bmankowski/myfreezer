import type { StorageType } from "@/types";

// Generated database types for Supabase schema
export interface Database {
  public: {
    Tables: {
      containers: {
        Row: {
          container_id: string;
          user_id: string;
          name: string;
          type: StorageType;
          created_at: string;
        };
        Insert: {
          container_id?: string;
          user_id: string;
          name: string;
          type?: StorageType;
          created_at?: string;
        };
        Update: {
          container_id?: string;
          user_id?: string;
          name?: string;
          type?: StorageType;
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
      user_preferences: {
        Row: {
          user_id: string;
          default_shelf_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          default_shelf_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          default_shelf_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
