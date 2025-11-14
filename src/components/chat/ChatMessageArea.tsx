import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink } from 'lucide-react';
import type { ChatMessage } from '@/hooks/useChatSession';
import ReactMarkdown from 'react-markdown';
import { Badge } from '@/components/ui/badge';

interface ChatMessageAreaProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

// Render content with badges
const renderContentWithBadges = (text: string) => {
  const badgeRegex = /\[badge:\s*([^\]|]+)\|([^\]]+)\]/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = badgeRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const label = match[1].trim();
    const url = match[2].trim();
    parts.push(
      <Badge
        key={match.index}
        variant="secondary"
        className="mx-1 cursor-pointer hover:bg-primary/20"
        onClick={() => window.open(url, '_blank')}
      >
        {label}
      </Badge>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

// Typing dots animation
const TypingDots = () => (
  <div className="flex gap-1 p-3">
    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
  </div>
);

export function ChatMessageArea({ messages, isLoading }: ChatMessageAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            <h2 className="text-2xl font-semibold mb-2">Nasıl yardımcı olabilirim?</h2>
            <p>Yatırım teşvikleri hakkında soru sorabilirsiniz.</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div className="max-w-[80%] space-y-2">
              <div
                className={`rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {message.role === 'assistant' ? (
                    <div className="space-y-2">
                      {renderContentWithBadges(message.content)}
                    </div>
                  ) : (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        code: ({ children }) => (
                          <code className="bg-background/50 px-1 py-0.5 rounded text-sm">
                            {children}
                          </code>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>

              {/* Display sources for assistant messages */}
              {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                <div className="text-xs space-y-1 pl-2">
                  <div className="font-semibold text-muted-foreground">Kaynaklar:</div>
                  {message.sources.map((source: any, idx) => {
                    // Handle both string sources and object sources like { title, uri }
                    const isObject = typeof source === 'object' && source !== null;
                    const href = isObject ? (source.uri || source.url) : undefined;
                    const label = isObject ? (source.title || source.uri || source.url) : String(source);

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
              {message.role === 'assistant' && message.groundingChunks && message.groundingChunks.length > 0 && (
                <div className="text-xs space-y-1 pl-2">
                  <div className="font-semibold text-muted-foreground">Referans Dökümanlar:</div>
                  {message.groundingChunks.map((chunk, idx) => {
                    if (!chunk.web) return null;
                    return (
                      <a
                        key={idx}
                        href={chunk.web.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>{chunk.web.title || chunk.web.uri}</span>
                      </a>
                    );
                  })}
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

        <div ref={scrollRef} />
      </div>
    </ScrollArea>
  );
}
