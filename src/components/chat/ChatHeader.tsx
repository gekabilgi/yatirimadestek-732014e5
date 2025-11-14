import { useEffect, useState } from 'react';
import { Settings, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { geminiRagService } from '@/services/geminiRagService';

interface ChatHeaderProps {
  activeStore: string | null;
  onStoreChange: (store: string) => void;
  sessionTitle: string;
}

export function ChatHeader({ activeStore, onStoreChange, sessionTitle }: ChatHeaderProps) {
  const [stores, setStores] = useState<Array<{ name: string; displayName: string }>>([]);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      const storeList = await geminiRagService.listRagStores();
      setStores(storeList);
      
      if (!activeStore && storeList.length > 0) {
        const active = await geminiRagService.getActiveStore();
        if (active) {
          onStoreChange(active);
        }
      }
    } catch (error) {
      console.error('Error loading stores:', error);
    }
  };

  return (
    <div className="border-b bg-background">
      <div className="flex items-center justify-between p-4">
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{sessionTitle}</h1>
        </div>

        <div className="flex items-center gap-2">
          <Select value={activeStore || undefined} onValueChange={onStoreChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Bilgi tabanı seç" />
            </SelectTrigger>
            <SelectContent>
              {stores.map((store) => (
                <SelectItem key={store.name} value={store.name}>
                  {store.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="ghost" size="icon">
            <Download className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
