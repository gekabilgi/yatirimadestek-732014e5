import { Bot, User, FileText, ExternalLink } from "lucide-react";
import { MessageActions } from "./MessageActions";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

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

  // --- ALINTI İŞLEME (CITATION HANDLING) ---
  const renderContentWithCitations = () => {
    if (!sources || sources.length === 0 || isUser) {
      return <MarkdownRenderer content={content} />;
    }

    // Metni [1], [2] referanslarına göre parçalara ayır
    const parts = content.split(/(\[\d+(?:,\s*\d+)*\])/g);

    return (
      <div className="markdown-content">
        {parts.map((part, i) => {
          // Eğer parça bir referans ise (Örn: [1])
          if (/^\[\d+(?:,\s*\d+)*\]$/.test(part)) {
            const indices = part
              .replace(/[\[\]]/g, "")
              .split(",")
              .map((s) => parseInt(s.trim()));
            return (
              <span key={i} className="inline-flex mx-1 align-super text-xs">
                {indices.map((index, j) => {
                  const source = sources.find((s) => s.index === index);
                  if (!source) return null;

                  return (
                    <HoverCard key={`${i}-${j}`} openDelay={200}>
                      <HoverCardTrigger asChild>
                        <button className="inline-flex items-center justify-center min-w-[1.2rem] h-[1.2rem] px-1 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 text-[10px] font-bold transition-all cursor-help select-none">
                          {index}
                        </button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80 p-0 overflow-hidden shadow-lg border-primary/20" align="start">
                        <div className="bg-muted/50 px-3 py-2 border-b flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs font-semibold truncate">{source.title}</span>
                        </div>
                        <ScrollArea className="h-full max-h-[200px]">
                          <div className="p-3 text-xs text-muted-foreground leading-relaxed">
                            {source.snippet || source.text || "İçerik önizlemesi yok."}
                          </div>
                        </ScrollArea>
                        {source.uri && (
                          <div className="bg-muted/30 px-3 py-2 border-t">
                            <a
                              href={source.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] flex items-center gap-1 text-primary hover:underline"
                            >
                              Kaynağı Görüntüle <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </HoverCardContent>
                    </HoverCard>
                  );
                })}
              </span>
            );
          }
          // Normal metin ise Markdown olarak render et
          return <MarkdownRenderer key={i} content={part} />;
        })}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "flex gap-3 md:gap-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {/* Avatar (Bot) */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-sm border border-primary/10">
          <Bot className="h-5 w-5 text-primary" />
        </div>
      )}

      {/* Mesaj Balonu */}
      <div className={cn("flex flex-col gap-1 max-w-[85%] sm:max-w-[80%] md:max-w-[75%]", isUser && "items-end")}>
        <div
          className={cn(
            "relative px-4 py-3 md:px-5 md:py-4 shadow-sm text-sm leading-relaxed",
            // Baloncuk şekli ve rengi
            isUser
              ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
              : "bg-card border border-border/60 rounded-2xl rounded-tl-sm text-card-foreground shadow-sm",
          )}
        >
          {/* İçerik */}
          <div className={cn("prose prose-sm max-w-none break-words", isUser ? "prose-invert" : "dark:prose-invert")}>
            {renderContentWithCitations()}
          </div>

          {/* Kaynakça Kutusu (Sadece Bot ve Kaynak Varsa) */}
          {!isUser && sources && sources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border/50">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                <Database className="h-3 w-3" /> Kullanılan Kaynaklar
              </p>
              <div className="grid gap-1.5">
                {sources.map((source, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs bg-muted/30 p-1.5 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <span className="inline-flex items-center justify-center min-w-[1.2rem] h-[1.2rem] rounded-full bg-background border text-[10px] font-medium text-muted-foreground shadow-sm mt-0.5">
                      {source.index}
                    </span>
                    <span className="text-muted-foreground truncate">{source.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {children}
        </div>

        {/* Alt Bilgi (Zaman ve Butonlar) */}
        <div className="flex items-center gap-2 px-1">
          {timestamp && (
            <span className="text-[10px] text-muted-foreground/60 font-medium">{formatTime(timestamp)}</span>
          )}
          <MessageActions content={content} isAssistant={!isUser} onRegenerate={onRegenerate} />
        </div>
      </div>

      {/* Avatar (User) */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-xl bg-muted flex items-center justify-center shadow-sm">
          <User className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

// --- YARDIMCI BİLEŞENLER ---

function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ node, ...props }) => <span {...props} />, // p yerine span kullanarak iç içe p hatasını önleriz
        a: ({ node, ...props }) => (
          <a
            {...props}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4 decoration-primary/50 hover:decoration-primary transition-all"
          />
        ),
        ul: ({ node, ...props }) => <ul {...props} className="my-2 ml-4 list-disc marker:text-primary/50 space-y-1" />,
        ol: ({ node, ...props }) => (
          <ol {...props} className="my-2 ml-4 list-decimal marker:text-primary/50 space-y-1" />
        ),
        li: ({ node, ...props }) => <li {...props} className="pl-1" />,
        code: ({ node, className, children, ...props }: any) => {
          const match = /language-(\w+)/.exec(className || "");
          return match ? (
            <code
              className={cn(
                "block bg-muted/80 p-3 rounded-lg my-3 text-xs font-mono overflow-x-auto border border-border/50",
                className,
              )}
              {...props}
            >
              {children}
            </code>
          ) : (
            <code
              className="bg-muted/80 px-1.5 py-0.5 rounded text-[11px] font-mono border border-border/50"
              {...props}
            >
              {children}
            </code>
          );
        },
        h1: ({ node, ...props }) => <h1 {...props} className="text-lg font-bold mb-2 mt-4 first:mt-0" />,
        h2: ({ node, ...props }) => <h2 {...props} className="text-base font-bold mb-2 mt-3" />,
        h3: ({ node, ...props }) => <h3 {...props} className="text-sm font-bold mb-1 mt-2" />,
        blockquote: ({ node, ...props }) => (
          <blockquote
            {...props}
            className="border-l-2 border-primary/30 pl-4 py-1 my-2 italic text-muted-foreground bg-muted/10 rounded-r-lg"
          />
        ),
        table: ({ node, ...props }) => (
          <div className="my-4 w-full overflow-y-auto rounded-lg border">
            <table className="w-full text-sm" {...props} />
          </div>
        ),
        th: ({ node, ...props }) => <th {...props} className="border-b bg-muted/50 px-4 py-2 text-left font-medium" />,
        td: ({ node, ...props }) => <td {...props} className="border-b px-4 py-2 last:border-0" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function Database({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s 9-1.34 9-3V5" />
    </svg>
  );
}
