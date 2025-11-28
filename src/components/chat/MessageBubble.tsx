import { Bot, User, FileText, ExternalLink, BookOpen } from "lucide-react";
import { MessageActions } from "./MessageActions";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Source {
  index: number;
  title: string;
  snippet?: string;
  uri?: string;
}

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  onRegenerate?: () => void;
}

export function MessageBubble({ role, content, sources = [], onRegenerate }: MessageBubbleProps) {
  const isUser = role === "user";

  // --- İÇERİK RENDERER (Alıntıları Badge Yapar) ---
  const renderContent = () => {
    if (isUser) return <p className="whitespace-pre-wrap">{content}</p>;

    // Metni [1], [2] desenlerine göre böl
    const parts = content.split(/(\[\d+(?:,\s*\d+)*\])/g);

    return (
      <div>
        {parts.map((part, i) => {
          // Eğer parça bir referans ise (Örn: [1])
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
                    <HoverCard key={idx}>
                      <HoverCardTrigger asChild>
                        <span className="cursor-help inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white text-[10px] font-bold transition-all border border-blue-200">
                          {idx}
                        </span>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80 p-0 shadow-xl border-blue-100">
                        <div className="bg-blue-50/50 p-3 border-b border-blue-100 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-semibold text-blue-900 truncate">{source.title}</span>
                        </div>
                        <ScrollArea className="h-32 p-3">
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
          // Normal metin ise Markdown bas
          return (
            <ReactMarkdown
              key={i}
              components={{
                p: ({ children }) => <span className="mb-2 block last:mb-0">{children}</span>,
                ul: ({ children }) => <ul className="list-disc ml-4 mb-2 space-y-1">{children}</ul>,
                li: ({ children }) => <li className="pl-1">{children}</li>,
                strong: ({ children }) => (
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{children}</span>
                ),
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
        "flex w-full gap-4 py-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {/* Bot Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}

      <div className={cn("flex flex-col max-w-[85%] lg:max-w-[75%]", isUser ? "items-end" : "items-start")}>
        {/* Mesaj Balonu */}
        <div
          className={cn(
            "relative px-5 py-4 shadow-sm text-sm leading-7",
            isUser
              ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm"
              : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-sm text-slate-700 dark:text-slate-300",
          )}
        >
          {renderContent()}
        </div>

        {/* --- KAYNAKÇA (FOOTER) --- */}
        {!isUser && sources.length > 0 && (
          <div className="mt-3 w-full max-w-md">
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-slate-100/50 dark:bg-slate-800/50 px-3 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Kullanılan Kaynaklar
                </span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {sources.map((source, idx) => (
                  <div
                    key={idx}
                    className="px-3 py-2.5 flex items-start gap-3 hover:bg-slate-100/50 transition-colors group"
                  >
                    <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 mt-0.5">
                      {source.index}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate"
                        title={source.title}
                      >
                        {source.title}
                      </p>
                      {source.uri && (
                        <a
                          href={source.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 mt-0.5"
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

        {/* Aksiyon Butonları (Kopyala vb.) */}
        <div className="mt-1 px-1">
          <MessageActions content={content} isAssistant={!isUser} onRegenerate={onRegenerate} />
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
          <User className="w-5 h-5 text-slate-500" />
        </div>
      )}
    </div>
  );
}
