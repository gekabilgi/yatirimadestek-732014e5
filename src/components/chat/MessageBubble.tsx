import { Bot, User } from "lucide-react";
import { MessageActions } from "./MessageActions";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string | number;
  onRegenerate?: () => void;
  children?: React.ReactNode;
}

export function MessageBubble({ role, content, timestamp, onRegenerate, children }: MessageBubbleProps) {
  const isUser = role === "user";
  
  const formatTime = (date: string | number) => {
    const timestamp = typeof date === 'number' ? date : date;
    return new Date(timestamp).toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={cn("flex gap-2 md:gap-3 group px-2 md:px-0", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="h-4 w-4 md:h-5 md:w-5 text-primary" />
        </div>
      )}
      
      <div className={cn("flex flex-col gap-1.5 md:gap-2 max-w-[85%] md:max-w-[80%]", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-3 py-2.5 md:px-4 md:py-3 shadow-sm break-words",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted/50 border border-border/50"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-sm break-words">{content}</p>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert break-words">
              <ReactMarkdown
                components={{
                  a: ({ node, ...props }) => (
                    <a
                      {...props}
                      className="text-primary hover:underline font-medium"
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  ),
                  code: ({ node, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || "");
                    return match ? (
                      <code className={cn("block bg-muted p-3 rounded-lg my-2 text-xs", className)} {...props}>
                        {children}
                      </code>
                    ) : (
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs" {...props}>
                        {children}
                      </code>
                    );
                  },
                  p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                  ul: ({ node, ...props }) => <ul className="mb-2 ml-4 list-disc" {...props} />,
                  ol: ({ node, ...props }) => <ol className="mb-2 ml-4 list-decimal" {...props} />,
                  li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
          {children}
        </div>
        
        <div className="flex items-center gap-2 px-2">
          {timestamp && (
            <span className="text-xs text-muted-foreground">
              {formatTime(timestamp)}
            </span>
          )}
          <MessageActions
            content={content}
            isAssistant={!isUser}
            onRegenerate={onRegenerate}
          />
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary flex items-center justify-center">
          <User className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
        </div>
      )}
    </div>
  );
}
