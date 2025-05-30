import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types.js';
import type { 
  ItemDTO,
  AddItemCommandDTO,
  ItemActionResponseDTO,
  CreateItemEntity,
  UpdateItemQuantityCommandDTO,
  DeleteResponseDTO,
  ItemSearchResponseDTO,
  ItemWithLocationDTO,
  ItemSearchParams,
  RemoveItemQuantityCommandDTO,
  RemoveItemQuantityResponseDTO,
  MoveItemCommandDTO
} from '../../types.js';

export class ItemService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Search items with location information and pagination
   */
  async searchItems(params: ItemSearchParams): Promise<ItemSearchResponseDTO> {
    // Build the base query for counting
    let countQuery = this.supabase
      .from('items')
      .select('*', { count: 'exact', head: true });

    // Build the main query for fetching data
    let dataQuery = this.supabase
      .from('items')
      .select(`
        item_id,
        name,
        quantity,
        created_at,
        shelves!inner (
          shelf_id,
          name,
          position,
          containers!inner (
            container_id,
            name,
            type
          )
        )
      `);

    // Apply text search if provided
    if (params.q && params.q.trim()) {
      const searchTerm = `%${params.q.trim()}%`;
      countQuery = countQuery.ilike('name', searchTerm);
      dataQuery = dataQuery.ilike('name', searchTerm);
    }

    // Apply container filter if provided
    if (params.container_id) {
      countQuery = countQuery.eq('shelves.container_id', params.container_id);
      dataQuery = dataQuery.eq('shelves.container_id', params.container_id);
    }

    // Apply shelf filter if provided
    if (params.shelf_id) {
      countQuery = countQuery.eq('shelf_id', params.shelf_id);
      dataQuery = dataQuery.eq('shelf_id', params.shelf_id);
    }

    // Get total count for pagination
    const { count, error: countError } = await countQuery;
    
    if (countError) {
      throw new Error(`Failed to count items: ${countError.message}`);
    }

    // Apply pagination and ordering
    const limit = Math.min(params.limit || 50, 100); // Max limit of 100
    const offset = params.offset || 0;
    
    dataQuery = dataQuery
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    const { data, error } = await dataQuery;

    if (error) {
      throw new Error(`Failed to search items: ${error.message}`);
    }

    // Transform data to include location information
    const items: ItemWithLocationDTO[] = data.map(item => ({
      item_id: item.item_id,
      name: item.name,
      quantity: item.quantity,
      created_at: item.created_at,
      shelf: {
        shelf_id: item.shelves.shelf_id,
        name: item.shelves.name,
        position: item.shelves.position,
      },
      container: {
        container_id: item.shelves.containers.container_id,
        name: item.shelves.containers.name,
        type: item.shelves.containers.type,
      },
    }));

    return {
      items,
      total: count || 0,
      limit,
      offset,
    };
  }

  /**
   * Remove quantity from item or delete if quantity reaches zero
   */
  async removeItemQuantity(itemId: string, command: RemoveItemQuantityCommandDTO): Promise<RemoveItemQuantityResponseDTO | null> {
    // First get the current item with RLS protection
    const { data: currentItem, error: fetchError } = await this.supabase
      .from('items')
      .select('item_id, name, quantity')
      .eq('item_id', itemId)
      .single();

    if (fetchError || !currentItem) {
      return null; // Item not found or not owned by user
    }

    // Calculate new quantity
    const newQuantity = currentItem.quantity - command.quantity;

    if (newQuantity <= 0) {
      // Delete item if quantity reaches zero or below
      const { error: deleteError } = await this.supabase
        .from('items')
        .delete()
        .eq('item_id', itemId);

      if (deleteError) {
        throw new Error(`Failed to delete item: ${deleteError.message}`);
      }

      return {
        item_id: currentItem.item_id,
        name: currentItem.name,
        quantity: 0,
        action: 'deleted',
      };
    } else {
      // Update item with new quantity
      const { data: updatedItem, error: updateError } = await this.supabase
        .from('items')
        .update({ quantity: newQuantity })
        .eq('item_id', itemId)
        .select('item_id, name, quantity')
        .single();

      if (updateError) {
        throw new Error(`Failed to update item quantity: ${updateError.message}`);
      }

      return {
        item_id: updatedItem.item_id,
        name: updatedItem.name,
        quantity: updatedItem.quantity,
        action: 'updated',
      };
    }
  }

  /**
   * Move item to a different shelf
   */
  async moveItem(itemId: string, command: MoveItemCommandDTO): Promise<ItemDTO | null> {
    // First verify the item exists and belongs to user (RLS will handle this)
    const { data: currentItem, error: itemError } = await this.supabase
      .from('items')
      .select('item_id, shelf_id, name, quantity, created_at')
      .eq('item_id', itemId)
      .single();

    if (itemError || !currentItem) {
      return null; // Item not found or not owned by user
    }

    // Check if moving to the same shelf
    if (currentItem.shelf_id === command.shelf_id) {
      throw new Error('Item is already on this shelf');
    }

    // Verify the destination shelf exists and belongs to user (RLS will handle this)
    const { data: destinationShelf, error: shelfError } = await this.supabase
      .from('shelves')
      .select('shelf_id')
      .eq('shelf_id', command.shelf_id)
      .single();

    if (shelfError || !destinationShelf) {
      throw new Error('Destination shelf not found');
    }

    // Move the item by updating its shelf_id
    const { data: movedItem, error: updateError } = await this.supabase
      .from('items')
      .update({ shelf_id: command.shelf_id })
      .eq('item_id', itemId)
      .select('item_id, shelf_id, name, quantity, created_at')
      .single();

    if (updateError) {
      throw new Error(`Failed to move item: ${updateError.message}`);
    }

    return movedItem;
  }

  /**
   * Add item to shelf or update quantity if exists
   */
  async addItem(shelfId: string, command: AddItemCommandDTO): Promise<ItemActionResponseDTO> {
    // First verify the shelf exists and belongs to user (RLS will handle this)
    const { data: shelfCheck, error: shelfError } = await this.supabase
      .from('shelves')
      .select('shelf_id')
      .eq('shelf_id', shelfId)
      .single();

    if (shelfError || !shelfCheck) {
      throw new Error('Shelf not found');
    }

    // Check if item already exists on this shelf
    const { data: existingItem, error: searchError } = await this.supabase
      .from('items')
      .select('item_id, quantity')
      .eq('shelf_id', shelfId)
      .eq('name', command.name.trim())
      .single();

    if (searchError && searchError.code !== 'PGRST116') {
      throw new Error(`Failed to search for existing item: ${searchError.message}`);
    }

    if (existingItem) {
      // Update existing item quantity
      const newQuantity = existingItem.quantity + command.quantity;
      
      const { data: updatedItem, error: updateError } = await this.supabase
        .from('items')
        .update({ quantity: newQuantity })
        .eq('item_id', existingItem.item_id)
        .select('item_id, shelf_id, name, quantity, created_at')
        .single();

      if (updateError) {
        throw new Error(`Failed to update item quantity: ${updateError.message}`);
      }

      return {
        ...updatedItem,
        action: 'updated',
      };
    } else {
      // Create new item
      const entity: CreateItemEntity = {
        shelf_id: shelfId,
        name: command.name.trim(),
        quantity: command.quantity,
      };

      const { data: newItem, error: createError } = await this.supabase
        .from('items')
        .insert(entity)
        .select('item_id, shelf_id, name, quantity, created_at')
        .single();

      if (createError) {
        throw new Error(`Failed to create item: ${createError.message}`);
      }

      return {
        ...newItem,
        action: 'created',
      };
    }
  }

  /**
   * Update item quantity or delete if zero
   */
  async updateItemQuantity(itemId: string, command: UpdateItemQuantityCommandDTO): Promise<ItemDTO | null> {
    if (command.quantity === 0) {
      // Delete item if quantity is zero
      const { error } = await this.supabase
        .from('items')
        .delete()
        .eq('item_id', itemId);

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Item not found or not owned by user
        }
        throw new Error(`Failed to delete item: ${error.message}`);
      }

      return null; // Indicate item was deleted
    } else {
      // Update quantity
      const { data, error } = await this.supabase
        .from('items')
        .update({ quantity: command.quantity })
        .eq('item_id', itemId)
        .select('item_id, shelf_id, name, quantity, created_at')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Item not found or not owned by user
        }
        throw new Error(`Failed to update item quantity: ${error.message}`);
      }

      return data;
    }
  }

  /**
   * Delete an item completely
   */
  async deleteItem(itemId: string): Promise<DeleteResponseDTO | null> {
    // Check if item exists and belongs to user (via RLS)
    const { data: itemCheck, error: itemError } = await this.supabase
      .from('items')
      .select('item_id')
      .eq('item_id', itemId)
      .single();

    if (itemError || !itemCheck) {
      return null; // Item not found or not owned by user
    }

    // Delete the item
    const { error } = await this.supabase
      .from('items')
      .delete()
      .eq('item_id', itemId);

    if (error) {
      throw new Error(`Failed to delete item: ${error.message}`);
    }

    return {
      message: 'Item deleted successfully',
    };
  }

  /**
   * Check if item exists and belongs to user (via RLS through shelf/container)
   */
  async itemExists(itemId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('items')
      .select('item_id')
      .eq('item_id', itemId)
      .single();

    return !error && !!data;
  }
} 