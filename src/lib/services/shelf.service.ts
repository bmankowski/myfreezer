import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types.js";
import type {
  ShelfDTO,
  CreateShelfCommandDTO,
  CreateShelfEntity,
  UpdateShelfCommandDTO,
  UpdateShelfEntity,
  DeleteResponseDTO,
} from "../../types.js";

export class ShelfService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Create a new shelf in a container
   */
  async createShelf(containerId: string, command: CreateShelfCommandDTO): Promise<ShelfDTO> {
    // First verify the container exists and belongs to user (RLS will handle this)
    const { data: containerCheck, error: containerError } = await this.supabase
      .from("containers")
      .select("container_id")
      .eq("container_id", containerId)
      .single();

    if (containerError || !containerCheck) {
      throw new Error("Container not found");
    }

    const entity: CreateShelfEntity = {
      ...command,
      container_id: containerId,
    };

    const { data, error } = await this.supabase
      .from("shelves")
      .insert(entity)
      .select("shelf_id, container_id, name, position, created_at")
      .single();

    if (error) {
      if (error.code === "23505") {
        // Unique constraint violation (position already exists)
        throw new Error("Position already exists in this container");
      }
      throw new Error(`Failed to create shelf: ${error.message}`);
    }

    return data;
  }

  /**
   * Update shelf name and/or position
   */
  async updateShelf(shelfId: string, command: UpdateShelfCommandDTO): Promise<ShelfDTO | null> {
    const updateData: UpdateShelfEntity = {};

    if (command.name !== undefined) {
      updateData.name = command.name;
    }
    if (command.position !== undefined) {
      updateData.position = command.position;
    }

    const { data, error } = await this.supabase
      .from("shelves")
      .update(updateData)
      .eq("shelf_id", shelfId)
      .select("shelf_id, container_id, name, position, created_at")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows affected - shelf not found or not owned by user
        return null;
      }
      if (error.code === "23505") {
        // Unique constraint violation (position already exists)
        throw new Error("Position already exists in this container");
      }
      throw new Error(`Failed to update shelf: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete an empty shelf
   */
  async deleteShelf(shelfId: string): Promise<DeleteResponseDTO | null> {
    // First check if shelf has items
    const { data: items, error: itemsError } = await this.supabase
      .from("items")
      .select("item_id")
      .eq("shelf_id", shelfId)
      .limit(1);

    if (itemsError) {
      throw new Error(`Failed to check shelf contents: ${itemsError.message}`);
    }

    if (items && items.length > 0) {
      throw new Error("Shelf must be empty before deletion");
    }

    // Check if shelf exists and belongs to user (via RLS)
    const { data: shelfCheck, error: shelfError } = await this.supabase
      .from("shelves")
      .select("shelf_id")
      .eq("shelf_id", shelfId)
      .single();

    if (shelfError || !shelfCheck) {
      return null; // Shelf not found or not owned by user
    }

    // Delete the shelf
    const { error } = await this.supabase.from("shelves").delete().eq("shelf_id", shelfId);

    if (error) {
      throw new Error(`Failed to delete shelf: ${error.message}`);
    }

    return {
      message: "Shelf deleted successfully",
    };
  }

  /**
   * Check if shelf exists and belongs to user (via RLS through container)
   */
  async shelfExists(shelfId: string): Promise<boolean> {
    const { data, error } = await this.supabase.from("shelves").select("shelf_id").eq("shelf_id", shelfId).single();

    return !error && !!data;
  }
}
