import { Bot, User } from "lucide-react";
import { MessageActions } from "./MessageActions";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string | number;
  onRegenerate?: () => void;
  children?: React.ReactNode;
  sources?: Array<{
    title: string;
    uri?: string;
    snippet?: string;
    text?: string;
    index?: number;
  }>;
}

export function MessageBubble({ role, content, timestamp, onRegenerate, children, sources }: MessageBubbleProps) {
  const isUser = role === "user";
  
  const formatTime = (date: string | number) => {
    const timestamp = typeof date === 'number' ? date : date;
    return new Date(timestamp).toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Process markdown content and inject citation badges
  const renderContentWithCitations = () => {
    if (!sources || sources.length === 0 || isUser) {
      return content;
    }

    // Create a map of citation patterns to badge components
    const citationMap = new Map<string, JSX.Element[]>();
    const citationRegex = /\[(\d+(?:,\s*\d+)*)\]/g;
    let match;
    let citationKey = 0;

    while ((match = citationRegex.exec(content)) !== null) {
      const [fullMatch, indexStr] = match;
      const indices = indexStr.split(/,\s*/).map(s => parseInt(s.trim()));
      
      const badges = indices.map((index) => {
        const source = sources.find(s => s.index === index);
        
        if (source) {
          return (
            <HoverCard key={`citation-${citationKey++}`}>
              <HoverCardTrigger asChild>
                <sup className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold cursor-help mx-0.5 hover:bg-primary/80 transition-colors">
                  {index}
                </sup>
              </HoverCardTrigger>
              <HoverCardContent className="w-full max-w-[90vw] sm:w-80 text-sm" side="top" align="center">
                <div className="space-y-2">
                  <p className="font-semibold text-primary break-words">{source.title}</p>
                  {(source.snippet || source.text) && (
                    <p className="text-xs text-muted-foreground leading-relaxed break-words max-h-48 overflow-y-auto">
                      {source.snippet || source.text}
                    </p>
                  )}
                </div>
              </HoverCardContent>
            </HoverCard>
          );
        }
        return null;
      }).filter(Boolean) as JSX.Element[];

      citationMap.set(fullMatch, badges);
    }

    // Custom text renderer that replaces citation patterns with badges
    const components = {
      p: ({ children, ...props }: any) => {
        const processedChildren = processTextWithCitations(children);
        return <p className="mb-2 last:mb-0" {...props}>{processedChildren}</p>;
      },
      li: ({ children, ...props }: any) => {
        const processedChildren = processTextWithCitations(children);
        return <li className="mb-1" {...props}>{processedChildren}</li>;
      },
      a: ({ node, ...props }: any) => (
        <a
          {...props}
          className="text-primary hover:underline font-medium"
          target="_blank"
          rel="noopener noreferrer"
        />
      ),
      code: ({ node, className, children, ...props }: any) => {
        const match = /language-(\w+)/.exec(className || "");
        return match ? (
          <code className={cn("block bg-muted p-3 rounded-lg my-2 text-xs overflow-x-auto", className)} {...props}>
            {children}
          </code>
        ) : (
          <code className="bg-muted px-1.5 py-0.5 rounded text-xs" {...props}>
            {children}
          </code>
        );
      },
      ul: ({ node, ...props }: any) => <ul className="mb-2 ml-4 list-disc" {...props} />,
      ol: ({ node, ...props }: any) => <ol className="mb-2 ml-4 list-decimal" {...props} />,
    };

    function processTextWithCitations(children: any): any {
      if (typeof children === 'string') {
        const parts: (string | JSX.Element)[] = [];
        let lastIndex = 0;
        const regex = /\[(\d+(?:,\s*\d+)*)\]/g;
        let textMatch;

        while ((textMatch = regex.exec(children)) !== null) {
          if (textMatch.index > lastIndex) {
            parts.push(children.slice(lastIndex, textMatch.index));
          }

          const badges = citationMap.get(textMatch[0]);
          if (badges) {
            parts.push(...badges);
          } else {
            parts.push(textMatch[0]);
          }

          lastIndex = textMatch.index + textMatch[0].length;
        }

        if (lastIndex < children.length) {
          parts.push(children.slice(lastIndex));
        }

        return parts.length > 0 ? parts : children;
      } else if (Array.isArray(children)) {
        return children.map((child, i) => 
          typeof child === 'string' ? processTextWithCitations(child) : child
        );
      }
      return children;
    }

    return (
      <ReactMarkdown components={components}>
        {content}
      </ReactMarkdown>
    );
  };

  return (
    <div className={cn("flex gap-2 md:gap-3 group px-2 md:px-0", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="hidden md:flex flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 items-center justify-center">
          <Bot className="h-5 w-5 text-primary" />
        </div>
      )}
      
      <div className={cn("flex flex-col gap-1.5 md:gap-2 max-w-[90%] sm:max-w-[85%] md:max-w-[80%]", isUser && "items-end")}>
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
              {sources && sources.length > 0 ? (
                renderContentWithCitations()
              ) : (
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
                        <code className={cn("block bg-muted p-3 rounded-lg my-2 text-xs overflow-x-auto", className)} {...props}>
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
              )}
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
