import { useState, KeyboardEvent, useEffect, useRef } from "react";
import { Send, Square, Mic, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
  onStop?: () => void;
  isGenerating?: boolean;
}

export function ChatInput({ 
  onSendMessage, 
  disabled, 
  value, 
  onValueChange,
  onStop,
  isGenerating = false
}: ChatInputProps) {
  const [internalValue, setInternalValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const maxLength = 2000;
  
  // Use external value if provided, otherwise internal
  const currentValue = value !== undefined ? value : internalValue;
  const setValue = onValueChange || setInternalValue;

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [currentValue]);

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

  const handleStop = () => {
    if (onStop) {
      onStop();
    }
  };

  const charCount = currentValue.length;
  const isNearLimit = charCount > maxLength * 0.8;
  const isOverLimit = charCount > maxLength;

  return (
    <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-3 md:p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-2 items-end">
          {/* Voice input button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-[52px] w-[52px] md:h-[56px] md:w-[56px] flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
            disabled={disabled || isGenerating}
            title="Sesli giriş (yakında)"
          >
            <Mic className="h-5 w-5" />
          </Button>

          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={currentValue}
              onChange={(e) => {
                if (e.target.value.length <= maxLength) {
                  setValue(e.target.value);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="Mesajınızı yazın..."
              disabled={disabled}
              className="min-h-[52px] md:min-h-[56px] max-h-[200px] resize-none pr-16 text-sm shadow-sm transition-all"
              rows={1}
            />
            
            {/* Character counter */}
            {(isNearLimit || currentValue.length > 0) && (
              <div className={`absolute bottom-2 right-3 text-[10px] transition-colors ${
                isOverLimit ? 'text-destructive font-medium' : 
                isNearLimit ? 'text-warning' : 
                'text-muted-foreground'
              }`}>
                {charCount}/{maxLength}
              </div>
            )}
            
            {/* Keyboard hint */}
            {!isNearLimit && currentValue.length === 0 && (
              <div className="hidden md:block absolute bottom-2 right-3 text-xs text-muted-foreground">
                <span className="text-[10px]">Shift+Enter ile yeni satır</span>
              </div>
            )}
          </div>

          {/* Stop or Send button */}
          {isGenerating ? (
            <Button 
              onClick={handleStop}
              size="icon"
              variant="destructive"
              className="h-[52px] w-[52px] md:h-[56px] md:w-[56px] flex-shrink-0 shadow-lg hover:shadow-xl transition-all"
              title="Durdurun"
            >
              <Square className="h-4 w-4 md:h-5 md:w-5 fill-current" />
            </Button>
          ) : (
            <Button 
              onClick={handleSend} 
              disabled={disabled || !currentValue.trim() || isOverLimit} 
              size="icon"
              className="h-[52px] w-[52px] md:h-[56px] md:w-[56px] flex-shrink-0 shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90 disabled:opacity-50"
              title="Gönder"
            >
              {disabled && !isGenerating ? (
                <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin" />
              ) : (
                <Send className="h-4 w-4 md:h-5 md:w-5" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
