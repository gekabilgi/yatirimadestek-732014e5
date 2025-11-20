import { useState, useEffect, useRef } from 'react';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatMessageArea } from '@/components/chat/ChatMessageArea';
import { ChatInput } from '@/components/chat/ChatInput';
import { useChatSession } from '@/hooks/useChatSession';
import { geminiRagService } from '@/services/geminiRagService';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function Chat() {
  const {
    sessions,
    activeSession,
    activeSessionId,
    isLoading,
    loadSessions,
    createSession,
    deleteSession,
    sendMessage,
    setActiveSessionId,
    updateSession,
  } = useChatSession();

  const [activeStore, setActiveStore] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [exampleQuestions, setExampleQuestions] = useState<string[]>([]);
  const [currentSuggestion, setCurrentSuggestion] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const initialize = async () => {
      const store = await geminiRagService.getActiveStore();
      setActiveStore(store);
      
      const loadedSessions = await loadSessions();
      
      // Create first session if none exists after loading
      if (loadedSessions.length === 0) {
        await createSession();
      }
    };
    initialize();
  }, []);

  // Load example questions when active store changes
  useEffect(() => {
    const loadExampleQuestions = async () => {
      if (!activeStore) {
        setExampleQuestions([]);
        return;
      }

      setIsGeneratingQuestions(true);
      try {
        const questions = await geminiRagService.generateExampleQuestions(activeStore);
        setExampleQuestions(questions);
      } catch (error) {
        console.error('Failed to load example questions:', error);
        setExampleQuestions([]);
      } finally {
        setIsGeneratingQuestions(false);
      }
    };

    loadExampleQuestions();
  }, [activeStore]);

  // Rotate through example questions
  useEffect(() => {
    if (exampleQuestions.length === 0) {
      setCurrentSuggestion('');
      return;
    }

    setCurrentSuggestion(exampleQuestions[0]);
    let suggestionIndex = 0;
    
    const intervalId = setInterval(() => {
      suggestionIndex = (suggestionIndex + 1) % exampleQuestions.length;
      setCurrentSuggestion(exampleQuestions[suggestionIndex]);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [exampleQuestions]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeSession?.messages]);

  const handleSendMessage = async (message: string) => {
    if (!activeStore) {
      toast({
        title: 'Uyarı',
        description: 'Lütfen önce bir bilgi tabanı seçin.',
        variant: 'destructive',
      });
      return;
    }

    if (!activeSessionId) {
      const newSession = await createSession();
      await sendMessage(newSession.id, message, activeStore);
    } else {
      await sendMessage(activeSessionId, message, activeStore);
    }
  };

  const handleCreateSession = async () => {
    await createSession();
    setIsSidebarOpen(false);
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    setIsSidebarOpen(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const handleClearChat = () => {
    if (confirm("Sohbeti temizlemek istediğinizden emin misiniz?")) {
      createSession();
    }
  };

  const handleExportChat = () => {
    if (!activeSession) return;
    
    const exportData = {
      title: activeSession.title,
      messages: activeSession.messages,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-${activeSession.title.replace(/\s+/g, "-")}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRenameSession = async (newTitle: string) => {
    if (activeSessionId) {
      await updateSession(activeSessionId, { title: newTitle });
    }
  };

  const handleRegenerateMessage = async (messageIndex: number) => {
    if (!activeSessionId || !activeStore) return;
    
    // Find the last user message before this assistant message
    const userMessage = activeSession?.messages
      .slice(0, messageIndex)
      .reverse()
      .find((m) => m.role === "user");
    
    if (userMessage) {
      await sendMessage(activeSessionId, userMessage.content, activeStore);
    }
  };

  const SidebarContent = (
    <ChatSidebar
      sessions={sessions}
      activeSessionId={activeSessionId}
      onSelectSession={handleSelectSession}
      onCreateSession={handleCreateSession}
      onDeleteSession={deleteSession}
    />
  );

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-80">
        {SidebarContent}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Sidebar */}
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <div className="lg:hidden border-b p-2">
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
          </div>
          
          <SheetContent side="left" className="w-80 p-0">
            {SidebarContent}
          </SheetContent>
        </Sheet>

        <ChatHeader 
          sessionTitle={activeSession?.title || 'Yeni Sohbet'}
          onClearChat={handleClearChat}
          onExportChat={handleExportChat}
          onRenameSession={handleRenameSession}
        />

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <ChatMessageArea
            messages={activeSession?.messages || []}
            isLoading={isLoading}
            currentSuggestion={currentSuggestion}
            onSuggestionClick={handleSuggestionClick}
            isGeneratingQuestions={isGeneratingQuestions}
            activeSessionId={activeSessionId}
            onRegenerateMessage={handleRegenerateMessage}
          />
        </div>

        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isLoading || !activeStore}
          isGenerating={isLoading}
          value={inputValue}
          onValueChange={setInputValue}
          onStop={() => {
            // TODO: Implement abort functionality in useChatSession
            console.log('Stop generation requested');
          }}
        />
      </div>
    </div>
  );
}
