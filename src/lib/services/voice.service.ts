import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types.js";
import type {
  VoiceProcessCommandDTO,
  VoiceProcessResponseDTO,
  VoiceActionDTO,
  VoiceActionDetailsDTO,
  VoiceQueryCommandDTO,
  VoiceQueryResponseDTO,
  VoiceQueryItemDTO,
} from "../../types.js";
import { AIService, type ParsedAction } from "./ai.service.js";
import { ContainerService } from "./container.service.js";
import { ShelfService } from "./shelf.service.js";
import { ItemService } from "./item.service.js";

interface ActionContext {
  default_shelf_id?: string;
  allData: string;
  idMappings: {
    containers: Map<number, string>; // number -> original container_id
    shelves: Map<number, string>; // number -> original shelf_id
    items: Map<number, string>; // number -> original item_id
  };
  reverseIdMappings: {
    containers: Map<string, number>; // original container_id -> number
    shelves: Map<string, number>; // original shelf_id -> number
    items: Map<string, number>; // original item_id -> number
  };
}

interface ContainerData {
  container_id: string;
  name: string;
  shelves: ShelfData[];
}

interface ShelfData {
  shelf_id: string;
  name: string;
  position: number;
  items: ItemData[];
}

interface ItemData {
  item_id: string;
  name: string;
  quantity: number;
}

export class VoiceService {
  private aiService: AIService;
  private containerService: ContainerService;
  private shelfService: ShelfService;
  private itemService: ItemService;

  constructor(private supabase: SupabaseClient<Database>) {
    this.aiService = new AIService();
    this.containerService = new ContainerService(supabase);
    this.shelfService = new ShelfService(supabase);
    this.itemService = new ItemService(supabase);
  }

  /**
   * Process voice query and return search results with AI-generated response
   */
  async processQuery(command: VoiceQueryCommandDTO): Promise<VoiceQueryResponseDTO> {
    try {
      // Search for items based on the query
      const searchResults = await this.itemService.searchItems({
        q: this.extractSearchTermFromQuery(command.query),
        container_id: command.context?.containers?.[0], // Use first container if specified
        limit: 50, // Get more results for aggregation
      });

      // If no results found, try broader search
      if (searchResults.items.length === 0 && command.context?.containers?.length) {
        // Search across all specified containers
        const allResults = [];
        for (const containerId of command.context.containers) {
          const containerResults = await this.itemService.searchItems({
            q: this.extractSearchTermFromQuery(command.query),
            container_id: containerId,
            limit: 20,
          });
          allResults.push(...containerResults.items);
        }
        searchResults.items = allResults;
      }

      // Aggregate results by item name
      const aggregatedItems = this.aggregateItemsByName(searchResults.items);

      // Generate AI response
      const aiResponse = await this.aiService.generateQueryResponse(
        command.query,
        searchResults.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          shelf_name: item.shelf.name,
          container_name: item.container.name,
        }))
      );

      return {
        found: aggregatedItems.length > 0,
        items: aggregatedItems,
        message: this.generateQueryMessage(aggregatedItems),
        ai_response: aiResponse,
      };
    } catch (error) {
      console.error("Voice query processing error:", error);
      return {
        found: false,
        items: [],
        message: "Wystąpił błąd podczas wyszukiwania",
        ai_response: "Nie mogę teraz wyszukać przedmiotów",
      };
    }
  }

  /**
   * Process voice command with AI parsing and action execution
   */
  async processCommand(command: VoiceProcessCommandDTO, userId: string): Promise<VoiceProcessResponseDTO> {
    try {
      // Get user context (containers and shelves)
      const context = await this.getUserContext(userId);

      // Parse command with AI
      const aiResult = await this.aiService.parseVoiceCommand(command.command, {
        allData: context.allData,
      });

      if (!aiResult.actions.length) {
        return {
          success: false,
          actions: [],
          message: aiResult.clarification_question || aiResult.message,
          ai_response: "Nie zrozumiałem polecenia",
        };
      }

      if (aiResult.needs_clarification) {
        return {
          success: true,
          actions: [],
          message: aiResult.clarification_question || aiResult.message,
          ai_response: aiResult.message,
        };
      }

      // Execute actions
      const actions: VoiceActionDTO[] = [];
      let overallSuccess = true;
      const messages: string[] = [];

      for (const parsedAction of aiResult.actions) {
        try {
          const actionResult = await this.executeAction(parsedAction, context);
          actions.push(actionResult);

          if (actionResult.status === "success") {
            messages.push(this.generateActionMessage(actionResult));
          } else {
            overallSuccess = false;
          }
        } catch {
          overallSuccess = false;
          // Only add non-clarify actions to failed actions
          actions.push({
            type: parsedAction.type as VoiceActionDTO["type"],
            status: "failed",
            details: {
              item_name: parsedAction.item_name,
              quantity: parsedAction.quantity,
              shelf_name: "Nieznana",
              container_name: "Nieznany",
            },
          });
        }
      }

      const finalMessage =
        messages.length > 0
          ? messages.join(". ")
          : overallSuccess
            ? "Operacja zakończona pomyślnie"
            : "Wystąpiły błędy podczas wykonywania operacji";

      return {
        success: overallSuccess,
        actions,
        message: finalMessage,
        ai_response: aiResult.message,
      };
    } catch (error) {
      console.error("Voice command processing error:", error);
      return {
        success: false,
        actions: [],
        message: "Wystąpił błąd podczas przetwarzania polecenia",
        ai_response: "Nie mogę przetworzyć tego polecenia",
      };
    }
  }

  private extractSearchTermFromQuery(query: string): string {
    // Simple extraction - in production, this could be enhanced with AI
    const cleanQuery = query
      .toLowerCase()
      .replace(/czy mam|co mam|gdzie jest|ile mam|sprawdź/g, "")
      .replace(/\?/g, "")
      .trim();

    return cleanQuery || query;
  }

  private aggregateItemsByName(
    items: {
      name: string;
      quantity: number;
      shelf: { name: string; position: number };
      container: { name: string };
    }[]
  ): VoiceQueryItemDTO[] {
    const itemMap = new Map<string, VoiceQueryItemDTO>();

    for (const item of items) {
      const key = item.name.toLowerCase();

      if (itemMap.has(key)) {
        const existing = itemMap.get(key);
        if (existing) {
          existing.quantity += item.quantity;
          // Add this location if not already present
          const locationExists = existing.locations.some(
            (loc) => loc.shelf_name === item.shelf.name && loc.container_name === item.container.name
          );
          if (!locationExists) {
            existing.locations.push({
              shelf_name: item.shelf.name,
              container_name: item.container.name,
              shelf_position: item.shelf.position,
            });
          }
        }
      } else {
        itemMap.set(key, {
          name: item.name,
          quantity: item.quantity,
          locations: [
            {
              shelf_name: item.shelf.name,
              container_name: item.container.name,
              shelf_position: item.shelf.position,
            },
          ],
        });
      }
    }

    return Array.from(itemMap.values());
  }

  private generateQueryMessage(items: VoiceQueryItemDTO[]): string {
    if (items.length === 0) {
      return "Nie znaleziono żadnych przedmiotów";
    }

    if (items.length === 1) {
      const item = items[0];
      const locationDesc =
        item.locations.length === 1
          ? `na ${item.locations[0].shelf_name} w ${item.locations[0].container_name}`
          : `w ${item.locations.length} miejscach`;

      return `Tak, masz ${item.quantity} ${item.name} ${locationDesc}`;
    }

    return `Znaleziono ${items.length} różnych przedmiotów`;
  }

  private async getUserContext(userId: string, defaultShelfId?: string): Promise<ActionContext> {
    // Get user's containers
    const containers = await this.containerService.getUserContainers(userId);

    // Create comprehensive ID mappings for AI processing
    const { idMappings, reverseIdMappings } = this.createIdMappings(containers);

    // Transform data for AI with sequential shelf IDs
    const transformedData = this.transformDataForAI(containers, reverseIdMappings);

    return {
      default_shelf_id: defaultShelfId,
      allData: JSON.stringify(transformedData),
      idMappings,
      reverseIdMappings,
    };
  }

  private async executeAction(parsedAction: ParsedAction, context: ActionContext): Promise<VoiceActionDTO> {
    const { item_name, quantity, shelf_id } = parsedAction;

    if (!shelf_id) {
      throw new Error("Shelf ID is required");
    }

    // Resolve shelf using ID mappings
    const originalShelfId = this.resolveOriginalId(shelf_id, "shelves", context.idMappings);
    if (!originalShelfId) {
      throw new Error("Cannot resolve shelf identifier");
    }

    const shelf = await this.shelfService.getShelfById(originalShelfId);
    if (!shelf) {
      throw new Error("Shelf not found");
    }

    const details: VoiceActionDetailsDTO = {
      item_name,
      quantity,
      shelf_name: shelf.name,
      container_name: "Container", // We'd need to fetch container name if needed
    };

    try {
      switch (parsedAction.type) {
        case "add_item":
          await this.itemService.addItem(shelf.shelf_id, {
            name: item_name,
            quantity,
          });
          return {
            type: "add_item",
            status: "success",
            details,
          };

        case "remove_item": {
          const removeResult = await this.itemService.removeItemQuantity(
            await this.findItemId(item_name, shelf.shelf_id),
            { quantity }
          );
          if (!removeResult) {
            throw new Error("Item not found");
          }
          return {
            type: "remove_item",
            status: "success",
            details,
          };
        }

        case "update_item": {
          const updateResult = await this.itemService.updateItemQuantity(
            await this.findItemId(item_name, shelf.shelf_id),
            { quantity }
          );
          if (!updateResult) {
            throw new Error("Item not found");
          }
          return {
            type: "update_item",
            status: "success",
            details,
          };
        }

        case "query_item":
          // For queries, we'll just return success - actual search is handled separately
          return {
            type: "query_item",
            status: "success",
            details,
          };

        default:
          throw new Error("Unknown action type");
      }
    } catch {
      return {
        type: parsedAction.type as VoiceActionDTO["type"],
        status: "failed",
        details,
      };
    }
  }

  private async findItemId(itemName: string, shelfId: string): Promise<string> {
    const searchResult = await this.itemService.searchItems({
      q: itemName,
      shelf_id: shelfId,
      limit: 1,
    });

    if (searchResult.items.length === 0) {
      throw new Error("Item not found");
    }

    return searchResult.items[0].item_id;
  }

  private generateActionMessage(action: VoiceActionDTO): string {
    const { type, details } = action;

    switch (type) {
      case "add_item":
        return `Dodano ${details.quantity} ${details.item_name} na ${details.shelf_name} w ${details.container_name}`;
      case "remove_item":
        return `Usunięto ${details.quantity} ${details.item_name} z ${details.shelf_name} w ${details.container_name}`;
      case "update_item":
        return `Zaktualizowano ilość ${details.item_name} na ${details.quantity} na ${details.shelf_name} w ${details.container_name}`;
      case "query_item":
        return `Sprawdzono ${details.item_name} na ${details.shelf_name} w ${details.container_name}`;
      default:
        return "Operacja wykonana";
    }
  }

  /**
   * Create comprehensive ID mappings for AI processing
   */
  private createIdMappings(containers: ContainerData[]): {
    idMappings: ActionContext["idMappings"];
    reverseIdMappings: ActionContext["reverseIdMappings"];
  } {
    const idMappings = {
      containers: new Map<number, string>(),
      shelves: new Map<number, string>(),
      items: new Map<number, string>(),
    };

    const reverseIdMappings = {
      containers: new Map<string, number>(),
      shelves: new Map<string, number>(),
      items: new Map<string, number>(),
    };

    let containerCounter = 1;
    let shelfCounter = 1;
    let itemCounter = 1;

    for (const container of containers) {
      // Map container
      idMappings.containers.set(containerCounter, container.container_id);
      reverseIdMappings.containers.set(container.container_id, containerCounter);
      containerCounter++;

      // Map shelves
      for (const shelf of container.shelves) {
        idMappings.shelves.set(shelfCounter, shelf.shelf_id);
        reverseIdMappings.shelves.set(shelf.shelf_id, shelfCounter);
        shelfCounter++;

        // Map items
        for (const item of shelf.items) {
          idMappings.items.set(itemCounter, item.item_id);
          reverseIdMappings.items.set(item.item_id, itemCounter);
          itemCounter++;
        }
      }
    }

    return { idMappings, reverseIdMappings };
  }

  /**
   * Transform data structure with sequential IDs for AI processing
   */
  private transformDataForAI(containers: ContainerData[], reverseIdMappings: ActionContext["reverseIdMappings"]) {
    return containers.map((container) => ({
      container_id: reverseIdMappings.containers.get(container.container_id),
      name: container.name,
      shelves: container.shelves.map((shelf) => ({
        shelf_id: reverseIdMappings.shelves.get(shelf.shelf_id),
        name: shelf.name,
        items: shelf.items.map((item) => ({
          item_id: reverseIdMappings.items.get(item.item_id),
          name: item.name,
          quantity: item.quantity,
        })),
      })),
    }));
  }

  /**
   * Resolve sequential ID back to original string ID
   */
  private resolveOriginalId(
    sequentialId: string | number,
    type: "containers" | "shelves" | "items",
    idMappings: ActionContext["idMappings"]
  ): string | null {
    const numId = typeof sequentialId === "string" ? parseInt(sequentialId, 10) : sequentialId;
    if (isNaN(numId)) return null;

    return idMappings[type].get(numId) || null;
  }
}
