import { useState, useEffect } from 'react';
import { GeminiStoreManager } from './GeminiStoreManager';
import { CustomRagStoreManager } from './CustomRagStoreManager';
import { VertexRagStoreManager } from './VertexRagStoreManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { adminSettingsService } from '@/services/adminSettingsService';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export function KnowledgeBaseManager() {
  const [ragMode, setRagMode] = useState<'gemini_file_search' | 'custom_rag' | 'vertex_rag_corpora'>('gemini_file_search');
  const [showSources, setShowSources] = useState(true);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const [mode, sources] = await Promise.all([
        adminSettingsService.getChatbotRagMode(),
        adminSettingsService.getChatbotShowSources()
      ]);
      setRagMode(mode);
      setShowSources(sources);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleModeChange(value: string) {
    const newMode = value as 'gemini_file_search' | 'custom_rag' | 'vertex_rag_corpora';
    
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

  async function handleShowSourcesChange(checked: boolean) {
    try {
      await adminSettingsService.setChatbotShowSources(checked);
      setShowSources(checked);
      
      toast({
        title: 'Başarılı',
        description: checked ? 'Kaynak referansları gösterilecek' : 'Kaynak referansları gizlenecek',
      });
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Ayar kaydedilemedi',
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
            
            <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
              <RadioGroupItem value="vertex_rag_corpora" id="vertex" />
              <div className="space-y-1 leading-none">
                <Label htmlFor="vertex" className="font-medium cursor-pointer">
                  Vertex AI RAG Corpora
                </Label>
                <p className="text-sm text-muted-foreground">
                  Google Cloud RAG Engine • Mevcut corpus • Kurumsal seviye • GCP entegrasyonu
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Chatbot Görünüm Ayarları</CardTitle>
          <CardDescription>
            Chatbot arayüzü ile ilgili görsel ayarlar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5 pr-4">
              <Label className="text-base font-medium">Kaynak Referanslarını Göster</Label>
              <p className="text-sm text-muted-foreground">
                Etkinleştirildiğinde, chatbot yanıtlarında [1], [2] referansları ve kullanılan belgeler gösterilir.
              </p>
            </div>
            <Switch
              checked={showSources}
              onCheckedChange={handleShowSourcesChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Conditional Store Manager */}
      {ragMode === 'gemini_file_search' ? (
        <GeminiStoreManager />
      ) : ragMode === 'custom_rag' ? (
        <CustomRagStoreManager />
      ) : (
        <VertexRagStoreManager />
      )}
    </div>
  );
}
