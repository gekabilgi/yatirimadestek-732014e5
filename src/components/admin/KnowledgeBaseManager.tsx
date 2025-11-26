import { useState, useEffect } from 'react';
import { GeminiStoreManager } from './GeminiStoreManager';
import { CustomRagStoreManager } from './CustomRagStoreManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { adminSettingsService } from '@/services/adminSettingsService';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export function KnowledgeBaseManager() {
  const [ragMode, setRagMode] = useState<'gemini_file_search' | 'custom_rag'>('gemini_file_search');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadRagMode();
  }, []);

  async function loadRagMode() {
    try {
      const mode = await adminSettingsService.getChatbotRagMode();
      setRagMode(mode);
    } catch (error) {
      console.error('Error loading RAG mode:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleModeChange(value: string) {
    const newMode = value as 'gemini_file_search' | 'custom_rag';
    
    try {
      await adminSettingsService.setChatbotRagMode(newMode);
      setRagMode(newMode);
      
      toast({
        title: 'Başarılı',
        description: 'RAG sistemi değiştirildi',
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'RAG sistemi değiştirilemedi',
        variant: 'destructive',
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* RAG Mode Selector */}
      <Card>
        <CardHeader>
          <CardTitle>RAG Sistemi Seçimi</CardTitle>
          <CardDescription>
            Chatbot'un hangi bilgi tabanı sistemini kullanacağını seçin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={ragMode} onValueChange={handleModeChange}>
            <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
              <RadioGroupItem value="gemini_file_search" id="gemini" />
              <div className="space-y-1 leading-none">
                <Label htmlFor="gemini" className="font-medium cursor-pointer">
                  Gemini File Search API
                </Label>
                <p className="text-sm text-muted-foreground">
                  Google'ın yerleşik RAG sistemi • Maksimum 5 chunk/sorgu • Otomatik yönetim
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
              <RadioGroupItem value="custom_rag" id="custom" />
              <div className="space-y-1 leading-none">
                <Label htmlFor="custom" className="font-medium cursor-pointer">
                  Custom RAG (PostgreSQL + pgvector)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Kendi sistemimiz • Sınırsız chunk • Tam kontrol • Model seçimi • Veri sahipliği
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Conditional Store Manager */}
      {ragMode === 'gemini_file_search' ? (
        <GeminiStoreManager />
      ) : (
        <CustomRagStoreManager />
      )}
    </div>
  );
}
