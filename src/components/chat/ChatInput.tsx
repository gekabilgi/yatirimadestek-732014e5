import { useState, KeyboardEvent } from "react";
import { Send, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function ChatInput({ 
  onSendMessage, 
  disabled, 
  value, 
  onValueChange 
}: ChatInputProps) {
  const [internalValue, setInternalValue] = useState("");
  
  // Use external value if provided, otherwise internal
  const currentValue = value !== undefined ? value : internalValue;
  const setValue = onValueChange || setInternalValue;

  const handleSend = () => {
    if (!currentValue.trim() || disabled) return;

    onSendMessage(currentValue.trim());
    setValue("");
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
            value={currentValue}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Mesajınızı yazın... (Enter ile gönderin, Shift+Enter ile yeni satır)"
            disabled={disabled}
            className="min-h-[60px] max-h-[200px] resize-none"
            rows={2}
          />

          <Button onClick={handleSend} disabled={disabled || !currentValue.trim()} size="icon" className="flex-shrink-0">
            <Send className="h-5 w-5" />
          </Button>
        </div>

        <div className="text-xs text-muted-foreground mt-2 text-center">{currentValue.length} karakter</div>
      </div>
    </div>
  );
}
