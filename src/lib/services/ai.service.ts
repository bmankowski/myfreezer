import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import type { CommandContext } from "@/types";

// ZOD Schemas for validation
const ParsedActionSchema = z.object({
  type: z
    .enum(["add_item", "remove_item", "update_item", "info", "clarify_message"])
    .describe("Type of action to be performed"),
  item_name: z.string().describe("Name of the item to be added, removed, updated, or queried"),
  quantity: z.number().describe("Quantity of the item to be added, removed, or updated"),
  shelf_id: z.number().describe("Id of the shelf to be used for the action"),
});

const AIParseResultSchema = z.object({
  actions: z.array(ParsedActionSchema).describe("Actions to be performed"),
  message: z
    .string()
    .describe(
      "Information for user, and if user ask about item, return nice message containing item name, quantity, container  shelves names"
    ),
  needs_clarification: z.boolean().describe("Whether the command needs clarification"),
  clarification_question: z.string().describe("Question to be asked to the user"),
});

// Infer TypeScript types from Zod schemas
export type ParsedAction = z.infer<typeof ParsedActionSchema>;
type AIParseResult = z.infer<typeof AIParseResultSchema>;

export class AIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: import.meta.env.OPENROUTER_API_KEY,
    });
  }

  /**
   * Parse text/voice command using AI and return structured actions
   */
  async parseCommand(command: string, context: CommandContext): Promise<AIParseResult> {
    const systemPrompt = this.buildSystemPrompt(context);
    const userPrompt = this.buildUserPrompt(command);

    try {
      const response = await this.client.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: zodResponseFormat(AIParseResultSchema, "voice_command_parse"),
        temperature: 0.1,
        max_tokens: 5000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI service");
      }

      return this.parseAIResponse(content);
    } catch (error) {
      console.error("AI service error:", error);
      throw new Error("Failed to process voice command with AI");
    }
  }

  /**
   * Generate natural language response for voice query results
   */
  async generateQueryResponse(
    query: string,
    results: { name: string; quantity: number; shelf_name: string; container_name: string }[]
  ): Promise<string> {
    const systemPrompt = `You are a helpful assistant for a Polish freezer/fridge management app called MyFreezer.
Your task is to generate natural, conversational Polish responses to user queries about their inventory.
Be concise but informative. Use Polish language naturally.`;

    const userPrompt = `User asked: "${query}"

Found items:
${results.map((item) => `- ${item.name}: ${item.quantity} sztuk na ${item.shelf_name} w ${item.container_name}`).join("\n")}

Generate a natural Polish response summarizing these results.`;

    try {
      const response = await this.client.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      return response.choices[0]?.message?.content || "Znaleziono wyniki wyszukiwania.";
    } catch (error) {
      console.error("AI response generation error:", error);
      return "Znaleziono wyniki wyszukiwania.";
    }
  }

  private buildSystemPrompt(context: CommandContext): string {
    return `You are a text command parser for a Polish fridge/freezer management app called MyFreezer.

Your task is to analyze Polish natural-language commands from users and return structured JSON responses representing clear operations on items stored in the fridge or freezer.

### 📦 CONTEXT
- All data: ${context.allData}
- Default shelf (if unspecified): ${context.default_shelf_id || "none"}

### 📋 RULES
1. If multiple items with the same name exist in different locations and the command doesn't clearly indicate which to remove:
   - Ask for clarification unless the command suggests removing all.
2. "success" must be:
   - true if the command is valid and unambiguous.
   - false otherwise.
3. If the command is unclear or ambiguous, ask the user to clarify.
4. If the user asks about an item:
   - Treat this as an "info" action.
   - ALWAYS tell about every location of the item, not only the first one
   - Return a friendly message with:
     - the item's name,
     - total quantity,
     - container type (e.g., fridge/freezer),
     - shelf position(s).
5. When adding or removing an item without a specified container/shelf, default to:
   - Shelf ID: \${context.default_shelf_id || "none"}
6. NEVER reply with **Sprawdzono** It is completely not interesting. Always return an "info" action with a friendly, informative message.
7. If the user asks about a type of food (e.g., "chicken"):
   - Return info about all items made with that ingredient or type.
8. Do not hallucinate.
   - If something is not known or cannot be determined, state that clearly.
9. If the user asks about an item not in the system, respond that the item is not present.

### 🔄 NORMALIZATION RULES
- Normalize item names to Polish popular form:
  (e.g., mleka → mleko, chleby → chleb, ziemniaki → ziemniaki, worek ziemniaków → ziemniaki).
- Convert Polish quantity words to numerical values
  (e.g., dwa → 2, pięć → 5).
- Interpret Polish descriptions of shelf positions
  (e.g., pierwsza półka → position 1).
- Convert container name types:
  - lodówka → fridge
  - zamrażarka → freezer
`;
  }

  private buildUserPrompt(command: string): string {
    return command;
  }

  private parseAIResponse(content: string): AIParseResult {
    try {
      // Clean the response to extract JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in AI response");
      }

      const jsonData = JSON.parse(jsonMatch[0]);

      // Validate using ZOD schema
      const validatedData = AIParseResultSchema.parse(jsonData);

      return validatedData;
    } catch (error) {
      console.error("Failed to parse AI response:", error);

      // Return a fallback response that matches the schema
      return {
        actions: [],
        message: "Nie mogę zrozumieć polecenia. Spróbuj ponownie.",
        needs_clarification: true,
        clarification_question: "Możesz powtórzyć polecenie w inny sposób?",
      };
    }
  }
}
