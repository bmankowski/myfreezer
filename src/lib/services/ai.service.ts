import OpenAI from "openai";

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
}

interface ParsedAction {
  type: "add_item" | "remove_item" | "update_item" | "query_item";
  item_name: string;
  quantity: number;
  shelf_identifier?: string; // name or position
  container_identifier?: string; // name or type
}

interface AIParseResult {
  success: boolean;
  actions: ParsedAction[];
  message: string;
  needs_clarification?: boolean;
  clarification_question?: string;
}

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
  async generateQueryResponse(query: string, results: any[]): Promise<string> {
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
    const containersInfo =
      context.containers?.map((c) => `${c.name} (${c.type}, ID: ${c.container_id})`).join(", ") || "";

    const shelvesInfo =
      context.shelves?.map((s) => `${s.name} (pozycja ${s.position}, ID: ${s.shelf_id})`).join(", ") || "";

    return `You are a voice command parser for a Polish freezer/fridge management app called MyFreezer.

Your task is to parse Polish voice commands and return structured JSON responses for freezer/fridge operations.

AVAILABLE CONTAINERS: ${containersInfo}
AVAILABLE SHELVES: ${shelvesInfo}
DEFAULT CONTAINER: ${context.default_container_id || "none"}

SUPPORTED OPERATIONS:
1. add_item - dodaj, wstaw, włóż items to shelf
2. remove_item - wyjmij, usuń specific quantities 
3. update_item - zmień quantity to specific amount
4. query_item - sprawdź, gdzie jest, ile mam

RESPONSE FORMAT (JSON only):
{
  "success": true/false,
  "actions": [
    {
      "type": "add_item|remove_item|update_item|query_item",
      "item_name": "normalized_polish_name",
      "quantity": number,
      "shelf_identifier": "shelf_name_or_position",
      "container_identifier": "container_name_or_type"
    }
  ],
  "message": "Polish summary of what will be done",
  "needs_clarification": true/false,
  "clarification_question": "Polish question if unclear"
}

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

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (typeof parsed.success !== "boolean") {
        throw new Error("Invalid AI response format");
      }

      return {
        success: parsed.success,
        actions: parsed.actions || [],
        message: parsed.message || "",
        needs_clarification: parsed.needs_clarification || false,
        clarification_question: parsed.clarification_question,
      };
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      return {
        success: false,
        actions: [],
        message: "Nie mogę zrozumieć polecenia. Spróbuj ponownie.",
        needs_clarification: true,
        clarification_question: "Możesz powtórzyć polecenie w inny sposób?",
      };
    }
  }
}
