import type { APIRoute } from "astro";
import { validateAuthToken, createErrorResponse, createSuccessResponse } from "../../../lib/auth.utils.js";
import OpenAI from "openai";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";

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

    // Writing audioFile to disc
    const tmpDir = "./tmp";

    // Ensure tmp directory exists
    await fsPromises.mkdir(tmpDir, { recursive: true });

    // Create unique filename with timestamp and original extension
    const timestamp = Date.now();
    const fileExtension = audioFile.name.split(".").pop() || "webm";
    const filename = `audio_${timestamp}.${fileExtension}`;
    const filePath = path.join(tmpDir, filename);

    // Convert File to Buffer and write to disk
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fsPromises.writeFile(filePath, buffer);

    console.log("💾 Audio file written to disk:", filePath);

    try {
      // Transcribe using OpenAI Whisper
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
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
        language: "en",
        duration: audioFile.size / 16000, // rough estimate
      });
    } catch (error) {
      console.error("❌ Whisper API error:", error);

      if (error instanceof Error) {
        if (error.message.includes("rate_limit")) {
          return createErrorResponse(429, "Transcription service rate limited. Please try again later.");
        }
        if (error.message.includes("insufficient_quota")) {
          return createErrorResponse(503, "Transcription service quota exceeded");
        }
      }

      return createErrorResponse(500, "Failed to transcribe audio");
    }
  } catch (error) {
    console.error("Transcription endpoint error:", error);
    return createErrorResponse(500, "Internal server error");
  }
};
