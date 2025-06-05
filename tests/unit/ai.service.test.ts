import { describe, it, expect, vi, beforeEach } from "vitest";
import { AIService } from "../../src/lib/services/ai.service.js";
import OpenAI from "openai";

// Mock OpenAI
vi.mock("openai");

describe("AIService", () => {
  let aiService: AIService;
  let mockOpenAI: {
    chat: {
      completions: {
        parse: ReturnType<typeof vi.fn>;
      };
    };
  };
  let mockChatCompletions: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Setup OpenAI mock
    mockChatCompletions = vi.fn();

    mockOpenAI = {
      chat: {
        completions: {
          parse: mockChatCompletions,
        },
      },
    };

    // Mock the OpenAI constructor
    vi.mocked(OpenAI).mockImplementation(() => mockOpenAI as unknown as OpenAI);

    aiService = new AIService();
  });

  describe("parseVoiceCommand", () => {
    const mockContext = {
      allData: JSON.stringify([
        {
          container_id: 1,
          name: "Zamrażarka",
          shelves: [
            {
              shelf_id: 1,
              name: "Pierwsza półka",
              items: [
                { item_id: 1, name: "mleko", quantity: 2 },
                { item_id: 2, name: "chleb", quantity: 1 },
              ],
            },
            {
              shelf_id: 2,
              name: "Druga półka",
              items: [{ item_id: 3, name: "masło", quantity: 3 }],
            },
          ],
        },
      ]),
      default_container_id: "1",
    };

    it("should parse simple add item command successfully", async () => {
      // Arrange
      const command = "dodaj 2 mleka na pierwszą półkę";
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                success: true,
                actions: [
                  {
                    type: "add_item",
                    item_name: "mleko",
                    quantity: 2,
                    shelf_identifier: "1",
                    container_identifier: null,
                  },
                ],
                message: "Dodano 2 mleko na pierwszą półkę",
                needs_clarification: false,
                clarification_question: null,
              }),
            },
          },
        ],
      };

      mockChatCompletions.mockResolvedValue(mockResponse);

      // Act
      const result = await aiService.parseVoiceCommand(command, mockContext);

      // Assert
      expect(result).toMatchInlineSnapshot(`
        {
          "actions": [
            {
              "container_identifier": null,
              "item_name": "mleko",
              "quantity": 2,
              "shelf_identifier": "1",
              "type": "add_item",
            },
          ],
          "clarification_question": null,
          "message": "Dodano 2 mleko na pierwszą półkę",
          "needs_clarification": false,
          "success": true,
        }
      `);

      expect(mockChatCompletions).toHaveBeenCalledOnce();
      expect(mockChatCompletions).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "openai/gpt-4o-mini",
          messages: expect.arrayContaining([
            expect.objectContaining({ role: "system" }),
            expect.objectContaining({
              role: "user",
              content: `Parse this Polish voice command: "${command}"`,
            }),
          ]),
          temperature: 0.1,
          max_tokens: 1000,
        })
      );
    });

    it("should parse remove item command successfully", async () => {
      // Arrange
      const command = "usuń 1 chleb z pierwszej półki";
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                success: true,
                actions: [
                  {
                    type: "remove_item",
                    item_name: "chleb",
                    quantity: 1,
                    shelf_identifier: "1",
                    container_identifier: null,
                  },
                ],
                message: "Usunięto 1 chleb z pierwszej półki",
                needs_clarification: false,
                clarification_question: null,
              }),
            },
          },
        ],
      };

      mockChatCompletions.mockResolvedValue(mockResponse);

      // Act
      const result = await aiService.parseVoiceCommand(command, mockContext);

      // Assert
      expect(result.success).toBe(true);
      expect(result.actions).toHaveLength(1);
      expect(result.actions[0]).toEqual(
        expect.objectContaining({
          type: "remove_item",
          item_name: "chleb",
          quantity: 1,
          shelf_identifier: "1",
        })
      );
    });

    it("should request clarification for ambiguous commands", async () => {
      // Arrange
      const command = "dodaj coś";
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                success: false,
                actions: [],
                message: "Nie zrozumiałem polecenia",
                needs_clarification: true,
                clarification_question: "Co chcesz dodać i gdzie?",
              }),
            },
          },
        ],
      };

      mockChatCompletions.mockResolvedValue(mockResponse);

      // Act
      const result = await aiService.parseVoiceCommand(command, mockContext);

      // Assert
      expect(result.success).toBe(false);
      expect(result.needs_clarification).toBe(true);
      expect(result.clarification_question).toBe("Co chcesz dodać i gdzie?");
      expect(result.actions).toHaveLength(0);
    });

    it("should handle query commands", async () => {
      // Arrange
      const command = "ile mam mleka?";
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                success: true,
                actions: [
                  {
                    type: "info",
                    item_name: "mleko",
                    quantity: 0,
                    shelf_identifier: null,
                    container_identifier: null,
                  },
                ],
                message: "Sprawdzam ilość mleka",
                needs_clarification: false,
                clarification_question: null,
              }),
            },
          },
        ],
      };

      mockChatCompletions.mockResolvedValue(mockResponse);

      // Act
      const result = await aiService.parseVoiceCommand(command, mockContext);

      // Assert
      expect(result.success).toBe(true);
      expect(result.actions[0].type).toBe("info");
      expect(result.actions[0].item_name).toBe("mleko");
    });

    it("should handle API errors gracefully", async () => {
      // Arrange
      const command = "dodaj mleko";
      mockChatCompletions.mockRejectedValue(new Error("API Error"));

      // Act & Assert
      await expect(aiService.parseVoiceCommand(command, mockContext)).rejects.toThrow(
        "Failed to process voice command with AI"
      );
    });

    it("should handle invalid JSON responses", async () => {
      // Arrange
      const command = "dodaj mleko";
      const mockResponse = {
        choices: [
          {
            message: {
              content: "Invalid JSON response",
            },
          },
        ],
      };

      mockChatCompletions.mockResolvedValue(mockResponse);

      // Act
      const result = await aiService.parseVoiceCommand(command, mockContext);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe("Nie mogę zrozumieć polecenia. Spróbuj ponownie.");
      expect(result.needs_clarification).toBe(true);
    });

    it("should handle empty API responses", async () => {
      // Arrange
      const command = "dodaj mleko";
      const mockResponse = {
        choices: [
          {
            message: {
              content: null, // Empty response
            },
          },
        ],
      };

      mockChatCompletions.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(aiService.parseVoiceCommand(command, mockContext)).rejects.toThrow(
        "Failed to process voice command with AI"
      );
    });

    it("should include context data in system prompt", async () => {
      // Arrange
      const command = "dodaj mleko";
      const mockResponse = {
        choices: [
          {
            message: {
              content: '{"success": true, "actions": [], "message": "OK", "needs_clarification": false}',
            },
          },
        ],
      };

      mockChatCompletions.mockResolvedValue(mockResponse);

      // Act
      await aiService.parseVoiceCommand(command, mockContext);

      // Assert
      const systemPromptCall = mockChatCompletions.mock.calls[0][0];
      const systemPrompt = systemPromptCall.messages[0].content;

      expect(systemPrompt).toContain(mockContext.allData);
      expect(systemPrompt).toContain("DEFAULT CONTAINER: 1");
      expect(systemPrompt).toContain("SUPPORTED OPERATIONS");
    });
  });
});
