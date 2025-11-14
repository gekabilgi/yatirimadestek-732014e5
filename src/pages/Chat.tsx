import { useState, useEffect } from 'react';
import Header from '@/components/Header';
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
  } = useChatSession();

  const [activeStore, setActiveStore] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const initialize = async () => {
      await loadActiveStore();
      await loadSessions();
      
      // Create first session if none exists after loading
      if (sessions.length === 0) {
        await createSession();
      }
    };
    initialize();
  }, []);

  const loadActiveStore = async () => {
    try {
      const store = await geminiRagService.getActiveStore();
      setActiveStore(store);
    } catch (error) {
      console.error('Error loading active store:', error);
    }
  };

  const handleStoreChange = async (storeName: string) => {
    try {
      await geminiRagService.setActiveStore(storeName);
      setActiveStore(storeName);
      toast({
        title: 'Bilgi tabanı güncellendi',
        description: 'Yeni bilgi tabanı aktif edildi.',
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Bilgi tabanı güncellenirken bir hata oluştu.',
        variant: 'destructive',
      });
    }
  };

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
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 flex overflow-hidden">
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
            activeStore={activeStore}
            onStoreChange={handleStoreChange}
            sessionTitle={activeSession?.title || 'Yeni Sohbet'}
          />

          <ChatMessageArea
            messages={activeSession?.messages || []}
            isLoading={isLoading}
          />

          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={isLoading || !activeStore}
          />
        </div>
      </div>
    </div>
  );
}
