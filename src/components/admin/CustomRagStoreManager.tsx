import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { customRagService, type CustomRagStore, type CustomRagDocument } from "@/services/customRagService";
import { Loader2, Plus, Trash2, Upload, Database, FileText, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function CustomRagStoreManager() {
  const [stores, setStores] = useState<CustomRagStore[]>([]);
  const [selectedStore, setSelectedStore] = useState<CustomRagStore | null>(null);
  const [documents, setDocuments] = useState<CustomRagDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    if (selectedStore) {
      loadDocuments(selectedStore.id);
    }
  }, [selectedStore]);

  async function loadStores() {
    try {
      setLoading(true);
      const data = await customRagService.listStores();
      setStores(data);
      
      const activeStore = data.find((s) => s.is_active);
      if (activeStore) {
        setSelectedStore(activeStore);
      } else if (data.length > 0) {
        setSelectedStore(data[0]);
      }
    } catch (error) {
      console.error("Error loading stores:", error);
      toast({
        title: "Hata",
        description: "Store'lar yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadDocuments(storeId: string) {
    try {
      const data = await customRagService.listDocuments(storeId);
      setDocuments(data);
    } catch (error) {
      console.error("Error loading documents:", error);
    }
  }

  async function handleCreateStore(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const store = await customRagService.createStore({
        name: formData.get("name") as string,
        displayName: formData.get("displayName") as string,
        embeddingModel: formData.get("embeddingModel") as "gemini" | "openai",
        embeddingDimensions: parseInt(formData.get("embeddingDimensions") as string),
        chunkSize: parseInt(formData.get("chunkSize") as string),
        chunkOverlap: parseInt(formData.get("chunkOverlap") as string),
      });

      toast({
        title: "Başarılı",
        description: "Store oluşturuldu",
      });

      setCreateDialogOpen(false);
      await loadStores();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Store oluşturulamadı",
        variant: "destructive",
      });
    }
  }

  async function handleUploadDocument(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedStore) return;

    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File;

    if (!file) {
      toast({
        title: "Hata",
        description: "Lütfen bir dosya seçin",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      let content: string;
      
      // Handle PDF files with special parsing
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        toast({
          title: "İşleniyor",
          description: "PDF dosyası okunuyor...",
        });
        
        const { extractTextFromPDF } = await import('@/utils/pdfParser');
        content = await extractTextFromPDF(file);
      } else {
        // Handle TXT, CSV, JSON files with direct reading
        content = await file.text();
      }

      if (!content || content.trim().length === 0) {
        throw new Error("Dosya içeriği boş veya okunamadı");
      }

      await customRagService.uploadDocument({
        storeId: selectedStore.id,
        fileName: file.name,
        content,
        fileType: file.type,
        fileSize: file.size,
      });

      toast({
        title: "Başarılı",
        description: "Doküman yüklendi ve işleniyor",
      });

      e.currentTarget.reset();
      setUploadDialogOpen(false);
      loadDocuments(selectedStore.id);
    } catch (error: any) {
      toast({
        title: "Hata",
        description: error.message || "Doküman yüklenemedi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSetActive(storeId: string) {
    try {
      await customRagService.setActiveStore(storeId);
      toast({
        title: "Başarılı",
        description: "Aktif store değiştirildi",
      });
      await loadStores();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Store aktif hale getirilemedi",
        variant: "destructive",
      });
    }
  }

  async function handleDeleteStore(storeId: string) {
    if (!confirm("Bu store'u ve tüm dokümanlarını silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      await customRagService.deleteStore(storeId);
      toast({
        title: "Başarılı",
        description: "Store silindi",
      });
      await loadStores();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Store silinemedi",
        variant: "destructive",
      });
    }
  }

  async function handleDeleteDocument(documentId: string) {
    if (!confirm("Bu dokümanı silmek istediğinizden emin misiniz?")) {
      return;
    }

    try {
      await customRagService.deleteDocument(documentId);
      toast({
        title: "Başarılı",
        description: "Doküman silindi",
      });
      if (selectedStore) {
        await loadDocuments(selectedStore.id);
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Doküman silinemedi",
        variant: "destructive",
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
      {/* Stores List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Custom RAG Stores
              </CardTitle>
              <CardDescription>
                PostgreSQL + pgvector ile kendi RAG sisteminizi yönetin
              </CardDescription>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Store
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Yeni Custom RAG Store</DialogTitle>
                  <DialogDescription>
                    Embedding model ve chunking ayarlarını yapılandırın
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateStore} className="space-y-4">
                  <div>
                    <Label>Store Adı</Label>
                    <Input name="name" required placeholder="my-custom-store" />
                  </div>
                  <div>
                    <Label>Görünen Ad</Label>
                    <Input name="displayName" required placeholder="Benim Store'um" />
                  </div>
                  <div>
                    <Label>Embedding Model</Label>
                    <Select name="embeddingModel" defaultValue="gemini">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gemini">Gemini text-embedding-004</SelectItem>
                        <SelectItem value="openai">OpenAI text-embedding-3-large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Embedding Boyutu</Label>
                    <Input name="embeddingDimensions" type="number" defaultValue="768" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Gemini: 256-768, OpenAI: 256-1536
                    </p>
                  </div>
                  <div>
                    <Label>Chunk Size (kelime)</Label>
                    <Input name="chunkSize" type="number" defaultValue="500" />
                  </div>
                  <div>
                    <Label>Chunk Overlap (kelime)</Label>
                    <Input name="chunkOverlap" type="number" defaultValue="100" />
                  </div>
                  <Button type="submit" className="w-full">Oluştur</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {stores.map((store) => (
              <div
                key={store.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedStore?.id === store.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setSelectedStore(store)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{store.display_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {store.embedding_model} • {store.embedding_dimensions}d • {store.chunk_size}/{store.chunk_overlap}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {store.is_active && (
                      <Badge variant="default">Aktif</Badge>
                    )}
                    {!store.is_active && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetActive(store.id);
                        }}
                      >
                        Aktif Yap
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStore(store.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {stores.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Henüz store oluşturulmamış
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      {selectedStore && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Dokümanlar
                </CardTitle>
                <CardDescription>
                  {selectedStore.display_name} store'undaki dokümanlar
                </CardDescription>
              </div>
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Doküman Yükle
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Doküman Yükle</DialogTitle>
                    <DialogDescription>
                      Doküman otomatik olarak chunk'lanacak ve embed edilecek
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleUploadDocument} className="space-y-4">
                    <div>
                      <Label>Dosya</Label>
                      <Input name="file" type="file" accept=".txt,.md,.pdf,.csv,.json" required />
                      <p className="text-xs text-muted-foreground mt-1">
                        Desteklenen formatlar: PDF, TXT, MD, CSV, JSON
                      </p>
                    </div>
                    <Button type="submit" className="w-full">Yükle ve İşle</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    {doc.status === "active" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    {doc.status === "processing" && <Clock className="h-4 w-4 text-yellow-600 animate-spin" />}
                    {doc.status === "failed" && <XCircle className="h-4 w-4 text-red-600" />}
                    <div>
                      <div className="font-medium">{doc.display_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {doc.chunks_count} chunks • {(doc.file_size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteDocument(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {documents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Henüz doküman yüklenmemiş
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
