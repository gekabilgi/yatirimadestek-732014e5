import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { customRagService, type CustomRagStore, type CustomRagDocument } from "@/services/customRagService";
import { Loader2, Plus, Trash2, Upload, Database, FileText, CheckCircle2, XCircle, Clock, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function CustomRagStoreManager() {
  const [stores, setStores] = useState<CustomRagStore[]>([]);
  const [expandedStore, setExpandedStore] = useState<CustomRagStore | null>(null);
  const [documents, setDocuments] = useState<CustomRagDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    if (expandedStore) {
      loadDocuments(expandedStore.id);
    }
  }, [expandedStore]);

  async function loadStores() {
    try {
      setLoading(true);
      const data = await customRagService.listStores();
      setStores(data);
      
      const activeStore = data.find((s) => s.is_active);
      if (activeStore) {
        setExpandedStore(activeStore);
      }
    } catch (error) {
      console.error("Error loading stores:", error);
      toast({ title: "Hata", description: "Store'lar yüklenemedi", variant: "destructive" });
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
      await customRagService.createStore({
        name: formData.get("name") as string,
        displayName: formData.get("displayName") as string,
        embeddingModel: formData.get("embeddingModel") as "gemini" | "openai",
        embeddingDimensions: parseInt(formData.get("embeddingDimensions") as string),
        chunkSize: parseInt(formData.get("chunkSize") as string),
        chunkOverlap: parseInt(formData.get("chunkOverlap") as string),
      });

      toast({ title: "Başarılı", description: "Store oluşturuldu" });
      setCreateDialogOpen(false);
      await loadStores();
    } catch (error) {
      toast({ title: "Hata", description: "Store oluşturulamadı", variant: "destructive" });
    }
  }

  async function handleUploadDocument(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!expandedStore) return;

    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File;

    if (!file) {
      toast({ title: "Hata", description: "Lütfen bir dosya seçin", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      let content: string;
      
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        toast({ title: "İşleniyor", description: "PDF dosyası okunuyor..." });
        const { extractTextFromPDF } = await import('@/utils/pdfParser');
        content = await extractTextFromPDF(file);
      } else {
        content = await file.text();
      }

      if (!content || content.trim().length === 0) {
        throw new Error("Dosya içeriği boş veya okunamadı");
      }

      await customRagService.uploadDocument({
        storeId: expandedStore.id,
        fileName: file.name,
        content,
        fileType: file.type,
        fileSize: file.size,
      });

      toast({ title: "Başarılı", description: "Doküman yüklendi" });
      e.currentTarget.reset();
      setUploadDialogOpen(false);
      loadDocuments(expandedStore.id);
    } catch (error: any) {
      toast({ title: "Hata", description: error.message || "Doküman yüklenemedi", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSetActive(e: React.MouseEvent, storeId: string) {
    e.stopPropagation();
    try {
      await customRagService.setActiveStore(storeId);
      toast({ title: "Başarılı", description: "Aktif store değiştirildi" });
      await loadStores();
    } catch (error) {
      toast({ title: "Hata", description: "Store aktif hale getirilemedi", variant: "destructive" });
    }
  }

  async function handleDeleteStore(e: React.MouseEvent, storeId: string) {
    e.stopPropagation();
    if (!confirm("Bu store ve tüm dokümanları silinecek. Emin misiniz?")) return;

    try {
      await customRagService.deleteStore(storeId);
      toast({ title: "Başarılı", description: "Store silindi" });
      if (expandedStore?.id === storeId) setExpandedStore(null);
      await loadStores();
    } catch (error) {
      toast({ title: "Hata", description: "Store silinemedi", variant: "destructive" });
    }
  }

  async function handleDeleteDocument(documentId: string) {
    if (!confirm("Dokümanı silmek istediğinize emin misiniz?")) return;

    try {
      await customRagService.deleteDocument(documentId);
      toast({ title: "Başarılı", description: "Doküman silindi" });
      if (expandedStore) await loadDocuments(expandedStore.id);
    } catch (error) {
      toast({ title: "Hata", description: "Doküman silinemedi", variant: "destructive" });
    }
  }

  if (loading && stores.length === 0) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Custom RAG Stores</span>
          <Badge variant="outline" className="text-xs">{stores.length} store</Badge>
        </div>
        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Yeni Store
        </Button>
      </div>

      {/* Store List */}
      {stores.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm border rounded-lg bg-muted/20">
          Henüz store oluşturulmamış
        </div>
      ) : (
        <div className="space-y-2">
          {stores.map((store) => (
            <Collapsible
              key={store.id}
              open={expandedStore?.id === store.id}
              onOpenChange={(open) => setExpandedStore(open ? store : null)}
            >
              <div className={`rounded-lg border transition-colors ${expandedStore?.id === store.id ? 'border-primary bg-primary/5' : 'bg-card'}`}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 rounded-t-lg">
                    <div className="flex items-center gap-2">
                      {expandedStore?.id === store.id ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Database className="h-4 w-4 text-primary" />
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{store.display_name}</span>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                            {store.embedding_model}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                            {store.embedding_dimensions}d
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                            {store.chunk_size}/{store.chunk_overlap}
                          </Badge>
                        </div>
                      </div>
                      {store.is_active && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 gap-1 ml-2">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Aktif
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {!store.is_active && (
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={(e) => handleSetActive(e, store.id)}>
                          Aktif Yap
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={(e) => handleDeleteStore(e, store.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="border-t p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{documents.length} doküman</span>
                      <Button size="sm" className="h-7 text-xs" onClick={() => setUploadDialogOpen(true)}>
                        <Upload className="h-3 w-3 mr-1" /> Yükle
                      </Button>
                    </div>

                    {documents.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground text-xs">
                        Henüz doküman yok
                      </div>
                    ) : (
                      <div className="space-y-1 max-h-64 overflow-y-auto">
                        {documents.map((doc) => (
                          <div key={doc.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 group">
                            {doc.status === "active" && <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />}
                            {doc.status === "processing" && <Clock className="h-3.5 w-3.5 text-yellow-600 animate-spin flex-shrink-0" />}
                            {doc.status === "failed" && <XCircle className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />}
                            <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs truncate flex-1">{doc.display_name}</span>
                            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">{doc.chunks_count} chunks</Badge>
                            <span className="text-[10px] text-muted-foreground">{(doc.file_size / 1024).toFixed(1)} KB</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteDocument(doc.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>
      )}

      {/* Create Store Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Custom RAG Store</DialogTitle>
            <DialogDescription>Embedding model ve chunking ayarlarını yapılandırın</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateStore} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Store Adı</Label>
                <Input name="name" required placeholder="my-store" className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Görünen Ad</Label>
                <Input name="displayName" required placeholder="Benim Store'um" className="h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Embedding Model</Label>
                <Select name="embeddingModel" defaultValue="gemini">
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini">Gemini</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Boyut</Label>
                <Input name="embeddingDimensions" type="number" defaultValue="768" className="h-8 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Chunk Size</Label>
                <Input name="chunkSize" type="number" defaultValue="500" className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Overlap</Label>
                <Input name="chunkOverlap" type="number" defaultValue="100" className="h-8 text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setCreateDialogOpen(false)}>İptal</Button>
              <Button type="submit" size="sm">Oluştur</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Doküman Yükle</DialogTitle>
            <DialogDescription>PDF, TXT, MD, CSV veya JSON dosyası</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUploadDocument} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Dosya</Label>
              <Input name="file" type="file" accept=".txt,.md,.pdf,.csv,.json" required className="h-8 text-sm" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setUploadDialogOpen(false)}>İptal</Button>
              <Button type="submit" size="sm" disabled={loading}>
                {loading && <Loader2 className="h-3 w-3 animate-spin mr-1" />} Yükle
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
