import React, { useState, useEffect, useRef } from "react";
import { ExternalLink } from "lucide-react";
import type { ChatMessage } from "@/hooks/useChatSession";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";

interface ChatMessageAreaProps {
  messages: ChatMessage[];
  isLoading: boolean;
  currentSuggestion?: string;
  onSuggestionClick?: (suggestion: string) => void;
  isGeneratingQuestions?: boolean;
}

// Typing dots animation
const TypingDots = () => (
  <div className="flex gap-1 p-3">
    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
  </div>
);

export function ChatMessageArea({
  messages,
  isLoading,
  currentSuggestion,
  onSuggestionClick,
  isGeneratingQuestions,
}: ChatMessageAreaProps) {
  const [modalContent, setModalContent] = useState<string | null>(null);
  const handleSourceClick = (text: string) => {
    setModalContent(text);
  };

  const closeModal = () => {
    setModalContent(null);
  };
  return (
    <div className="p-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
            <div className="max-w-2xl w-full text-center space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Nasıl yardımcı olabilirim?</h2>
                <p className="text-muted-foreground">
                  Yatırım teşvikleri, destek programları ve mevzuat hakkında sorularınızı cevaplayabilirim.
                </p>
              </div>

              {/* Rotating Suggestion */}
              <div className="min-h-[4rem] flex items-center justify-center">
                {isGeneratingQuestions ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                    <span className="text-sm">Örnek sorular hazırlanıyor...</span>
                  </div>
                ) : currentSuggestion && !isLoading ? (
                  <button
                    onClick={() => onSuggestionClick?.(currentSuggestion)}
                    className="group relative px-6 py-3 rounded-full border border-primary/20 
                               bg-primary/5 hover:bg-primary/10 hover:border-primary/40
                               transition-all duration-200 shadow-sm hover:shadow-md
                               max-w-xl w-full"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">Örnek soru:</span>
                      <span className="text-sm font-medium text-foreground">"{currentSuggestion}"</span>
                    </div>
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[80%] space-y-2">
              <div
                className={`rounded-lg p-4 ${
                  message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                <div
                  className={`prose prose-sm max-w-none ${
                    message.role === "user" ? "prose-invert" : "dark:prose-invert"
                  }`}
                >
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                      li: ({ children }) => <li className="mb-1">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      code: ({ children }) => (
                        <code className="bg-background/50 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
                      ),
                      a: ({ href, children }) => {
                        // Check if it's a badge format [badge: label|url]
                        const text = String(children);
                        if (href && text.startsWith("badge:")) {
                          const label = text.replace("badge:", "").trim();
                          return (
                            <Badge
                              variant="secondary"
                              className="mx-1 cursor-pointer hover:bg-primary/20 transition-colors"
                              onClick={() => window.open(href, "_blank")}
                            >
                              {label}
                            </Badge>
                          );
                        }
                        // Regular link
                        return (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            {children}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        );
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Display sources for assistant messages */}
              {message.role === "assistant" && message.sources && message.sources.length > 0 && (
                <div className="text-xs space-y-1 pl-2">
                  <div className="font-semibold text-muted-foreground">Kaynaklar:</div>
                  {message.sources.map((source: any, idx) => {
                    // Handle both string sources and object sources like { title, uri }
                    const isObject = typeof source === "object" && source !== null;
                    const href = isObject ? source.uri || source.url : undefined;
                    const label = isObject ? source.title || source.uri || source.url : String(source);

                    return href ? (
                      <a
                        key={idx}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>{label}</span>
                      </a>
                    ) : (
                      <div key={idx} className="text-muted-foreground flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        <span>{label}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Display grounding chunks */}
              {message.role === "assistant" && message.groundingChunks && message.groundingChunks.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gem-mist/50">
                  <h4 className="text-xs font-semibold text-gem-offwhite/70 mb-2 text-right">Sources:</h4>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {message.groundingChunks.map(
                      (chunk, chunkIndex) =>
                        chunk.web?.uri && (
                          <button
                            key={chunkIndex}
                            onClick={() => handleSourceClick(chunk.web!.uri!)}
                            className="bg-gem-mist/50 hover:bg-gem-mist text-xs px-3 py-1 rounded-md transition-colors"
                            aria-label={`View source ${chunkIndex + 1}`}
                            title="View source document chunk"
                          >
                            Source {chunkIndex + 1}
                          </button>
                        ),
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="bg-muted rounded-lg">
              <TypingDots />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
