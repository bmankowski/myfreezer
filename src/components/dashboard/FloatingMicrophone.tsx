import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { VoiceProcessCommandDTO, VoiceProcessResponseDTO } from '@/types';

interface VoiceState {
  isRecording: boolean;
  isProcessing: boolean;
  hasPermission: boolean | null;
  error: string | null;
  progress: number;
}

interface FloatingMicrophoneProps {
  defaultContainerId?: string;
  onCommandSuccess?: (response: VoiceProcessResponseDTO) => void;
  onCommandError?: (error: string) => void;
}

export function FloatingMicrophone({
  defaultContainerId,
  onCommandSuccess,
  onCommandError,
}: FloatingMicrophoneProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isRecording: false,
    isProcessing: false,
    hasPermission: null,
    error: null,
    progress: 0,
  });

  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [progressInterval, setProgressInterval] = useState<NodeJS.Timeout | null>(null);

  // Check for Web Speech API support and permissions
  useEffect(() => {
    const checkSupport = async () => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        setVoiceState(prev => ({ 
          ...prev, 
          hasPermission: false, 
          error: 'Speech recognition not supported' 
        }));
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setVoiceState(prev => ({ ...prev, hasPermission: true }));
      } catch (error) {
        setVoiceState(prev => ({ 
          ...prev, 
          hasPermission: false, 
          error: 'Microphone permission denied' 
        }));
      }
    };

    checkSupport();
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (voiceState.hasPermission) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setVoiceState(prev => ({ ...prev, isRecording: true, error: null }));
        startProgressTimer();
      };

      recognition.onend = () => {
        setVoiceState(prev => ({ ...prev, isRecording: false, progress: 0 }));
        clearProgressTimer();
      };

      recognition.onerror = (event) => {
        setVoiceState(prev => ({ 
          ...prev, 
          isRecording: false, 
          error: `Speech recognition error: ${event.error}`,
          progress: 0 
        }));
        clearProgressTimer();
        onCommandError?.(`Speech recognition error: ${event.error}`);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        processVoiceCommand(transcript);
      };

      setRecognition(recognition);
    }
  }, [voiceState.hasPermission]);

  const startProgressTimer = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 100 / 30; // 30 second timeout
      setVoiceState(prev => ({ ...prev, progress }));
      
      if (progress >= 100) {
        clearInterval(interval);
        recognition?.stop();
      }
    }, 1000);
    
    setProgressInterval(interval);
  };

  const clearProgressTimer = () => {
    if (progressInterval) {
      clearInterval(progressInterval);
      setProgressInterval(null);
    }
  };

  const processVoiceCommand = async (transcript: string) => {
    setVoiceState(prev => ({ ...prev, isProcessing: true }));
    
    try {
      const command: VoiceProcessCommandDTO = {
        command: transcript,
        context: {
          default_container_id: defaultContainerId,
        },
      };

      const response = await fetch('/api/voice/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        throw new Error('Voice command processing failed');
      }

      const result: VoiceProcessResponseDTO = await response.json();
      
      if (result.success) {
        onCommandSuccess?.(result);
      } else {
        onCommandError?.(result.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Voice command failed';
      setVoiceState(prev => ({ ...prev, error: errorMessage }));
      onCommandError?.(errorMessage);
    } finally {
      setVoiceState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const handleMicrophoneClick = useCallback(() => {
    if (!recognition || !voiceState.hasPermission) {
      onCommandError?.('Speech recognition not available');
      return;
    }

    if (voiceState.isRecording) {
      recognition.stop();
    } else if (!voiceState.isProcessing) {
      recognition.start();
    }
  }, [recognition, voiceState.hasPermission, voiceState.isRecording, voiceState.isProcessing, onCommandError]);

  // Don't render if no permission or not supported
  if (voiceState.hasPermission === false) {
    return null;
  }

  const isActive = voiceState.isRecording || voiceState.isProcessing;
  const buttonColor = voiceState.isRecording 
    ? 'bg-red-500 hover:bg-red-600' 
    : voiceState.isProcessing 
    ? 'bg-yellow-500 hover:bg-yellow-600'
    : 'bg-blue-500 hover:bg-blue-600';

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="relative">
        {/* Progress ring */}
        {voiceState.isRecording && (
          <svg
            className="absolute inset-0 w-16 h-16 transform -rotate-90"
            viewBox="0 0 64 64"
          >
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-gray-200"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - voiceState.progress / 100)}`}
              className="text-red-500 transition-all duration-1000 ease-linear"
            />
          </svg>
        )}
        
        <Button
          onClick={handleMicrophoneClick}
          disabled={voiceState.hasPermission === null}
          className={`w-16 h-16 rounded-full shadow-lg transition-all duration-200 ${buttonColor} ${
            isActive ? 'scale-110' : 'hover:scale-105'
          }`}
        >
          {voiceState.isRecording ? (
            <MicOff className="h-6 w-6 text-white" />
          ) : (
            <Mic className="h-6 w-6 text-white" />
          )}
        </Button>

        {/* Status indicator */}
        {isActive && (
          <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-green-400 animate-pulse" />
        )}
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
        {voiceState.isRecording 
          ? 'Recording... Click to stop' 
          : voiceState.isProcessing 
          ? 'Processing...' 
          : 'Click to record voice command'}
      </div>
    </div>
  );
} 