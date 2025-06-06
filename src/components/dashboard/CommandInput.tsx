import { useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CommandInputProps {
  onToast: (message: string, type?: "success" | "error") => void;
}

export function CommandInput({ onToast }: CommandInputProps) {
  const [commandInput, setCommandInput] = useState("");
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim() || isProcessingCommand) return;

    setIsProcessingCommand(true);

    try {
      const response = await fetch("/api/command/process", {
        method: "POST",
        credentials: "include", // Include cookies
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ command: commandInput }),
      });

      await response.json();

      if (response.ok) {
        onToast("Command processed successfully", "success");
        setCommandInput(""); // Clear input on success
      } else {
        if (response.status === 401) {
          onToast("Authentication error. Please log in again.", "error");
        } else {
          onToast("Command failed. Please try again.", "error");
        }
      }
    } catch (error) {
      console.error("Command processing error:", error);
      onToast("Failed to process command. Please try again.", "error");
    } finally {
      setIsProcessingCommand(false);
    }
  };

  return (
    <form onSubmit={handleCommandSubmit} className="flex-1 relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <MessageSquare className="h-5 w-5 text-gray-400" />
      </div>
      <Input
        type="text"
        placeholder="Add command... (e.g., 'dodaj 2 mleka na pierwszą półkę')"
        value={commandInput}
        onChange={(e) => setCommandInput(e.target.value)}
        disabled={isProcessingCommand}
        className="pl-10 pr-12 w-96"
      />
      <button
        type="submit"
        disabled={!commandInput.trim() || isProcessingCommand}
        className="absolute inset-y-0 right-0 pr-3 flex items-center"
      >
        {isProcessingCommand ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        ) : (
          <Send className="h-4 w-4 text-gray-400 hover:text-blue-600 disabled:text-gray-300" />
        )}
      </button>
    </form>
  );
} 