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
    <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-3 md:p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <Textarea
              value={currentValue}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Mesajınızı yazın..."
              disabled={disabled}
              className="min-h-[52px] md:min-h-[56px] max-h-[200px] resize-none pr-3 text-sm shadow-sm"
              rows={2}
            />
            <div className="hidden md:block absolute bottom-2 right-3 text-xs text-muted-foreground">
              <span className="text-[10px]">Shift+Enter ile yeni satır</span>
            </div>
          </div>

          <Button 
            onClick={handleSend} 
            disabled={disabled || !currentValue.trim()} 
            size="icon"
            className="h-[52px] w-[52px] md:h-[56px] md:w-[56px] flex-shrink-0 shadow-sm"
          >
            <Send className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
