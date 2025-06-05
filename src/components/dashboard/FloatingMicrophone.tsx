import React, { useState, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VoiceProcessCommandDTO, VoiceProcessResponseDTO } from "@/types";

interface VoiceState {
  isRecording: boolean;
  isProcessing: boolean;
  hasPermission: boolean | null;
  error: string | null;
}

interface FloatingMicrophoneProps {
  defaultShelfId?: string;
  onCommandSuccess?: (response: VoiceProcessResponseDTO) => void;
  onCommandError?: (error: string) => void;
}

export function FloatingMicrophone({ onCommandSuccess, onCommandError }: FloatingMicrophoneProps) {
  const [state, setState] = useState<VoiceState>({
    isRecording: false,
    isProcessing: false,
    hasPermission: null,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Process recorded audio through Whisper + voice command
  const processAudio = useCallback(
    async (audioBlob: Blob) => {
      try {
        // Step 1: Transcribe audio to text using Whisper
        console.log("📝 Transcribing audio...");

        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");

        const headers: HeadersInit = {};
        const token = localStorage.getItem("access_token");
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const transcribeResponse = await fetch("/api/voice/transcribe", {
          method: "POST",
          headers,
          body: formData,
        });

        if (!transcribeResponse.ok) {
          const errorData = await transcribeResponse.json();
          throw new Error(errorData.error || "Transcription failed");
        }

        const transcriptionData = await transcribeResponse.json();
        const transcript = transcriptionData.transcript;

        console.log("✅ Transcription:", transcript);

        // Step 2: Process the transcribed command
        console.log("🤖 Processing voice command...");

        const commandDTO: VoiceProcessCommandDTO = {
          command: transcript,
        };

        const processResponse = await fetch("/api/voice/process", {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(commandDTO),
        });

        if (!processResponse.ok) {
          const errorData = await processResponse.json();
          throw new Error(errorData.error || "Command processing failed");
        }

        const responseData: VoiceProcessResponseDTO = await processResponse.json();
        console.log("✅ Command processed:", responseData);

        setState((prev) => ({ ...prev, isProcessing: false, error: null }));

        // Call success callback
        if (onCommandSuccess) {
          onCommandSuccess(responseData);
        }
      } catch (error) {
        console.error("❌ Audio processing error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: errorMessage,
        }));

        if (onCommandError) {
          onCommandError(errorMessage);
        }
      }
    },
    [onCommandSuccess, onCommandError]
  );

  // Request microphone permission and start recording
  const startRecording = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, error: null, isRecording: true }));

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      streamRef.current = stream;
      setState((prev) => ({ ...prev, hasPermission: true }));

      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setState((prev) => ({ ...prev, isRecording: false, isProcessing: true }));

        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        console.log("🎵 Audio recorded:", { size: audioBlob.size, type: audioBlob.type });

        // Stop and cleanup stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        // Process the recorded audio
        await processAudio(audioBlob);
      };

      // Start recording
      mediaRecorder.start();
      console.log("🎤 Recording started...");
    } catch (error) {
      console.error("❌ Microphone access error:", error);
      setState((prev) => ({
        ...prev,
        isRecording: false,
        hasPermission: false,
        error: error instanceof Error ? error.message : "Microphone access denied",
      }));
    }
  }, [processAudio]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      console.log("🛑 Recording stopped");
    }
  }, []);

  // Toggle recording
  const toggleRecording = useCallback(() => {
    if (state.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [state.isRecording, startRecording, stopRecording]);

  // Determine button appearance
  const getButtonContent = () => {
    if (state.isProcessing) {
      return <Loader2 className="h-6 w-6 animate-spin" />;
    }

    if (state.error) {
      return <AlertCircle className="h-6 w-6 text-red-500" />;
    }

    if (state.isRecording) {
      return <MicOff className="h-6 w-6 text-red-500" />;
    }

    return <Mic className="h-6 w-6" />;
  };

  const getButtonClass = () => {
    const baseClass =
      "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50";

    if (state.isRecording) {
      return `${baseClass} bg-red-500 hover:bg-red-600 text-white animate-pulse`;
    }

    if (state.error) {
      return `${baseClass} bg-red-100 hover:bg-red-200 border-2 border-red-300`;
    }

    if (state.isProcessing) {
      return `${baseClass} bg-blue-500 text-white cursor-not-allowed`;
    }

    return `${baseClass} bg-primary hover:bg-primary/90 text-primary-foreground`;
  };

  const getTitle = () => {
    if (state.isProcessing) return "Processing audio...";
    if (state.error) return `Error: ${state.error}`;
    if (state.isRecording) return "Click to stop recording";
    if (state.hasPermission === false) return "Click to request microphone permission";
    return "Click to start voice command";
  };

  return (
    <Button
      onClick={toggleRecording}
      disabled={state.isProcessing}
      className={getButtonClass()}
      title={getTitle()}
      size="icon"
    >
      {getButtonContent()}
    </Button>
  );
}
