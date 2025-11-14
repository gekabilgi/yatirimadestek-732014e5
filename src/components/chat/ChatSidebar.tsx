import { Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';
import type { ChatSession } from '@/hooks/useChatSession';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
}

export function ChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full border-r bg-background">
      <div className="p-4 border-b space-y-3">
        <Button
          onClick={onCreateSession}
          className="w-full"
          variant="default"
        >
          <Plus className="mr-2 h-4 w-4" />
          Yeni Sohbet
        </Button>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sohbet ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className={`group relative flex items-center gap-2 rounded-lg p-3 cursor-pointer transition-colors ${
                activeSessionId === session.id
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent/50'
              }`}
              onClick={() => onSelectSession(session.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{session.title}</div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(session.updatedAt, {
                    addSuffix: true,
                    locale: tr,
                  })}
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          {filteredSessions.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              {searchQuery ? 'Sohbet bulunamadı' : 'Henüz sohbet yok'}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
