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
    const timestamp = typeof date === "number" ? date : date;
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

    const citationMap = new Map<string, JSX.Element[]>();
    const citationRegex = /\[(\d+(?:,\s*\d+)*)\]/g;
    let match;
    let citationKey = 0;

    while ((match = citationRegex.exec(content)) !== null) {
      const [fullMatch, indexStr] = match;
      const indices = indexStr.split(/,\s*/).map((s) => parseInt(s.trim()));

      const badges = indices
        .map((index) => {
          const source = sources.find((s) => s.index === index);

          if (source) {
            return (
              <HoverCard key={`citation-${citationKey++}`}>
                <HoverCardTrigger asChild>
                  <sup className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-md bg-primary/90 text-primary-foreground text-[11px] font-semibold cursor-help mx-0.5 hover:bg-primary hover:scale-105 transition-all duration-200 shadow-sm">
                    {index}
                  </sup>
                </HoverCardTrigger>
                <HoverCardContent className="w-full max-w-[90vw] sm:w-96 text-sm p-4" side="top" align="center">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="flex items-center justify-center min-w-[24px] h-6 px-2 rounded bg-primary/10 text-primary text-xs font-bold">
                        {index}
                      </div>
                      <p className="font-semibold text-foreground break-words flex-1 leading-snug">{source.title}</p>
                    </div>
                    {(source.snippet || source.text) && (
                      <div className="pl-8">
                        <p className="text-xs text-muted-foreground leading-relaxed break-words max-h-32 overflow-y-auto custom-scrollbar">
                          {source.snippet || source.text}
                        </p>
                      </div>
                    )}
                  </div>
                </HoverCardContent>
              </HoverCard>
            );
          }
          return null;
        })
        .filter(Boolean) as JSX.Element[];

      citationMap.set(fullMatch, badges);
    }

    const components = {
      p: ({ children, ...props }: any) => {
        const processedChildren = processTextWithCitations(children);
        return (
          <p className="mb-3 last:mb-0 leading-relaxed" {...props}>
            {processedChildren}
          </p>
        );
      },
      li: ({ children, ...props }: any) => {
        const processedChildren = processTextWithCitations(children);
        return (
          <li className="mb-2 leading-relaxed" {...props}>
            {processedChildren}
          </li>
        );
      },
      a: ({ node, ...props }: any) => (
        <a
          {...props}
          className="text-primary hover:underline font-medium underline-offset-2"
          target="_blank"
          rel="noopener noreferrer"
        />
      ),
      code: ({ node, className, children, ...props }: any) => {
        const match = /language-(\w+)/.exec(className || "");
        return match ? (
          <code
            className={cn(
              "block bg-muted/70 p-4 rounded-lg my-3 text-xs overflow-x-auto font-mono border border-border/50",
              className,
            )}
            {...props}
          >
            {children}
          </code>
        ) : (
          <code className="bg-muted/70 px-2 py-1 rounded text-xs font-mono border border-border/30" {...props}>
            {children}
          </code>
        );
      },
      ul: ({ node, ...props }: any) => <ul className="mb-3 ml-5 list-disc space-y-1" {...props} />,
      ol: ({ node, ...props }: any) => <ol className="mb-3 ml-5 list-decimal space-y-1" {...props} />,
      h1: ({ node, ...props }: any) => <h1 className="text-xl font-bold mb-3 mt-4" {...props} />,
      h2: ({ node, ...props }: any) => <h2 className="text-lg font-semibold mb-2 mt-3" {...props} />,
      h3: ({ node, ...props }: any) => <h3 className="text-base font-semibold mb-2 mt-2" {...props} />,
    };

    function processTextWithCitations(children: any): any {
      if (typeof children === "string") {
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
        return children.map((child, i) => (typeof child === "string" ? processTextWithCitations(child) : child));
      }
      return children;
    }

    return <ReactMarkdown components={components}>{content}</ReactMarkdown>;
  };

  return (
    <div className={cn("flex gap-3 md:gap-4 group px-3 md:px-0 py-2", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="hidden md:flex flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 items-center justify-center ring-2 ring-primary/10">
          <Bot className="h-5 w-5 text-primary" />
        </div>
      )}

      <div
        className={cn(
          "flex flex-col gap-2 max-w-[90%] sm:max-w-[85%] md:max-w-[75%] lg:max-w-[70%]",
          isUser && "items-end",
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-3 md:px-5 md:py-4 shadow-sm break-words transition-all duration-200",
            isUser
              ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-primary/20"
              : "bg-card border border-border/60 shadow-md hover:shadow-lg hover:border-border/80",
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed break-words">{content}</p>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              {sources && sources.length > 0 ? (
                renderContentWithCitations()
              ) : (
                <ReactMarkdown
                  components={{
                    a: ({ node, ...props }) => (
                      <a
                        {...props}
                        className="text-primary hover:underline font-medium underline-offset-2"
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    ),
                    code: ({ node, className, children, ...props }) => {
                      const match = /language-(\w+)/.exec(className || "");
                      return match ? (
                        <code
                          className={cn(
                            "block bg-muted/70 p-4 rounded-lg my-3 text-xs overflow-x-auto font-mono border border-border/50",
                            className,
                          )}
                          {...props}
                        >
                          {children}
                        </code>
                      ) : (
                        <code
                          className="bg-muted/70 px-2 py-1 rounded text-xs font-mono border border-border/30"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    p: ({ node, ...props }) => <p className="mb-3 last:mb-0 leading-relaxed" {...props} />,
                    ul: ({ node, ...props }) => <ul className="mb-3 ml-5 list-disc space-y-1" {...props} />,
                    ol: ({ node, ...props }) => <ol className="mb-3 ml-5 list-decimal space-y-1" {...props} />,
                    li: ({ node, ...props }) => <li className="mb-2 leading-relaxed" {...props} />,
                    h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-3 mt-4" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-lg font-semibold mb-2 mt-3" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-base font-semibold mb-2 mt-2" {...props} />,
                  }}
                >
                  {content}
                </ReactMarkdown>
              )}
            </div>
          )}
          {children}
        </div>

        <div className="flex items-center gap-2 px-2 min-h-[24px]">
          {timestamp && (
            <span className="text-[11px] text-muted-foreground/70 font-medium">{formatTime(timestamp)}</span>
          )}
          <MessageActions content={content} isAssistant={!isUser} onRegenerate={onRegenerate} />
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-full bg-primary flex items-center justify-center shadow-md shadow-primary/30">
          <User className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
        </div>
      )}
    </div>
  );
}
