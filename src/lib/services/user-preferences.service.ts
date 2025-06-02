import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types.js";
import type { UserPreferencesDTO, SetDefaultShelfCommandDTO, SetDefaultShelfResponseDTO } from "../../types.js";

export class UserPreferencesService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get user preferences including default shelf information
   */
  async getUserPreferences(userId: string): Promise<UserPreferencesDTO | null> {
    const { data, error } = await this.supabase
      .from("user_preferences")
      .select(
        `
        user_id,
        default_shelf_id,
        created_at,
        updated_at,
        shelves:default_shelf_id (
          shelf_id,
          name,
          position,
          container_id,
          containers (
            name
          )
        )
      `
      )
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No preferences found - return null to indicate we should create default preferences
        return null;
      }
      throw new Error(`Failed to get user preferences: ${error.message}`);
    }

    // Type assertion for the joined data structure
    const shelfData = data.shelves as {
      shelf_id: string;
      name: string;
      position: number;
      container_id: string;
      containers?: { name: string };
    } | null;

    return {
      user_id: data.user_id,
      default_shelf_id: data.default_shelf_id,
      default_shelf: shelfData
        ? {
            shelf_id: shelfData.shelf_id,
            name: shelfData.name,
            position: shelfData.position,
            container_id: shelfData.container_id,
            container_name: shelfData.containers?.name || "",
          }
        : null,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  /**
   * Set default shelf for user
   */
  async setDefaultShelf(userId: string, command: SetDefaultShelfCommandDTO): Promise<SetDefaultShelfResponseDTO> {
    // First, verify the shelf exists and belongs to the user
    const { data: shelfCheck, error: shelfError } = await this.supabase
      .from("shelves")
      .select(
        `
        shelf_id,
        name,
        position,
        container_id,
        containers (
          name,
          user_id
        )
      `
      )
      .eq("shelf_id", command.shelf_id)
      .single();

    if (shelfError || !shelfCheck) {
      throw new Error("Shelf not found or access denied");
    }

    // Type assertion for the joined data
    const containerData = shelfCheck.containers as {
      name: string;
      user_id: string;
    } | null;

    if (containerData?.user_id !== userId) {
      throw new Error("Shelf not found or access denied");
    }

    // Upsert user preferences (insert if not exists, update if exists)
    const { error: upsertError } = await this.supabase.from("user_preferences").upsert(
      {
        user_id: userId,
        default_shelf_id: command.shelf_id,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

    if (upsertError) {
      throw new Error(`Failed to set default shelf: ${upsertError.message}`);
    }

    return {
      message: "Default shelf set successfully",
      default_shelf: {
        shelf_id: shelfCheck.shelf_id,
        name: shelfCheck.name,
        position: shelfCheck.position,
        container_name: containerData?.name || "",
      },
    };
  }

  /**
   * Clear default shelf for user
   */
  async clearDefaultShelf(userId: string): Promise<{ message: string }> {
    const { error } = await this.supabase.from("user_preferences").upsert(
      {
        user_id: userId,
        default_shelf_id: null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

    if (error) {
      throw new Error(`Failed to clear default shelf: ${error.message}`);
    }

    return {
      message: "Default shelf cleared successfully",
    };
  }

  /**
   * Initialize user preferences with default values
   */
  async initializeUserPreferences(userId: string): Promise<UserPreferencesDTO> {
    const { data, error } = await this.supabase
      .from("user_preferences")
      .insert({
        user_id: userId,
        default_shelf_id: null,
      })
      .select("user_id, default_shelf_id, created_at, updated_at")
      .single();

    if (error) {
      if (error.code === "23505") {
        // User preferences already exist, fetch them
        return (
          (await this.getUserPreferences(userId)) || {
            user_id: userId,
            default_shelf_id: null,
            default_shelf: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        );
      }
      throw new Error(`Failed to initialize user preferences: ${error.message}`);
    }

    return {
      user_id: data.user_id,
      default_shelf_id: data.default_shelf_id,
      default_shelf: null,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }
}
