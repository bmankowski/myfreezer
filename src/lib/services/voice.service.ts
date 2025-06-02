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
import { AIService } from "./ai.service.js";
import { ContainerService } from "./container.service.js";
import { ShelfService } from "./shelf.service.js";
import { ItemService } from "./item.service.js";

interface ActionContext {
  containers: {
    container_id: string;
    name: string;
    type: "freezer" | "fridge";
  }[];
  shelves: {
    shelf_id: string;
    name: string;
    position: number;
    container_id: string;
  }[];
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
      const context = await this.getUserContext(userId, command.context?.default_container_id);

      // Parse command with AI
      const aiResult = await this.aiService.parseVoiceCommand(command.command, {
        default_container_id: command.context?.default_container_id,
        containers: context.containers,
        shelves: context.shelves,
      });

      if (!aiResult.success || aiResult.needs_clarification) {
        return {
          success: false,
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
          actions.push({
            type: parsedAction.type,
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

  private async getUserContext(userId: string, defaultContainerId?: string): Promise<ActionContext> {
    // Get user's containers
    const containers = await this.containerService.getUserContainers(userId);
    const containerData = containers.map((c) => ({
      container_id: c.container_id,
      name: c.name,
      type: c.type,
    }));

    // Get shelves for default container or all containers
    let shelves: {
      shelf_id: string;
      name: string;
      position: number;
      container_id: string;
    }[] = [];

    if (defaultContainerId) {
      // Get shelves for specific container
      const containerDetails = await this.containerService.getContainerDetails(defaultContainerId);
      if (containerDetails) {
        shelves = containerDetails.shelves.map((s) => ({
          shelf_id: s.shelf_id,
          name: s.name,
          position: s.position,
          container_id: defaultContainerId,
        }));
      }
    } else {
      // Get shelves for all containers (this would require a new method)
      // For now, limit to first container if exists
      if (containerData.length > 0) {
        const firstContainer = containerData[0];
        const containerDetails = await this.containerService.getContainerDetails(firstContainer.container_id);
        if (containerDetails) {
          shelves = containerDetails.shelves.map((s) => ({
            shelf_id: s.shelf_id,
            name: s.name,
            position: s.position,
            container_id: firstContainer.container_id,
          }));
        }
      }
    }

    return {
      containers: containerData,
      shelves,
    };
  }

  private async executeAction(
    parsedAction: {
      type: string;
      item_name: string;
      quantity: number;
      shelf_identifier?: string;
      container_identifier?: string;
    },
    context: ActionContext
  ): Promise<VoiceActionDTO> {
    const { item_name, quantity, shelf_identifier, container_identifier } = parsedAction;

    // Resolve shelf
    const shelf = this.resolveShelf(shelf_identifier, container_identifier, context);
    if (!shelf) {
      throw new Error("Cannot resolve shelf");
    }

    const container = context.containers.find((c) => c.container_id === shelf.container_id);
    if (!container) {
      throw new Error("Cannot resolve container");
    }

    const details: VoiceActionDetailsDTO = {
      item_name,
      quantity,
      shelf_name: shelf.name,
      container_name: container.name,
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
        type: parsedAction.type,
        status: "failed",
        details,
      };
    }
  }

  private resolveShelf(
    shelfIdentifier: string | undefined,
    containerIdentifier: string | undefined,
    context: ActionContext
  ) {
    // If no shelf specified, use first shelf of default/first container
    if (!shelfIdentifier) {
      return context.shelves[0] || null;
    }

    // Try to match by position (numeric)
    const position = parseInt(shelfIdentifier, 10);
    if (!isNaN(position)) {
      return context.shelves.find((s) => s.position === position) || null;
    }

    // Try to match by name (case insensitive)
    return context.shelves.find((s) => s.name.toLowerCase().includes(shelfIdentifier.toLowerCase())) || null;
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
}
