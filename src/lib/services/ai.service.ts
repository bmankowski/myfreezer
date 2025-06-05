import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

interface VoiceCommandContext {
  default_container_id?: string;
  containers?: {
    container_id: string;
    name: string;
    type: "freezer" | "fridge";
  }[];
  shelves?: {
    shelf_id: string;
    name: string;
    position: number;
    container_id: string;
  }[];
  allData: string;
  previousMessages?: {
    role: "user" | "assistant";
    content: string;
  }[];
}

// ZOD Schemas for validation
const ParsedActionSchema = z.object({
  type: z
    .enum(["add_item", "remove_item", "update_item", "query_item", "clarify_message"])
    .describe("Type of action to be performed"),
  item_name: z.string().describe("Name of the item to be added, removed, updated, or queried"),
  quantity: z.number().describe("Quantity of the item to be added, removed, or updated"),
  shelf_id: z.number().describe("Id of the shelf to be used for the action"),
});

const AIParseResultSchema = z.object({
  actions: z.array(ParsedActionSchema).describe("Actions to be performed"),
  message: z.string().describe("Message to be displayed to the user"),
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
   * Parse voice command using AI and return structured actions
   */
  async parseVoiceCommand(command: string, context: VoiceCommandContext): Promise<AIParseResult> {
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
        max_tokens: 1000,
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
        max_tokens: 200,
      });

      return response.choices[0]?.message?.content || "Znaleziono wyniki wyszukiwania.";
    } catch (error) {
      console.error("AI response generation error:", error);
      return "Znaleziono wyniki wyszukiwania.";
    }
  }

  private buildSystemPrompt(context: VoiceCommandContext): string {
    return `You are a voice command parser for a Polish freezer/fridge management app called MyFreezer.
Your task is to parse voice commands and return structured JSON responses for freezer/fridge operations.

ALL DATA: ${context.allData}
DEFAULT CONTAINER: ${context.default_container_id || "none"}

RULES:
1. if there are many items with the same name in different locations and it's unclear which one should be removed, ask for clarification
2. success is true if the command is valid and the operation is clear, false otherwise
3. if the command is not clear, ask for clarification
4. if container or shelf is not specified, use default shelf

NORMALIZATION RULES:
- Convert item names to Polish singular form (mleka → mleko, chleby → chleb)
- Parse quantities from Polish text (dwa → 2, pięć → 5)
- Match shelf names/positions (pierwsza półka → position 1)
- Match container names/types (lodówka → fridge, zamrażarka → freezer)

RESPOND ONLY WITH VALID JSON. NO EXPLANATIONS OUTSIDE JSON.`;
  }

  private buildUserPrompt(command: string): string {
    return `Parse this Polish voice command: "${command}"`;
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
