import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Bot,
  Send,
  X,
  Loader2,
  Sparkles,
  RotateCcw,
  Square,
  Trash2,
  Download,
  PlusCircle,
  History,
  Search,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getActiveStore } from "@/services/geminiRagService";

interface Message {
  role: "user" | "assistant";
  content: string;
  id: string;
}

interface ChatSession {
  session_id: string;
  title: string;
}

const BADGE_RE = /\[badge:\s*([^\|\]]+)\|([^\]]+)\]/gi;

function TypingDots() {
  return (
    <div className="flex gap-1 p-3">
      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
    </div>
  );
}

function renderContentWithBadges(content: string) {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = BADGE_RE.exec(content)) !== null) {
    const start = match.index;
    const end = start + match[0].length;

    // Rozetten önceki düz metin
    if (start > lastIndex) {
      const text = content.slice(lastIndex, start);
      nodes.push(
        <span key={`t-${lastIndex}`} className="whitespace-pre-wrap">
          {text}
        </span>,
      );
    }

    const label = match[1].trim();
    const hrefRaw = match[2].trim();
    const href = /^https?:\/\//i.test(hrefRaw) ? hrefRaw : "#";

    nodes.push(
      <a
        key={`b-${start}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block align-middle ml-2"
        aria-label={label}
      >
        <Badge className="cursor-pointer select-none">{label}</Badge>
      </a>,
    );

    lastIndex = end;
  }

  // Son rozetten sonra kalan metin
  if (lastIndex < content.length) {
    nodes.push(
      <span key={`t-${lastIndex}`} className="whitespace-pre-wrap">
        {content.slice(lastIndex)}
      </span>,
    );
  }

  return nodes;
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg p-3 ${
          isUser ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white" : "bg-muted"
        }`}
      >
        <div className="text-sm prose prose-sm max-w-none dark:prose-invert">
          {renderContentWithBadges(message.content)}
        </div>
      </div>
    </div>
  );
}

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => crypto.randomUUID());
  const [activeStoreCache, setActiveStoreCache] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Merhaba! Size nasıl yardımcı olabilirim? Sorularınızı yanıtlamak için buradayım.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllHistory, setShowAllHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Load active store on mount
  useEffect(() => {
    getActiveStore().then(setActiveStoreCache);
  }, []);

  // Load chat sessions when opened
  useEffect(() => {
    if (isOpen) {
      loadChatSessions();
    }
  }, [isOpen]);

  // Auto-scroll logic with user scroll detection
  useEffect(() => {
    if (!scrollRef.current || !shouldAutoScroll) return;

    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, shouldAutoScroll, isLoading]);

  const loadChatSessions = async () => {
    try {
      const { data, error } = await supabase.rpc("get_chat_sessions");
      if (error) throw error;
      setChatSessions(data || []);
    } catch (error) {
      console.error("Error loading chat sessions:", error);
    }
  };

  const loadSessionMessages = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from("cb_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedMessages: Message[] = data.map((msg) => ({
          id: msg.id,
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));
        setMessages(loadedMessages);
        setCurrentSessionId(sessionId);
        setShowHistory(false);
      }
    } catch (error) {
      console.error("Error loading session messages:", error);
      toast({
        title: "Hata",
        description: "Sohbet geçmişi yüklenemedi",
        variant: "destructive",
      });
    }
  };

  const saveMessage = async (message: Message, sessionId: string) => {
    try {
      await supabase.from("cb_messages").insert({
        id: message.id,
        session_id: sessionId,
        role: message.role,
        content: message.content,
      });
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // Pause auto-scroll if user scrolled up more than 120px
    setShouldAutoScroll(distanceFromBottom < 120);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message
    const userMsgId = crypto.randomUUID();
    const newUserMsg: Message = { id: userMsgId, role: "user", content: userMessage };
    setMessages((prev) => [...prev, newUserMsg]);

    // Save user message to database
    await saveMessage(newUserMsg, currentSessionId);

    setIsLoading(true);
    setShouldAutoScroll(true);

    // Create abort controller for stop functionality
    abortControllerRef.current = new AbortController();

    try {
      // Use cached active store
      if (!activeStoreCache) {
        throw new Error("Lütfen önce admin panelinden bir bilgi bankası seçin");
      }

      const { data, error } = await supabase.functions.invoke("chat-gemini", {
        body: {
          storeName: activeStoreCache,
          messages: [...messages, { role: "user", content: userMessage }],
        },
      });

      if (error) {
        console.error("Supabase function error:", error);
        throw error;
      }

      // Check if response was blocked
      if (data?.blocked === true) {
        const blockedMessage =
          data.error ||
          "Üzgünüm, bu soruya güvenli bir şekilde cevap veremiyorum. Lütfen sorunuzu farklı şekilde ifade etmeyi deneyin.";

        toast({
          title: "Yanıt Engellenmiş",
          description: blockedMessage,
          variant: "default",
        });

        const assistantId = crypto.randomUUID();
        const blockedMsg: Message = {
          id: assistantId,
          role: "assistant",
          content: `⚠️ ${blockedMessage}`,
        };

        setMessages((prev) => [...prev, blockedMsg]);
        await saveMessage(blockedMsg, currentSessionId);
        loadChatSessions();

        setIsLoading(false);
        return;
      }

      if (!data || !data.text) {
        console.error("Invalid response data:", data);
        throw new Error("Geçersiz yanıt formatı");
      }

      // Add assistant response
      const assistantId = crypto.randomUUID();

      // Simulate typing effect
      setIsStreaming(true);
      const fullResponse = data.text;
      const words = fullResponse.split(" ");
      let currentText = "";

      // Add empty message first
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      // Stream words
      for (let i = 0; i < words.length; i++) {
        if (abortControllerRef.current?.signal.aborted) break;

        currentText += (i > 0 ? " " : "") + words[i];
        setMessages((prev) => prev.map((msg) => (msg.id === assistantId ? { ...msg, content: currentText } : msg)));

        // Variable delay for natural cadence
        await new Promise((resolve) => setTimeout(resolve, 30 + Math.random() * 20));
      }

      // Ensure full response is shown
      const finalAssistantMsg: Message = { id: assistantId, role: "assistant", content: fullResponse };
      setMessages((prev) => prev.map((msg) => (msg.id === assistantId ? finalAssistantMsg : msg)));

      // Save assistant message to database
      await saveMessage(finalAssistantMsg, currentSessionId);

      // Reload sessions to update list
      loadChatSessions();

      setIsStreaming(false);
    } catch (error: any) {
      console.error("Chat error:", error);
      console.error("Chat error details:", {
        message: error.message,
        status: error.status,
        context: error.context,
      });

      let errorMessage = "Bir hata oluştu. Lütfen tekrar deneyin.";

      if (error.message?.includes("429")) {
        errorMessage = "Çok fazla istek gönderildi. Lütfen birkaç saniye bekleyin.";
      } else if (error.message?.includes("402")) {
        errorMessage = "Servis geçici olarak kullanılamıyor. Lütfen daha sonra tekrar deneyin.";
      } else if (error.message?.includes("Invalid message format")) {
        errorMessage = "Mesaj formatı geçersiz. Lütfen sayfayı yenileyin.";
      } else if (error.message) {
        // Show more specific error if available
        errorMessage = `Hata: ${error.message}`;
      }

      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      });

      const errorId = (Date.now() + 2).toString();
      setMessages((prev) => [...prev, { id: errorId, role: "assistant", content: errorMessage }]);
      setIsStreaming(false);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    setIsLoading(false);
  };

  const handleRegenerate = () => {
    if (messages.length < 2) return;

    // Find the last user message
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMessage) return;

    // Remove last assistant message
    setMessages((prev) => prev.slice(0, -1));

    // Resend last user message
    setInput(lastUserMessage.content);
    setTimeout(() => handleSend(), 100);
  };

  const handleNewChat = () => {
    const newSessionId = crypto.randomUUID();
    setCurrentSessionId(newSessionId);
    setMessages([
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Merhaba! Size nasıl yardımcı olabilirim? Sorularınızı yanıtlamak için buradayım.",
      },
    ]);
    setInput("");
    setShowHistory(false);
  };

  const handleClear = () => {
    setMessages([]);
    setInput("");
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(messages, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `chat-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Başarılı",
      description: "Sohbet dışa aktarıldı",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredSessions = chatSessions.filter((session) =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const displayedSessions = showAllHistory ? filteredSessions : filteredSessions.slice(0, 10);

  return (
    <>
      {/* Sticky AI Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 z-50"
          aria-label="AI Asistan'ı Aç"
        >
          <Bot className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Modal */}
      {isOpen && (
        <Card
          className={`fixed ${isMobile ? "top-16 left-0 right-0 bottom-0" : "bottom-6 right-6 w-[480px] h-[680px]"} shadow-2xl z-50 flex ${showHistory ? "flex-row" : "flex-col"} border-2 animate-in slide-in-from-bottom-5 duration-300`}
        >
          {/* Chat History Sidebar */}
          {showHistory && (
            <div className={`${isMobile ? "absolute inset-0 bg-background z-10" : "w-64"} border-r flex flex-col`}>
              <div className="p-3 border-b">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Sohbet Geçmişi
                  </h3>
                  {isMobile && (
                    <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)} className="h-6 w-6">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-9 text-sm"
                  />
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {displayedSessions.map((session) => (
                    <button
                      key={session.session_id}
                      onClick={() => loadSessionMessages(session.session_id)}
                      className={`w-full text-left p-2 rounded-lg hover:bg-muted transition-colors text-sm ${
                        currentSessionId === session.session_id ? "bg-muted" : ""
                      }`}
                    >
                      <div className="truncate">{session.title}</div>
                    </button>
                  ))}
                  {filteredSessions.length === 0 && (
                    <p className="text-center text-muted-foreground text-xs py-4">
                      {searchQuery ? "Sonuç bulunamadı" : "Henüz sohbet yok"}
                    </p>
                  )}
                </div>
              </ScrollArea>
              {filteredSessions.length > 10 && (
                <div className="p-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllHistory(!showAllHistory)}
                    className="w-full text-xs"
                  >
                    {showAllHistory ? "Daha Az Göster" : `${filteredSessions.length - 10} Daha Fazla`}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
                  <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 absolute -top-1 -right-1 text-yellow-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">AI Asistan</h3>
                  <p className="text-xs opacity-90 hidden sm:block">Yatırım Teşvikleri ve Destekleri</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 h-8 w-8"
                aria-label="Kapat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-1 sm:gap-2 p-2 border-b bg-muted/30">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
                className="flex-1 text-xs sm:text-sm h-8"
              >
                <History className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Geçmiş</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNewChat}
                className="flex-1 text-xs sm:text-sm h-8"
                disabled={isLoading}
              >
                <PlusCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Yeni</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="flex-1 text-xs sm:text-sm h-8"
                disabled={isLoading || messages.length === 0}
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Temizle</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExport}
                className="flex-1 text-xs sm:text-sm h-8"
                disabled={messages.length === 0}
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Dışa Aktar</span>
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden" ref={scrollRef} onScroll={handleScroll}>
              <div className="space-y-4 p-3 sm:p-4">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}

                {isLoading && !isStreaming && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg">
                      <TypingDots />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stop/Regenerate Button */}
            {(isStreaming ||
              (!isLoading && messages.length > 1 && messages[messages.length - 1].role === "assistant")) && (
              <div className="px-3 sm:px-4 pb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isStreaming ? handleStop : handleRegenerate}
                  className="w-full text-xs sm:text-sm h-8"
                >
                  {isStreaming ? (
                    <>
                      <Square className="h-3 w-3 sm:h-4 sm:w-4" />
                      Durdur
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
                      Yeniden Oluştur
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Input */}
            <div className="p-3 sm:p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Sorunuzu yazın..."
                  className="resize-none text-sm"
                  rows={2}
                  disabled={isLoading}
                  aria-label="Soru girin"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-auto min-w-[44px]"
                  aria-label="Gönder"
                >
                  {isLoading && !isStreaming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
