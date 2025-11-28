import { Bot, User, FileText, ExternalLink, BookOpen } from "lucide-react";
import { MessageActions } from "./MessageActions";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";

// Kaynak Veri Tipi
interface Source {
  index: number;
  title: string;
  snippet?: string;
  uri?: string;
}

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  sources?: Source[]; // <-- Yeni eklenen prop
  timestamp?: string | number; // Timestamp eklendi
  onRegenerate?: () => void;
  children?: React.ReactNode; // Eski kodla uyumluluk için
}

export function MessageBubble({ role, content, sources = [], timestamp, onRegenerate, children }: MessageBubbleProps) {
  const isUser = role === "user";

  const formatTime = (date: string | number) => {
    if (!date) return "";
    const ts = typeof date === "number" ? date : new Date(date).getTime();
    return new Date(ts).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  };

  // --- İÇERİK RENDERER ---
  const renderContent = () => {
    if (isUser) return <p className="whitespace-pre-wrap">{content}</p>;

    // Metni [1], [2] referanslarına göre böl
    const parts = content.split(/(\[\d+(?:,\s*\d+)*\])/g);

    return (
      <div>
        {parts.map((part, i) => {
          if (/^\[\d+(?:,\s*\d+)*\]$/.test(part)) {
            const indices = part
              .replace(/[\[\]]/g, "")
              .split(",")
              .map((s) => parseInt(s.trim()));
            return (
              <span key={i} className="inline-flex mx-1 align-super text-xs">
                {indices.map((idx) => {
                  const source = sources.find((s) => s.index === idx);
                  if (!source) return null;
                  return (
                    <HoverCard key={idx} openDelay={200}>
                      <HoverCardTrigger asChild>
                        <span className="cursor-help inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white text-[10px] font-bold transition-all border border-blue-200">
                          {idx}
                        </span>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80 p-0 shadow-xl border-blue-100" side="top">
                        <div className="bg-blue-50/50 p-3 border-b border-blue-100 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-semibold text-blue-900 truncate">{source.title}</span>
                        </div>
                        <ScrollArea className="h-32 p-3 bg-white">
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {source.snippet ? `"...${source.snippet}..."` : "İçerik önizlemesi mevcut değil."}
                          </p>
                        </ScrollArea>
                      </HoverCardContent>
                    </HoverCard>
                  );
                })}
              </span>
            );
          }
          return (
            <ReactMarkdown
              key={i}
              components={{
                p: ({ children }) => <span className="mb-2 block last:mb-0">{children}</span>,
                ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                li: ({ children }) => <li className="pl-1">{children}</li>,
                strong: ({ children }) => <span className="font-semibold text-primary">{children}</span>,
                h3: ({ children }) => <h3 className="text-sm font-bold mt-4 mb-2 text-primary">{children}</h3>,
              }}
            >
              {part}
            </ReactMarkdown>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "flex w-full gap-3 md:gap-4 py-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shadow-sm">
          <Bot className="w-5 h-5 text-primary" />
        </div>
      )}

      <div className={cn("flex flex-col max-w-[85%] lg:max-w-[75%]", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "relative px-4 py-3 md:px-5 md:py-4 shadow-sm text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
              : "bg-card border border-border/60 rounded-2xl rounded-tl-sm text-card-foreground",
          )}
        >
          {renderContent()}

          {/* ÇOCUK BİLEŞENLER (Varsa göster) */}
          {children}
        </div>

        {/* --- KAYNAKÇA KUTUSU (FOOTER) --- */}
        {!isUser && sources && sources.length > 0 && (
          <div className="mt-3 w-full">
            <div className="bg-muted/30 border border-border/50 rounded-xl overflow-hidden">
              <div className="bg-muted/50 px-3 py-2 border-b border-border/50 flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Kullanılan Kaynaklar
                </span>
              </div>
              <div className="divide-y divide-border/30">
                {sources.map((source, idx) => (
                  <div key={idx} className="px-3 py-2 flex items-start gap-3 hover:bg-muted/50 transition-colors">
                    <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-background border text-[10px] font-bold text-muted-foreground mt-0.5">
                      {source.index}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground/80 truncate" title={source.title}>
                        {source.title}
                      </p>
                      {source.uri && (
                        <a
                          href={source.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-primary hover:underline flex items-center gap-1 mt-0.5"
                        >
                          Belgeyi Aç <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ALT BİLGİ */}
        <div className="flex items-center gap-2 px-1 mt-1">
          {timestamp && <span className="text-[10px] text-muted-foreground">{formatTime(timestamp)}</span>}
          <MessageActions content={content} isAssistant={!isUser} onRegenerate={onRegenerate} />
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
          <User className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
