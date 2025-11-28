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
  if (role === "assistant") {
    console.log("SOURCES FOR MESSAGE:", { content: content.slice(0, 60), sources });
  }

  const formatTime = (date: string | number) => {
    const ts = typeof date === "number" ? date : date;
    return new Date(ts).toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // --- İçerik + Atıf Baloncukları ---
  const renderContentWithCitations = () => {
    if (!sources || sources.length === 0 || isUser) {
      return <ReactMarkdown components={markdownComponentsBase}>{content}</ReactMarkdown>;
    }

    const citationMap = new Map<string, JSX.Element[]>();
    const citationRegex = /\[(\d+(?:,\s*\d+)*)\]/g;
    let match: RegExpExecArray | null;
    let citationKey = 0;

    while ((match = citationRegex.exec(content)) !== null) {
      const [fullMatch, indexStr] = match;
      const indices = indexStr.split(/,\s*/).map((s) => parseInt(s.trim(), 10));

      const badges = indices
        .map((index) => {
          const source = sources.find((s) => s.index === index);
          if (!source) return null;

          return (
            <HoverCard key={`citation-${citationKey++}`}>
              <HoverCardTrigger asChild>
                <sup className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold cursor-help mx-0.5 shadow-sm border border-primary/60">
                  {index}
                </sup>
              </HoverCardTrigger>
              <HoverCardContent side="top" align="center" className="w-full max-w-[90vw] sm:w-80 text-xs space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-foreground line-clamp-2">{source.title}</p>
                  {source.uri && (
                    <a
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-primary hover:underline whitespace-nowrap"
                    >
                      Aç
                    </a>
                  )}
                </div>
                {(source.snippet || source.text) && (
                  <p className="text-muted-foreground leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {source.snippet || source.text}
                  </p>
                )}
              </HoverCardContent>
            </HoverCard>
          );
        })
        .filter(Boolean) as JSX.Element[];

      citationMap.set(fullMatch, badges);
    }

    const components = {
      ...markdownComponentsBase,
      p: ({ children, ...props }: any) => {
        const processed = processTextWithCitations(children, citationMap);
        return (
          <p className="mb-2 last:mb-0" {...props}>
            {processed}
          </p>
        );
      },
      li: ({ children, ...props }: any) => {
        const processed = processTextWithCitations(children, citationMap);
        return (
          <li className="mb-1" {...props}>
            {processed}
          </li>
        );
      },
    };

    return <ReactMarkdown components={components}>{content}</ReactMarkdown>;
  };

  // --- Alt kısım: Kullanılan Kaynaklar (chip'ler) ---
  const renderSourceSummary = () => {
    if (!sources || sources.length === 0 || isUser) return null;

    // Aynı dosyayı grupla (title + uri)
    type Group = { title: string; uri?: string; indices: number[] };
    const grouped = new Map<string, Group>();

    for (const s of sources) {
      const key = `${s.title}__${s.uri ?? ""}`;
      const existing = grouped.get(key) ?? {
        title: s.title,
        uri: s.uri,
        indices: [],
      };
      if (typeof s.index === "number" && !existing.indices.includes(s.index)) {
        existing.indices.push(s.index);
      }
      grouped.set(key, existing);
    }

    const groups = Array.from(grouped.values());
    const totalUnique = groups.length;

    return (
      <div className="mt-2 rounded-xl bg-muted/40 border border-border/40 px-2.5 py-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            Kullanılan Kaynaklar ({totalUnique})
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {groups.map((g, i) => {
            const chipInner = (
              <div className="inline-flex items-center gap-1 rounded-full bg-background/80 border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-background cursor-pointer max-w-full">
                <span className="font-medium truncate max-w-[140px]">{g.title}</span>
                {g.indices.length > 0 && (
                  <span className="flex items-center gap-0.5">
                    {g.indices.slice(0, 4).map((idx) => (
                      <span
                        key={idx}
                        className="inline-flex justify-center items-center w-4 h-4 rounded-full bg-primary/10 text-[9px] text-primary border border-primary/40"
                      >
                        {idx}
                      </span>
                    ))}
                    {g.indices.length > 4 && (
                      <span className="text-[9px] text-muted-foreground">+{g.indices.length - 4}</span>
                    )}
                  </span>
                )}
              </div>
            );

            return g.uri ? (
              <a key={i} href={g.uri} target="_blank" rel="noopener noreferrer" className="no-underline">
                {chipInner}
              </a>
            ) : (
              <div key={i}>{chipInner}</div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={cn("flex gap-2 md:gap-3 group px-2 md:px-0", isUser ? "justify-end" : "justify-start")}>
      {/* Avatar */}
      {!isUser && (
        <div className="hidden md:flex flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 items-center justify-center shadow-sm">
          <Bot className="h-5 w-5 text-primary" />
        </div>
      )}

      <div
        className={cn(
          "flex flex-col gap-1.5 md:gap-2 max-w-[92%] sm:max-w-[80%] md:max-w-[75%]",
          isUser && "items-end",
        )}
      >
        {/* Balon */}
        <div
          className={cn(
            "rounded-2xl px-3 py-2.5 md:px-4 md:py-3 shadow-sm border backdrop-blur",
            isUser
              ? "bg-primary text-primary-foreground border-primary/40"
              : "bg-card/95 text-card-foreground border-border/60",
          )}
        >
          {/* Başlık (Asistan / Siz) + Saat */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80">
              {isUser ? "Siz" : "Asistan"}
            </span>
            {timestamp && <span className="text-[11px] text-muted-foreground">{formatTime(timestamp)}</span>}
          </div>

          {/* Metin */}
          {isUser ? (
            <p className="whitespace-pre-wrap text-sm break-words">{content}</p>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert break-words">
              {renderContentWithCitations()}
            </div>
          )}

          {/* Ek içerik (progress, ekstra info vs.) */}
          {children}

          {/* Kullanılan Kaynaklar chip'leri */}
          {renderSourceSummary()}

          {/* Alt bar: aksiyonlar */}
          <div className="mt-2 pt-1 border-t border-border/40 flex justify-end">
            <MessageActions content={content} isAssistant={!isUser} onRegenerate={onRegenerate} />
          </div>
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary flex items-center justify-center shadow-sm">
          <User className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
        </div>
      )}
    </div>
  );
}

/* Ortak markdown renderer ayarları */
const markdownComponentsBase = {
  a: ({ node, ...props }: any) => (
    <a {...props} className="text-primary hover:underline font-medium" target="_blank" rel="noopener noreferrer" />
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
  p: ({ node, ...props }: any) => <p className="mb-2 last:mb-0" {...props} />,
  ul: ({ node, ...props }: any) => <ul className="mb-2 ml-4 list-disc" {...props} />,
  ol: ({ node, ...props }: any) => <ol className="mb-2 ml-4 list-decimal" {...props} />,
  li: ({ node, ...props }: any) => <li className="mb-1" {...props} />,
};

function processTextWithCitations(children: any, citationMap: Map<string, JSX.Element[]>): any {
  if (typeof children === "string") {
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    const regex = /\[(\d+(?:,\s*\d+)*)\]/g;
    let textMatch: RegExpExecArray | null;

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
    return children.map((child) => (typeof child === "string" ? processTextWithCitations(child, citationMap) : child));
  }
  return children;
}
