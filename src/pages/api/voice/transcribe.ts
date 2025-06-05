import type { APIRoute } from "astro";
import { validateAuthToken, createErrorResponse, createSuccessResponse } from "../../../lib/auth.utils.js";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://api.openai.com/v1/",
  apiKey: import.meta.env.OPENAI_API_KEY,
});

// POST /api/voice/transcribe - Transcribe audio to text using Whisper
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    // Validate authentication
    const authResult = await validateAuthToken(request, locals.supabase);
    if (!authResult.success) {
      return createErrorResponse(401, authResult.error || "Unauthorized");
    }

    // Get form data with audio file
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return createErrorResponse(400, "Audio file is required");
    }

    // Validate file type
    const validTypes = ["audio/webm", "audio/wav", "audio/mp3", "audio/mp4", "audio/m4a"];
    if (!validTypes.includes(audioFile.type)) {
      return createErrorResponse(400, "Invalid audio file type. Supported: webm, wav, mp3, mp4, m4a");
    }

    // Check file size (max 25MB for Whisper)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (audioFile.size > maxSize) {
      return createErrorResponse(400, "Audio file too large. Maximum size: 25MB");
    }

    console.log("🎵 Transcribing audio:", {
      type: audioFile.type,
      size: audioFile.size,
      name: audioFile.name,
    });

    try {
      // Convert File to buffer for OpenAI API
      const arrayBuffer = await audioFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Create a file-like object for OpenAI API
      const audioBuffer = new File([buffer], audioFile.name || "recording.webm", {
        type: audioFile.type,
      });

      console.log("💾 Audio buffer prepared for API");

      // Transcribe using OpenAI gpt-4o-mini-transcribe
      const transcription = await openai.audio.transcriptions.create({
        file: audioBuffer,
        model: "gpt-4o-mini-transcribe",
        language: "pl",
        response_format: "text",
      });

      const transcribedText = transcription.toString().trim();

      console.log("✅ Transcription successful:", transcribedText);

      if (!transcribedText || transcribedText.length === 0) {
        return createErrorResponse(400, "No speech detected in audio");
      }

      return createSuccessResponse({
        transcript: transcribedText,
        language: "pl",
        duration: audioFile.size / 16000, // rough estimate
      });
    } catch (error) {
      console.error("❌ gpt-4o-mini-transcrib API error:", error);

      if (error instanceof Error) {
        if (error.message.includes("rate_limit")) {
          return createErrorResponse(429, "Transcription service rate limited. Please try again later.");
        }
        if (error.message.includes("insufficient_quota")) {
          return createErrorResponse(503, "Transcription service quota exceeded");
        }
        if (error.message.includes("invalid_request_error")) {
          return createErrorResponse(400, "Invalid audio format or corrupted file");
        }
      }

      return createErrorResponse(500, "Failed to transcribe audio");
    }
  } catch (error) {
    console.error("Transcription endpoint error:", error);
    return createErrorResponse(500, "Internal server error");
  }
};
