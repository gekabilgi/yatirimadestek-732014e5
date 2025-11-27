import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, ExternalLink, TestTube } from "lucide-react";
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
      if (corpus) {
        setCorpusName(corpus);
      }
    } catch (error) {
      console.error("Error loading active corpus:", error);
    }
  };

  const handleSetActiveCorpus = async () => {
    if (!corpusName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a corpus name",
        variant: "destructive",
      });
      return;
    }

    // Validate corpus name format
    const corpusPattern = /^projects\/\d+\/locations\/[^\/]+\/ragCorpora\/\d+$/;
    if (!corpusPattern.test(corpusName.trim())) {
      toast({
        title: "Error",
        description: "Invalid corpus name format. Expected: projects/{project}/locations/{location}/ragCorpora/{corpus_id}",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await adminSettingsService.setActiveVertexCorpus(corpusName.trim());
      setActiveCorpus(corpusName.trim());
      toast({
        title: "Success",
        description: "Active Vertex RAG Corpus updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update active corpus",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!activeCorpus) {
      toast({
        title: "Error",
        description: "Please set an active corpus first",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("vertex-rag-query", {
        body: {
          corpusName: activeCorpus,
          messages: [{ role: "user", content: "Test connection" }],
          topK,
          vectorDistanceThreshold,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Connection test successful",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Connection test failed",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await adminSettingsService.setVertexRagSettings({
        topK,
        vectorDistanceThreshold,
      });
      toast({
        title: "Success",
        description: "Vertex RAG settings saved",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vertex AI RAG Corpus</CardTitle>
          <CardDescription>
            Connect to your existing Google Cloud Vertex AI RAG Corpus
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="corpusName">Corpus Resource Name</Label>
            <Input
              id="corpusName"
              placeholder="projects/{project}/locations/{location}/ragCorpora/{corpus_id}"
              value={corpusName}
              onChange={(e) => setCorpusName(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Format: projects/394408754498/locations/europe-west1/ragCorpora/6917529027641081856
            </p>
          </div>

          {activeCorpus && (
            <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Active Corpus Set</span>
              <Badge variant="outline" className="ml-auto">
                Active
              </Badge>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSetActiveCorpus} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Set Active Corpus
            </Button>
            <Button
              variant="secondary"
              onClick={handleTestConnection}
              disabled={!activeCorpus || testing}
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <TestTube className="h-4 w-4 mr-2" />}
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Search Settings</CardTitle>
          <CardDescription>
            Configure retrieval parameters for Vertex RAG
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topK">Top K (Similarity Count)</Label>
            <Input
              id="topK"
              type="number"
              min="1"
              max="50"
              value={topK}
              onChange={(e) => setTopK(parseInt(e.target.value) || 10)}
            />
            <p className="text-xs text-muted-foreground">
              Number of most similar chunks to retrieve (1-50)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="threshold">Vector Distance Threshold</Label>
            <Input
              id="threshold"
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={vectorDistanceThreshold}
              onChange={(e) => setVectorDistanceThreshold(parseFloat(e.target.value) || 0.3)}
            />
            <p className="text-xs text-muted-foreground">
              Minimum similarity threshold (0.0-1.0, lower = more similar)
            </p>
          </div>

          <Button onClick={handleSaveSettings} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Corpus in Vertex AI Console</CardTitle>
          <CardDescription>
            Upload and manage documents through Google Cloud Console
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => window.open("https://console.cloud.google.com/vertex-ai/rag", "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Vertex AI Console
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            You can manage documents, configure chunking, and monitor your RAG corpus directly in the Google Cloud Console.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
