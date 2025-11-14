import { useState, KeyboardEvent } from "react";
import { Send, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim() || disabled) return;

    onSendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t bg-background p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-2 items-end">
          <Button variant="ghost" size="icon" disabled={disabled} className="flex-shrink-0"></Button>

          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Mesajınızı yazın... (Enter ile gönderin, Shift+Enter ile yeni satır)"
            disabled={disabled}
            className="min-h-[60px] max-h-[200px] resize-none"
            rows={2}
          />

          <Button onClick={handleSend} disabled={disabled || !input.trim()} size="icon" className="flex-shrink-0">
            <Send className="h-5 w-5" />
          </Button>
        </div>

        <div className="text-xs text-muted-foreground mt-2 text-center">{input.length} karakter</div>
      </div>
    </div>
  );
}
