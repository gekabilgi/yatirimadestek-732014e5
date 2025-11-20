import React, { useState, useEffect, useRef } from "react";
import { ExternalLink, ArrowDown, Bot, FileText, Quote } from "lucide-react";
import type { ChatMessage } from "@/hooks/useChatSession";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IncentiveProgressBadge } from "./IncentiveProgressBadge";
import { MessageBubble } from "./MessageBubble";
import { supabase } from "@/integrations/supabase/client";

interface ChatMessageAreaProps {
  messages: ChatMessage[];
  isLoading: boolean;
  currentSuggestion?: string;
  onSuggestionClick?: (suggestion: string) => void;
  isGeneratingQuestions?: boolean;
  activeSessionId?: string | null;
  onRegenerateMessage?: (index: number) => void;
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
  activeSessionId,
  onRegenerateMessage,
}: ChatMessageAreaProps) {
  const [modalContent, setModalContent] = useState<string | null>(null);
  const [incentiveProgress, setIncentiveProgress] = useState<any>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleSourceClick = (text: string) => {
    setModalContent(text);
  };

  const closeModal = () => {
    setModalContent(null);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle scroll detection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom && scrollHeight > clientHeight);
    };

    container.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => container.removeEventListener("scroll", handleScroll);
  }, [messages]);

  // Load incentive query progress
  useEffect(() => {
    if (!activeSessionId) {
      setIncentiveProgress(null);
      return;
    }

    const loadProgress = async () => {
      try {
        const { data, error } = await supabase
          .from('incentive_queries')
          .select('*')
          .eq('session_id', activeSessionId)
          .eq('status', 'collecting')
          .single();

        if (error) {
          setIncentiveProgress(null);
          return;
        }

        setIncentiveProgress(data);
      } catch (error) {
        console.error('Error loading incentive progress:', error);
        setIncentiveProgress(null);
      }
    };

    loadProgress();

    // Subscribe to changes
    const channel = supabase
      .channel(`incentive-progress-${activeSessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incentive_queries',
          filter: `session_id=eq.${activeSessionId}`,
        },
        (payload) => {
          if (payload.new && (payload.new as any).status === 'collecting') {
            setIncentiveProgress(payload.new);
          } else if (payload.eventType === 'DELETE') {
            setIncentiveProgress(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSessionId]);

  return (
    <div ref={containerRef} className="relative">
      <div className="p-4 pb-8">
        <div className="max-w-3xl mx-auto space-y-6">
        {/* Show incentive progress if active */}
        {incentiveProgress && (
          <IncentiveProgressBadge progress={incentiveProgress} />
        )}
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
              <div className="max-w-2xl w-full text-center space-y-8">
                <div className="space-y-3">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold">Nasıl yardımcı olabilirim?</h2>
                  <p className="text-muted-foreground text-lg">
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
          <MessageBubble
            key={`msg-${index}-${message.timestamp || ''}`}
            role={message.role}
            content={message.content}
            timestamp={message.timestamp}
            onRegenerate={
              message.role === "assistant" && index === messages.length - 1
                ? () => onRegenerateMessage?.(index)
                : undefined
            }
          >
            {/* Display sources for assistant messages */}
            {message.role === "assistant" && message.sources && message.sources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Kaynaklar:</div>
                 <div className="flex flex-wrap gap-1.5 md:gap-2">
                   {message.sources.map((source: any, idx) => {
                     const isObject = typeof source === "object" && source !== null;
                     const href = isObject ? source.uri || source.url : undefined;
                     const label = isObject ? source.title || source.uri || source.url : String(source);

                     return href ? (
                       <a
                         key={idx}
                         href={href}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="inline-flex items-center gap-1 md:gap-1.5 px-2 py-1 md:px-3 md:py-1.5 rounded-full bg-primary/10 
                                  hover:bg-primary/20 text-[10px] md:text-xs text-primary border border-primary/20
                                  hover:border-primary/40 transition-all"
                       >
                         <ExternalLink className="h-2.5 w-2.5 md:h-3 md:w-3 flex-shrink-0" />
                         <span className="max-w-[100px] md:max-w-[150px] truncate">{label}</span>
                       </a>
                     ) : (
                       <div key={idx} className="inline-flex items-center gap-1 md:gap-1.5 px-2 py-1 md:px-3 md:py-1.5 rounded-full 
                                                bg-muted text-[10px] md:text-xs text-muted-foreground border border-border">
                         <ExternalLink className="h-2.5 w-2.5 md:h-3 md:w-3 flex-shrink-0" />
                         <span className="max-w-[100px] md:max-w-[150px] truncate">{label}</span>
                       </div>
                     );
                   })}
                 </div>
              </div>
            )}

            {/* Display grounding chunks */}
            {message.role === "assistant" && message.groundingChunks && message.groundingChunks.length > 0 && (
              <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-border/50 space-y-1.5 md:space-y-2">
                <div className="text-[10px] md:text-xs font-medium text-muted-foreground">Belge Kaynakları:</div>
                <div className="flex flex-wrap gap-1.5 md:gap-2 max-h-32 overflow-y-auto">
                  {message.groundingChunks.map((chunk, chunkIndex) => {
                    let fileName = `Kaynak ${chunkIndex + 1}`;
                    
                    // Priority: customMetadata > title > uri > fallback
                    if (chunk.retrievedContext?.customMetadata) {
                      const metadata = chunk.retrievedContext.customMetadata;
                      if (Array.isArray(metadata)) {
                        const filenameMeta = metadata.find((m: any) => m.key === "Dosya" || m.key === "fileName");
                        if (filenameMeta) {
                          fileName = filenameMeta.stringValue || filenameMeta.value || fileName;
                        }
                      }
                    } else if (chunk.retrievedContext?.title) {
                      fileName = chunk.retrievedContext.title;
                    } else if (chunk.retrievedContext?.uri) {
                      const uriParts = chunk.retrievedContext.uri.split('/');
                      fileName = uriParts[uriParts.length - 1] || fileName;
                    }

                    const sourceData = JSON.stringify({
                      fileName,
                      cite: chunk.retrievedContext?.text || "İçerik bulunamadı",
                      uri: chunk.retrievedContext?.uri || null,
                    });

                    // Display shortened filename in badge
                    const displayName = fileName.length > 30 
                      ? fileName.replace(/\.[^/.]+$/, '').substring(0, 27) + '...'
                      : fileName.replace(/\.[^/.]+$/, '');

                    return (
                      <button
                        key={chunkIndex}
                        onClick={() => handleSourceClick(sourceData)}
                        className="inline-flex items-center gap-1 md:gap-1.5 px-2 py-1 md:px-3 md:py-1.5 rounded-full bg-primary/10 
                                 hover:bg-primary/20 text-[10px] md:text-xs text-primary border border-primary/20
                                 hover:border-primary/40 transition-all"
                        title={fileName}
                      >
                        <ExternalLink className="h-2.5 w-2.5 md:h-3 md:w-3 flex-shrink-0" />
                        <span className="max-w-[100px] md:max-w-[150px] truncate">{displayName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </MessageBubble>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div className="bg-muted/50 border border-border/50 rounded-2xl">
              <TypingDots />
            </div>
          </div>
        )}
        
        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <div className="fixed bottom-24 right-8">
          <Button
            onClick={scrollToBottom}
            size="icon"
            className="rounded-full shadow-lg h-10 w-10"
            title="Aşağı kaydır"
          >
            <ArrowDown className="h-5 w-5" />
          </Button>
        </div>
      )}
      </div>

      {/* Citation Modal */}
      {modalContent &&
        (() => {
          try {
            const sourceData = JSON.parse(modalContent);
            return (
              <Dialog open={!!modalContent} onOpenChange={() => closeModal()}>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      {sourceData.fileName}
                    </DialogTitle>
                    <DialogDescription>
                      Belge kaynağından alıntı
                    </DialogDescription>
                  </DialogHeader>
                  <div className="overflow-y-auto max-h-[60vh] space-y-4">
                    {/* Belge Bilgisi */}
                    <div className="flex items-start gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-muted-foreground mb-1">
                          Kaynak Belge:
                        </div>
                        <div className="text-sm font-medium text-foreground break-words">
                          {sourceData.fileName}
                        </div>
                        {sourceData.uri && (
                          <a 
                            href={sourceData.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Belgeyi Görüntüle
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Alıntı Metni */}
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <Quote className="h-4 w-4" />
                        Alıntı Metni:
                      </div>
                      <div className="bg-muted p-4 rounded-lg border border-border">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground">
                          {sourceData.cite}
                        </p>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            );
          } catch {
            // Fallback for non-JSON content (if any)
            return (
              <Dialog open={!!modalContent} onOpenChange={() => closeModal()}>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Kaynak</DialogTitle>
                    <DialogDescription>Bu cevap için kullanılan kaynak bilgisi</DialogDescription>
                  </DialogHeader>
                  <div className="overflow-y-auto max-h-[60vh] space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm font-mono break-all">{modalContent}</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            );
          }
        })()}
    </div>
  );
}
