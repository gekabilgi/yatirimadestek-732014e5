import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bot, Send, X, Loader2, Sparkles } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTypewriter } from "@/hooks/useTypewriter";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id: string;
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  
  // Only use typewriter for assistant messages
  const { displayedText } = useTypewriter({
    text: message.content,
    speed: isUser ? 0 : 30,
  });

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-lg p-3 ${
          isUser
            ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white'
            : 'bg-muted'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">
          {isUser ? message.content : displayedText}
        </p>
      </div>
    </div>
  );
}

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Merhaba! Size nasıl yardımcı olabilirim? Sorularınızı yanıtlamak için buradayım.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-rag', {
        body: { question: userMessage },
      });

      if (error) throw error;

      // Add assistant response
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.answer,
        },
      ]);
    } catch (error: any) {
      console.error('Chat error:', error);
      
      let errorMessage = 'Bir hata oluştu. Lütfen tekrar deneyin.';
      
      if (error.message?.includes('429')) {
        errorMessage = 'Çok fazla istek gönderildi. Lütfen birkaç saniye bekleyin.';
      } else if (error.message?.includes('402')) {
        errorMessage = 'Servis geçici olarak kullanılamıyor. Lütfen daha sonra tekrar deneyin.';
      }
      
      toast({
        title: "Hata",
        description: errorMessage,
        variant: "destructive",
      });
      
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: errorMessage,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Sticky AI Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 z-50"
        >
          <Bot className="h-9 w-9" />
        </Button>
      )}

      {/* Chat Modal */}
      {isOpen && (
        <Card className={`fixed ${isMobile ? 'left-4 right-4 top-20 bottom-4 max-h-[85dvh]' : 'bottom-6 right-6 w-[420px] h-[600px]'} shadow-2xl z-50 flex flex-col border-2 animate-in slide-in-from-bottom-5 duration-300`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bot className="h-6 w-6" />
                <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-yellow-300" />
              </div>
              <div>
                <h3 className="font-semibold">AI Asistan</h3>
                <p className="text-xs opacity-90">Sorularınızı cevaplayabilirim</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Sorunuzu yazın..."
                className="resize-none"
                rows={2}
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-auto"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
