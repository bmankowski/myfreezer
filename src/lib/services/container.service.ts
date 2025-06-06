import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types.js";
import type {
  ContainerContentsDTO,
  ContainerDTO,
  ContainerDetailsDTO,
  CreateContainerCommandDTO,
  CreateContainerEntity,
  DeleteResponseDTO,
  ShelfWithItemsDTO,
  UpdateContainerCommandDTO,
  UpdateContainerEntity,
} from "../../types.js";

export class ContainerService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Get containers for a specific user with shelves and item counts
   */
  async getUserContainers(userId: string): Promise<ContainerDetailsDTO[]> {
    const { data, error } = await this.supabase
      .from("containers")
      .select(
        `
        container_id,
        name,
        type,
        created_at,
        shelves(
          shelf_id,
          name,
          position,
          created_at,
          items(
            item_id,
            name,
            quantity,
            created_at
          )
        )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch containers: ${error.message}`);
    }

    // Transform data to match ContainerDetailsDTO format
    return data.map((container) => {
      // Transform shelves data
      const shelfWithItems: ShelfWithItemsDTO[] = (container.shelves || [])
        .sort((a, b) => a.position - b.position)
        .map((shelf) => ({
          shelf_id: shelf.shelf_id,
          name: shelf.name,
          position: shelf.position,
          created_at: shelf.created_at,
          items: (shelf.items || []).map((item) => ({
            item_id: item.item_id,
            name: item.name,
            quantity: item.quantity,
            created_at: item.created_at,
          })),
        }));

      // Calculate total items
      const total_items = shelfWithItems.reduce((total, shelf) => total + shelf.items.length, 0);

      return {
        container_id: container.container_id,
        name: container.name,
        type: container.type,
        created_at: container.created_at,
        shelves: shelfWithItems,
        total_items,
      };
    });
  }

  /**
   * Create a new container for the authenticated user
   */
  async createContainer(command: CreateContainerCommandDTO, userId: string): Promise<ContainerDTO> {
    const entity: CreateContainerEntity = {
      ...command,
      user_id: userId,
    };

    const { data, error } = await this.supabase
      .from("containers")
      .insert(entity)
      .select("container_id, name, type, created_at")
      .single();

    if (error) {
      throw new Error(`Failed to create container: ${error.message}`);
    }

    return data;
  }

  /**
   * Get a shelf by name
   * @param containerId - The ID of the container
   * @param shelfName - The name of the shelf
   * @returns The shelf with items
   */
  async getShelfByName(containerId: string, shelfName: string): Promise<ShelfWithItemsDTO | null> {
    const { data, error } = await this.supabase
      .from("shelves")
      .select("shelf_id, name, position, created_at, items(item_id, name, quantity, created_at)")
      .eq("container_id", containerId)
      .eq("name", shelfName)
      .single();

    if (error) {
      throw new Error(`Failed to fetch shelf: ${error.message}`);
    }

    return data;
  }

  /**
   * Get detailed container information with shelves and items
   */
  async getContainerDetails(containerId: string): Promise<ContainerDetailsDTO | null> {
    // First get the container
    const { data: container, error: containerError } = await this.supabase
      .from("containers")
      .select("container_id, name, type, created_at")
      .eq("container_id", containerId)
      .single();

    if (containerError || !container) {
      return null;
    }

    // Then get shelves with items
    const { data: shelves, error: shelvesError } = await this.supabase
      .from("shelves")
      .select(
        `
        shelf_id,
        name,
        position,
        created_at,
        items (
          item_id,
          name,
          quantity,
          created_at
        )
      `
      )
      .eq("container_id", containerId)
      .order("position");

    if (shelvesError) {
      throw new Error(`Failed to fetch shelves: ${shelvesError.message}`);
    }

    // Transform shelves data
    const shelfWithItems: ShelfWithItemsDTO[] = (shelves || []).map((shelf) => ({
      shelf_id: shelf.shelf_id,
      name: shelf.name,
      position: shelf.position,
      created_at: shelf.created_at,
      items: (shelf.items || []).map((item) => ({
        item_id: item.item_id,
        name: item.name,
        quantity: item.quantity,
        created_at: item.created_at,
      })),
    }));

    // Calculate total items
    const total_items = shelfWithItems.reduce((total, shelf) => total + shelf.items.length, 0);

    return {
      container_id: container.container_id,
      name: container.name,
      type: container.type,
      created_at: container.created_at,
      shelves: shelfWithItems,
      total_items,
    };
  }

  /**
   * Get container contents (voice-optimized structure)
   */
  async getContainerContents(containerId: string): Promise<ContainerContentsDTO | null> {
    // First get the container basic info
    const { data: container, error: containerError } = await this.supabase
      .from("containers")
      .select("container_id, name, type")
      .eq("container_id", containerId)
      .single();

    if (containerError || !container) {
      return null;
    }

    // Then get shelves with items
    const { data: shelves, error: shelvesError } = await this.supabase
      .from("shelves")
      .select(
        `
        shelf_id,
        name,
        position,
        created_at,
        items (
          item_id,
          name,
          quantity,
          created_at
        )
      `
      )
      .eq("container_id", containerId)
      .order("position");

    if (shelvesError) {
      throw new Error(`Failed to fetch container contents: ${shelvesError.message}`);
    }

    // Transform shelves data
    const shelfWithItems: ShelfWithItemsDTO[] = (shelves || []).map((shelf) => ({
      shelf_id: shelf.shelf_id,
      name: shelf.name,
      position: shelf.position,
      created_at: shelf.created_at,
      items: (shelf.items || []).map((item) => ({
        item_id: item.item_id,
        name: item.name,
        quantity: item.quantity,
        created_at: item.created_at,
      })),
    }));

    // Calculate total items
    const total_items = shelfWithItems.reduce((total, shelf) => total + shelf.items.length, 0);

    return {
      container: {
        container_id: container.container_id,
        name: container.name,
        type: container.type,
      },
      shelves: shelfWithItems,
      total_items,
    };
  }

  /**
   * Update container name and/or type
   */
  async updateContainer(containerId: string, command: UpdateContainerCommandDTO): Promise<ContainerDTO | null> {
    const updateData: UpdateContainerEntity = {};

    if (command.name !== undefined) {
      updateData.name = command.name;
    }
    if (command.type !== undefined) {
      updateData.type = command.type;
    }

    const { data, error } = await this.supabase
      .from("containers")
      .update(updateData)
      .eq("container_id", containerId)
      .select("container_id, name, type, created_at")
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows affected - container not found or not owned by user
        return null;
      }
      throw new Error(`Failed to update container: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete an empty container
   */
  async deleteContainer(containerId: string): Promise<DeleteResponseDTO | null> {
    // First check if container has shelves
    const { data: shelves, error: shelvesError } = await this.supabase
      .from("shelves")
      .select("shelf_id")
      .eq("container_id", containerId)
      .limit(1);

    if (shelvesError) {
      throw new Error(`Failed to check container contents: ${shelvesError.message}`);
    }

    if (shelves && shelves.length > 0) {
      throw new Error("Container must be empty before deletion");
    }

    // Delete the container
    const { error } = await this.supabase.from("containers").delete().eq("container_id", containerId);

    if (error) {
      throw new Error(`Failed to delete container: ${error.message}`);
    }

    return {
      message: "Container deleted successfully",
    };
  }

  /**
   * Check if container exists and belongs to user (via RLS)
   */
  async containerExists(containerId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("containers")
      .select("container_id")
      .eq("container_id", containerId)
      .single();

    return !error && !!data;
  }
}
