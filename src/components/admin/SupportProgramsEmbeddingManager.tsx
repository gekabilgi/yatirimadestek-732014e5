import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, Plus, CheckCircle, XCircle, Search, Building2, Database } from 'lucide-react';

interface SupportProgram {
  id: string;
  title: string;
  institution_id: number | null;
  embedding: string | null;
  updated_at: string;
  institution?: { name: string } | null;
}

export function SupportProgramsEmbeddingManager() {
  const [programs, setPrograms] = useState<SupportProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const stats = {
    total: programs.length,
    withEmbedding: programs.filter(p => p.embedding !== null).length,
    withoutEmbedding: programs.filter(p => p.embedding === null).length,
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  async function loadPrograms() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_programs')
        .select('id, title, institution_id, embedding, updated_at, institutions(name)')
        .order('title');

      if (error) throw error;
      
      setPrograms(data?.map(p => ({
        ...p,
        institution: p.institutions as { name: string } | null
      })) || []);
    } catch (error) {
      console.error('Error loading programs:', error);
      toast({
        title: 'Hata',
        description: 'Programlar yüklenemedi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function generateAllEmbeddings() {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-support-embeddings', {
        body: { generateAll: true }
      });

      if (error) throw error;

      toast({
        title: 'Başarılı',
        description: `${data?.updated || 0} program için embedding oluşturuldu`,
      });
      
      loadPrograms();
    } catch (error) {
      console.error('Error generating embeddings:', error);
      toast({
        title: 'Hata',
        description: 'Embedding oluşturulamadı',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  }

  async function generateMissingEmbeddings() {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-support-embeddings', {
        body: { generateAll: true }
      });

      if (error) throw error;

      toast({
        title: 'Başarılı',
        description: `${data?.updated || 0} eksik embedding tamamlandı`,
      });
      
      loadPrograms();
    } catch (error) {
      console.error('Error generating embeddings:', error);
      toast({
        title: 'Hata',
        description: 'Embedding oluşturulamadı',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  }

  async function generateSingleEmbedding(programId: string) {
    setGeneratingId(programId);
    try {
      const { data, error } = await supabase.functions.invoke('generate-support-embeddings', {
        body: { programId }
      });

      if (error) throw error;

      toast({
        title: 'Başarılı',
        description: 'Embedding oluşturuldu',
      });
      
      loadPrograms();
    } catch (error) {
      console.error('Error generating embedding:', error);
      toast({
        title: 'Hata',
        description: 'Embedding oluşturulamadı',
        variant: 'destructive',
      });
    } finally {
      setGeneratingId(null);
    }
  }

  const filteredPrograms = programs.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.institution?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
        <div className="p-2 rounded-lg bg-primary/10">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Site İçi Destek Programları</h3>
          <p className="text-xs text-muted-foreground">
            support_programs tablosundaki verileri chatbot'a entegre edin
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Toplam Program</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats.withEmbedding}</p>
              <p className="text-xs text-muted-foreground">Embedding Hazır</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{stats.withoutEmbedding}</p>
              <p className="text-xs text-muted-foreground">Eksik</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={generateAllEmbeddings}
          disabled={generating}
          variant="outline"
          size="sm"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Tümünü Güncelle
        </Button>
        <Button
          onClick={generateMissingEmbeddings}
          disabled={generating || stats.withoutEmbedding === 0}
          variant="outline"
          size="sm"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Eksikleri Tamamla ({stats.withoutEmbedding})
        </Button>
      </div>

      {/* Program List */}
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Program Listesi</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[400px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Program</TableHead>
                  <TableHead>Kurum</TableHead>
                  <TableHead className="w-24 text-center">Embedding</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrograms.map((program) => (
                  <TableRow key={program.id}>
                    <TableCell className="font-medium truncate max-w-[200px]">
                      {program.title}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {program.institution?.name || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {program.embedding ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Hazır
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                          <XCircle className="h-3 w-3 mr-1" />
                          Eksik
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => generateSingleEmbedding(program.id)}
                        disabled={generatingId === program.id}
                      >
                        {generatingId === program.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPrograms.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      {searchQuery ? 'Sonuç bulunamadı' : 'Henüz program yok'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Info Note */}
      <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg">
        ℹ️ Embedding oluşturulan programlar, chatbot'ta "destek programı" sorguları için otomatik olarak aranır.
        Bu özellik seçili RAG sisteminden bağımsız çalışır.
      </div>
    </div>
  );
}
