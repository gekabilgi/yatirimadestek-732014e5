import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Trash2, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface DocumentUpload {
  id: string;
  filename: string;
  file_size: number;
  chunks_count: number;
  status: 'processing' | 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
}

export function KnowledgeBaseManager() {
  const [uploads, setUploads] = useState<DocumentUpload[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [missingCount, setMissingCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchUploads();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('document-uploads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'document_uploads'
        },
        () => {
          fetchUploads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUploads = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('document_uploads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUploads((data as DocumentUpload[]) || []);

      // Check for rows with missing embeddings
      const { count, error: countError } = await supabase
        .from('knowledge_base')
        .select('*', { count: 'exact', head: true })
        .is('embedding', null);

      if (!countError) {
        setMissingCount(count || 0);
      }
    } catch (error: any) {
      console.error('Error fetching uploads:', error);
      toast({
        title: "Hata",
        description: "Dökümanlar yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const parseCSV = (text: string): string => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return '';

    // Check if first line is header
    const hasHeader = lines[0].toLowerCase().includes('question') || 
                      lines[0].toLowerCase().includes('soru') ||
                      lines[0].toLowerCase().includes('content');
    
    const dataLines = hasHeader ? lines.slice(1) : lines;
    
    // Parse CSV and convert to text format
    return dataLines.map(line => {
      // Simple CSV parsing (handles basic cases)
      const columns = line.split(',').map(col => col.trim().replace(/^"(.*)"$/, '$1'));
      
      if (columns.length >= 2) {
        // Two columns: treat as Question, Answer
        return `Soru: ${columns[0]}\nCevap: ${columns[1]}\n`;
      } else {
        // Single column: treat as content
        return columns[0] + '\n';
      }
    }).join('\n');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isValidType = file.name.endsWith('.txt') || file.name.endsWith('.csv');
    if (!isValidType) {
      toast({
        title: "Hata",
        description: "Sadece .txt ve .csv dosyaları yüklenebilir",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Read file content
      let content = await file.text();
      
      // Parse CSV if needed
      if (file.name.endsWith('.csv')) {
        content = parseCSV(content);
      }

      // Create upload record
      const { data: uploadData, error: uploadError } = await supabase
        .from('document_uploads')
        .insert({
          filename: file.name,
          file_size: file.size,
          status: 'processing',
        })
        .select()
        .single();

      if (uploadError) throw uploadError;

      // Call edge function to generate embeddings
      const { data, error } = await supabase.functions.invoke('generate-embeddings', {
        body: {
          filename: file.name,
          content,
          uploadId: uploadData.id,
        },
      });

      if (error) {
        // Update status to failed
        await supabase
          .from('document_uploads')
          .update({
            status: 'failed',
            error_message: error.message,
          })
          .eq('id', uploadData.id);

        throw error;
      }

      toast({
        title: "Başarılı",
        description: `${file.name} başarıyla yüklendi ve işlendi (${data.chunks_count} parça)`,
      });

      // Refresh the list
      fetchUploads();
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: "Hata",
        description: error.message || "Dosya yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleDelete = async (id: string, filename: string) => {
    if (!confirm(`"${filename}" dosyasını ve tüm ilgili verileri silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      // Delete from knowledge base
      const { error: kbError } = await supabase
        .from('knowledge_base')
        .delete()
        .eq('filename', filename);

      if (kbError) throw kbError;

      // Delete upload record
      const { error: uploadError } = await supabase
        .from('document_uploads')
        .delete()
        .eq('id', id);

      if (uploadError) throw uploadError;

      toast({
        title: "Başarılı",
        description: "Döküman silindi",
      });

      fetchUploads();
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast({
        title: "Hata",
        description: "Döküman silinirken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: DocumentUpload['status']) => {
    switch (status) {
      case 'processing':
        return <Badge variant="outline" className="bg-yellow-100"><Loader2 className="h-3 w-3 mr-1 animate-spin" />İşleniyor</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />Tamamlandı</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Başarısız</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleProcessMissingEmbeddings = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-missing-embeddings');

      if (error) {
        throw error;
      }

      if (data.success) {
        toast({
          title: "Processing complete",
          description: `Processed ${data.processed} rows${data.failed > 0 ? `, ${data.failed} failed` : ''}.`,
        });
        fetchUploads(); // Refresh the list
      } else {
        throw new Error(data.error || 'Processing failed');
      }
    } catch (error) {
      console.error('Error processing embeddings:', error);
      toast({
        variant: "destructive",
        title: "Processing failed",
        description: error instanceof Error ? error.message : 'Failed to process embeddings',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSmartRefresh = async () => {
    await handleProcessMissingEmbeddings();
  };
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Bilgi Bankası Yönetimi
            </CardTitle>
            <CardDescription>
              Chatbot'un kullanacağı dökümanları yükleyin ve yönetin
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept=".txt,.csv"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button
              disabled={isUploading}
              className="cursor-pointer"
              asChild
            >
              <span>
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Yükleniyor...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Döküman Yükle (.txt, .csv)
                  </>
                )}
              </span>
            </Button>
          </label>
              <Button
                variant="outline"
                onClick={handleSmartRefresh}
                disabled={isLoading || isProcessing}
              >
                {(isLoading || isProcessing) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {missingCount > 0 ? (
                  <>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    İşle ve Yenile ({missingCount})
                  </>
                ) : (
                  'Yenile'
                )}
              </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dosya Adı</TableHead>
                <TableHead>Boyut</TableHead>
                <TableHead>Parça Sayısı</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Yüklenme</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uploads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Henüz döküman yüklenmedi
                  </TableCell>
                </TableRow>
              ) : (
                uploads.map((upload) => (
                  <TableRow key={upload.id}>
                    <TableCell className="font-medium">{upload.filename}</TableCell>
                    <TableCell>{formatFileSize(upload.file_size)}</TableCell>
                    <TableCell>{upload.chunks_count || '-'}</TableCell>
                    <TableCell>{getStatusBadge(upload.status)}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(upload.created_at), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(upload.id, upload.filename)}
                        disabled={upload.status === 'processing'}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
