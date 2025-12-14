import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, ExternalLink, TestTube, Cloud, Settings, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { adminSettingsService } from "@/services/adminSettingsService";

export const VertexRagStoreManager = () => {
  const { toast } = useToast();
  const [corpusName, setCorpusName] = useState("");
  const [activeCorpus, setActiveCorpus] = useState<string | null>(null);
  const [topK, setTopK] = useState(10);
  const [vectorDistanceThreshold, setVectorDistanceThreshold] = useState(0.3);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadActiveCorpus();
  }, []);

  const loadActiveCorpus = async () => {
    try {
      const corpus = await adminSettingsService.getActiveVertexCorpus();
      setActiveCorpus(corpus);
      if (corpus) setCorpusName(corpus);
    } catch (error) {
      console.error("Error loading active corpus:", error);
    }
  };

  const handleSetActiveCorpus = async () => {
    if (!corpusName.trim()) {
      toast({ title: "Hata", description: "Corpus adı girin", variant: "destructive" });
      return;
    }

    const corpusPattern = /^projects\/\d+\/locations\/[^\/]+\/ragCorpora\/\d+$/;
    if (!corpusPattern.test(corpusName.trim())) {
      toast({ title: "Hata", description: "Geçersiz corpus formatı. Beklenen: projects/{project}/locations/{location}/ragCorpora/{id}", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await adminSettingsService.setActiveVertexCorpus(corpusName.trim());
      setActiveCorpus(corpusName.trim());
      toast({ title: "Başarılı", description: "Vertex RAG Corpus güncellendi" });
    } catch (error) {
      toast({ title: "Hata", description: "Corpus güncellenemedi", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!activeCorpus) {
      toast({ title: "Hata", description: "Önce corpus ayarlayın", variant: "destructive" });
      return;
    }

    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("vertex-rag-query", {
        body: { corpusName: activeCorpus, messages: [{ role: "user", content: "Test" }], topK, vectorDistanceThreshold },
      });
      if (error) throw error;
      toast({ title: "Başarılı", description: "Bağlantı testi başarılı" });
    } catch (error) {
      toast({ title: "Hata", description: error instanceof Error ? error.message : "Bağlantı hatası", variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await adminSettingsService.setVertexRagSettings({ topK, vectorDistanceThreshold });
      toast({ title: "Başarılı", description: "Ayarlar kaydedildi" });
    } catch (error) {
      toast({ title: "Hata", description: "Ayarlar kaydedilemedi", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Corpus Configuration */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Vertex AI RAG Corpus</span>
            {activeCorpus && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 gap-1">
                <CheckCircle2 className="h-2.5 w-2.5" /> Bağlı
              </Badge>
            )}
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => window.open("https://console.cloud.google.com/vertex-ai/rag", "_blank")}>
            <ExternalLink className="h-3 w-3 mr-1" /> GCP Konsol
          </Button>
        </div>

        <div className="p-3 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Corpus Resource Name</Label>
            <div className="flex gap-2">
              <Input
                placeholder="projects/{project}/locations/{location}/ragCorpora/{id}"
                value={corpusName}
                onChange={(e) => setCorpusName(e.target.value)}
                disabled={loading}
                className="h-8 text-sm font-mono"
              />
              <Button size="sm" className="h-8" onClick={handleSetActiveCorpus} disabled={loading}>
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Kaydet"}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={handleTestConnection} disabled={!activeCorpus || testing}>
              {testing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <TestTube className="h-3 w-3 mr-1" />}
              Bağlantı Test
            </Button>
          </div>
        </div>
      </div>

      {/* Search Settings */}
      <div className="rounded-lg border bg-card">
        <div className="flex items-center gap-2 p-3 border-b">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Arama Ayarları</span>
        </div>

        <div className="p-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Top K</Label>
              <Input
                type="number"
                min="1"
                max="50"
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value) || 10)}
                className="h-8 text-sm"
              />
              <p className="text-[10px] text-muted-foreground">Benzer chunk sayısı (1-50)</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Distance Threshold</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={vectorDistanceThreshold}
                onChange={(e) => setVectorDistanceThreshold(parseFloat(e.target.value) || 0.3)}
                className="h-8 text-sm"
              />
              <p className="text-[10px] text-muted-foreground">Min benzerlik (0-1)</p>
            </div>
          </div>

          <Button size="sm" className="h-7 text-xs" onClick={handleSaveSettings} disabled={loading}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
            Kaydet
          </Button>
        </div>
      </div>
    </div>
  );
};
