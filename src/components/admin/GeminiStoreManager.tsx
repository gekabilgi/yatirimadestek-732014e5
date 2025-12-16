import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Upload, FileText, CheckCircle2, FolderOpen, ChevronDown, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  listRagStores,
  createRagStore,
  deleteRagStore,
  listDocuments,
  uploadDocument,
  deleteDocument,
  getActiveStore,
  setActiveStore,
  type RagStore,
  type Document,
} from "@/services/geminiRagService";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export const GeminiStoreManager = () => {
  const { toast } = useToast();
  const [stores, setStores] = useState<RagStore[]>([]);
  const [expandedStore, setExpandedStore] = useState<string | null>(null);
  const [activeStore, setActiveStoreState] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customFileName, setCustomFileName] = useState("");
  const [metadata, setMetadata] = useState<Array<{ key: string; value: string }>>([{ key: "", value: "" }]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadStores();
    getActiveStore().then(setActiveStoreState);
  }, []);

  useEffect(() => {
    if (expandedStore) {
      loadDocuments(expandedStore);
      setSelectedDocs(new Set());
    } else {
      setDocuments([]);
    }
  }, [expandedStore]);

  const loadStores = async () => {
    setLoading(true);
    try {
      const data = await listRagStores();
      setStores(data);
    } catch (error) {
      toast({ title: "Hata", description: "Store'lar yüklenemedi", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async (storeName: string) => {
    try {
      const data = await listDocuments(storeName);
      setDocuments(data);
    } catch (error) {
      toast({ title: "Hata", description: "Dokümanlar yüklenemedi", variant: "destructive" });
    }
  };

  const handleCreateStore = async () => {
    if (!newStoreName.trim()) {
      toast({ title: "Hata", description: "Store adı girin", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await createRagStore(newStoreName);
      setNewStoreName("");
      setShowCreateDialog(false);
      toast({ title: "Başarılı", description: "Store oluşturuldu" });
      await loadStores();
    } catch (error) {
      toast({ title: "Hata", description: "Store oluşturulamadı", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStore = async (e: React.MouseEvent, storeName: string) => {
    e.stopPropagation();
    if (!confirm("Bu store ve tüm dokümanları silinecek. Emin misiniz?")) return;
    setLoading(true);
    try {
      await deleteRagStore(storeName);
      if (expandedStore === storeName) setExpandedStore(null);
      if (activeStore === storeName) {
        setActiveStoreState(null);
        await setActiveStore("");
      }
      toast({ title: "Başarılı", description: "Store silindi" });
      await loadStores();
    } catch (error) {
      toast({ title: "Hata", description: "Store silinemedi", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSetActiveStore = async (e: React.MouseEvent, storeName: string) => {
    e.stopPropagation();
    try {
      await setActiveStore(storeName);
      setActiveStoreState(storeName);
      toast({ title: "Başarılı", description: "Aktif store güncellendi" });
    } catch (error) {
      toast({ title: "Hata", description: "Store aktif yapılamadı", variant: "destructive" });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/pdf", "text/plain", "text/csv", "application/json",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Hata", description: "DOCX, XLSX, PDF, TXT veya CSV dosyası yükleyin", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
    setCustomFileName(file.name);
  };

  const handleUpload = async () => {
    if (!selectedFile || !expandedStore) return;
    setUploading(true);
    try {
      const validMetadata = metadata.filter((m) => m.key.trim() !== "").map((m) => ({ key: m.key.trim(), stringValue: m.value.trim() }));
      await uploadDocument(expandedStore, selectedFile, customFileName || selectedFile.name, validMetadata.length > 0 ? validMetadata : undefined);
      toast({ title: "Başarılı", description: "Doküman yüklendi" });
      await loadDocuments(expandedStore);
      setShowUploadDialog(false);
      setSelectedFile(null);
      setCustomFileName("");
      setMetadata([{ key: "", value: "" }]);
    } catch (error) {
      toast({ title: "Hata", description: error instanceof Error ? error.message : "Yükleme başarısız", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docName: string) => {
    if (!confirm("Dokümanı silmek istediğinize emin misiniz?")) return;
    try {
      await deleteDocument(docName);
      toast({ title: "Başarılı", description: "Doküman silindi" });
      if (expandedStore) await loadDocuments(expandedStore);
    } catch (error) {
      toast({ title: "Hata", description: "Doküman silinemedi", variant: "destructive" });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDocs.size === 0) return;
    if (!confirm(`${selectedDocs.size} doküman silinecek. Emin misiniz?`)) return;
    setLoading(true);
    try {
      await Promise.all(Array.from(selectedDocs).map((docName) => deleteDocument(docName)));
      toast({ title: "Başarılı", description: `${selectedDocs.size} doküman silindi` });
      setSelectedDocs(new Set());
      if (expandedStore) await loadDocuments(expandedStore);
    } catch (error) {
      toast({ title: "Hata", description: "Bazı dokümanlar silinemedi", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return "N/A";
    const size = parseInt(bytes);
    if (isNaN(size)) return "N/A";
    const units = ["B", "KB", "MB"];
    let unitIndex = 0;
    let fileSize = size;
    while (fileSize >= 1024 && unitIndex < units.length - 1) {
      fileSize /= 1024;
      unitIndex++;
    }
    return `${fileSize.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Gemini File Search Stores</span>
          <Badge variant="outline" className="text-xs">{stores.length} store</Badge>
        </div>
        <Button size="sm" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Yeni Store
        </Button>
      </div>

      {/* Store List */}
      {loading && stores.length === 0 ? (
        <div className="flex justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : stores.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm border rounded-lg bg-muted/20">
          Henüz store oluşturulmamış
        </div>
      ) : (
        <div className="space-y-2">
          {stores.map((store) => (
            <Collapsible
              key={store.name}
              open={expandedStore === store.name}
              onOpenChange={(open) => setExpandedStore(open ? store.name : null)}
            >
              <div className={`rounded-lg border transition-colors ${expandedStore === store.name ? 'border-primary bg-primary/5' : 'bg-card'}`}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 rounded-t-lg">
                    <div className="flex items-center gap-2">
                      {expandedStore === store.name ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <FolderOpen className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{store.displayName}</span>
                      {activeStore === store.name && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 gap-1">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Aktif
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {activeStore !== store.name && (
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={(e) => handleSetActiveStore(e, store.name)}>
                          Aktif Yap
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={(e) => handleDeleteStore(e, store.name)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="border-t p-3 space-y-3">
                    {/* Document Actions */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{documents.length} doküman</span>
                      <div className="flex items-center gap-2">
                        {selectedDocs.size > 0 && (
                          <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={handleBulkDelete}>
                            <Trash2 className="h-3 w-3 mr-1" /> {selectedDocs.size} Sil
                          </Button>
                        )}
                        <Button size="sm" className="h-7 text-xs" onClick={() => setShowUploadDialog(true)}>
                          <Upload className="h-3 w-3 mr-1" /> Yükle
                        </Button>
                      </div>
                    </div>

                    {/* Document List */}
                    {documents.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground text-xs">
                        Henüz doküman yok
                      </div>
                    ) : (
                      <div className="space-y-1 max-h-64 overflow-y-auto">
                        {documents.map((doc) => {
                          const displayName = doc.displayName || doc.customMetadata?.find(m => m.key === 'Dosya')?.stringValue || doc.name.split('/').pop() || doc.name;
                          return (
                            <div key={doc.name} className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 group">
                              <Checkbox
                                checked={selectedDocs.has(doc.name)}
                                onCheckedChange={(checked) => {
                                  const newSet = new Set(selectedDocs);
                                  if (checked) newSet.add(doc.name);
                                  else newSet.delete(doc.name);
                                  setSelectedDocs(newSet);
                                }}
                              />
                              <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                              <span className="text-xs truncate flex-1" title={displayName}>{displayName}</span>
                              <span className="text-[10px] text-muted-foreground">{formatFileSize(doc.sizeBytes)}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteDocument(doc.name)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          );
                        })}
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
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Store Oluştur</DialogTitle>
            <DialogDescription>Gemini File Search için yeni bir store oluşturun</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Store Adı</Label>
              <Input placeholder="my-store" value={newStoreName} onChange={(e) => setNewStoreName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreateStore()} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>İptal</Button>
              <Button onClick={handleCreateStore} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Oluştur
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Doküman Yükle</DialogTitle>
            <DialogDescription>DOCX, XLSX, PDF, TXT veya CSV dosyası yükleyin</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Dosya</Label>
              <Input type="file" accept=".docx,.xlsx,.pdf,.txt,.csv,.json" onChange={handleFileSelect} ref={fileInputRef} />
            </div>
            {selectedFile && (
              <div className="space-y-2">
                <Label>Görünen Ad</Label>
                <Input value={customFileName} onChange={(e) => setCustomFileName(e.target.value)} />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>İptal</Button>
              <Button onClick={handleUpload} disabled={uploading || !selectedFile}>
                {uploading && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Yükle
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
