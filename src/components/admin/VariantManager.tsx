import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  Loader2,
  Save,
  X,
  GitMerge,
  Upload,
  Download,
} from "lucide-react";
import * as XLSX from 'xlsx';

interface QuestionVariant {
  id: string;
  canonical_question: string;
  canonical_answer: string;
  variants: string[];
  source_document: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export function VariantManager() {
  const [variants, setVariants] = useState<QuestionVariant[]>([]);
  const [filteredVariants, setFilteredVariants] = useState<QuestionVariant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingVariant, setEditingVariant] = useState<QuestionVariant | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRegeneratingEmbedding, setIsRegeneratingEmbedding] = useState(false);
  const [isBatchRegenerating, setIsBatchRegenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const { toast } = useToast();

  useEffect(() => {
    fetchVariants();

    // Realtime subscription
    const channel = supabase
      .channel("question-variants-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "question_variants",
        },
        () => {
          fetchVariants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredVariants(variants);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = variants.filter(
      (v) =>
        v.canonical_question.toLowerCase().includes(query) ||
        v.canonical_answer.toLowerCase().includes(query) ||
        v.variants.some((variant) => variant.toLowerCase().includes(query))
    );
    setFilteredVariants(filtered);
  }, [searchQuery, variants]);

  const fetchVariants = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("question_variants")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setVariants(data || []);
      setFilteredVariants(data || []);
    } catch (error: any) {
      console.error("Error fetching variants:", error);
      toast({
        title: "Hata",
        description: "Varyantlar yüklenirken bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingVariant) return;

    const cleanedVariants = editingVariant.variants.filter((v) => v.trim());

    // Boş varyant uyarısı
    if (cleanedVariants.length < editingVariant.variants.length) {
      toast({
        title: "Uyarı",
        description: "Boş varyantlar otomatik olarak kaldırıldı",
      });
    }

    try {
      const { error } = await supabase
        .from("question_variants")
        .update({
          canonical_question: editingVariant.canonical_question,
          canonical_answer: editingVariant.canonical_answer,
          variants: cleanedVariants,
          source_document: editingVariant.source_document,
        })
        .eq("id", editingVariant.id);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Değişiklikler kaydedildi",
      });

      setIsDialogOpen(false);
      setEditingVariant(null);
      fetchVariants();
    } catch (error: any) {
      console.error("Error saving variant:", error);
      toast({
        title: "Hata",
        description: "Kaydederken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("question_variants")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Soru grubu silindi",
      });

      setDeleteId(null);
      fetchVariants();
    } catch (error: any) {
      console.error("Error deleting variant:", error);
      toast({
        title: "Hata",
        description: "Silerken bir hata oluştu",
        variant: "destructive",
      });
    }
  };

  const addVariant = () => {
    if (!editingVariant) return;
    
    // Boş bir input field ekle - kullanıcı sonradan dolduracak
    const newVariants = [...editingVariant.variants, ""];
    setEditingVariant({
      ...editingVariant,
      variants: newVariants,
    });

    // Yeni eklenen input'a odaklan
    setTimeout(() => {
      const inputs = document.querySelectorAll('input[type="text"]');
      const lastInput = inputs[inputs.length - 1] as HTMLInputElement;
      lastInput?.focus();
    }, 100);
  };

  const removeVariant = (index: number) => {
    if (!editingVariant) return;
    
    const newVariants = editingVariant.variants.filter((_, i) => i !== index);
    setEditingVariant({
      ...editingVariant,
      variants: newVariants,
    });
  };

  const regenerateEmbedding = async () => {
    if (!editingVariant) return;

    setIsRegeneratingEmbedding(true);
    
    try {
      toast({
        title: "Embedding Oluşturuluyor",
        description: "Lütfen bekleyin...",
      });

      const { data: embeddingData, error: embeddingError } = 
        await supabase.functions.invoke('generate-embeddings', {
          body: { text: editingVariant.canonical_question }
        });

      if (embeddingError) throw embeddingError;
      
      // Update the database
      const { error: updateError } = await supabase
        .from("question_variants")
        .update({ embedding: embeddingData.embedding })
        .eq("id", editingVariant.id);

      if (updateError) throw updateError;

      toast({
        title: "Başarılı",
        description: "Embedding başarıyla yenilendi",
      });

      fetchVariants();
    } catch (error: any) {
      console.error("Embedding regeneration error:", error);
      toast({
        title: "Hata",
        description: "Embedding yenilenirken bir hata oluştu: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsRegeneratingEmbedding(false);
    }
  };

  const regenerateAllEmbeddings = async () => {
    setIsBatchRegenerating(true);
    setBatchProgress({ current: 0, total: variants.length });

    try {
      toast({
        title: "Toplu Güncelleme Başladı",
        description: `${variants.length} varyant için embedding oluşturulacak`,
      });

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < variants.length; i++) {
        const variant = variants[i];
        setBatchProgress({ current: i + 1, total: variants.length });

        try {
          // Embedding oluştur
          const { data: embeddingData, error: embeddingError } = 
            await supabase.functions.invoke('generate-embeddings', {
              body: { text: variant.canonical_question }
            });

          if (embeddingError) throw embeddingError;

          // Database'e kaydet
          const { error: updateError } = await supabase
            .from("question_variants")
            .update({ embedding: embeddingData.embedding })
            .eq("id", variant.id);

          if (updateError) throw updateError;
          
          successCount++;
          
          // Progress toast (her 5 varyantda bir)
          if ((i + 1) % 5 === 0) {
            toast({
              title: "İşleniyor...",
              description: `${i + 1} / ${variants.length} tamamlandı`,
            });
          }
          
          // Rate limit koruması (saniyede 1 istek)
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`Error regenerating embedding for variant ${variant.id}:`, error);
          errorCount++;
        }
      }

      toast({
        title: "Toplu Güncelleme Tamamlandı",
        description: `✅ ${successCount} başarılı, ❌ ${errorCount} hata`,
      });

      fetchVariants();
      
    } catch (error: any) {
      console.error("Batch regeneration error:", error);
      toast({
        title: "Hata",
        description: "Toplu güncelleme sırasında bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsBatchRegenerating(false);
      setBatchProgress({ current: 0, total: 0 });
      setShowBatchConfirm(false);
    }
  };

  const exportToCSV = () => {
    const csvHeader = "id,canonical_question,canonical_answer,variants,source_document\n";
    const csvRows = variants.map(v => {
      const variantsStr = v.variants.join("|");
      return `${v.id},"${v.canonical_question.replace(/"/g, '""')}","${v.canonical_answer.replace(/"/g, '""')}","${variantsStr}","${v.source_document || ""}"`;
    }).join("\n");
    
    const csvContent = csvHeader + csvRows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `question_variants_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "CSV İndirildi",
      description: `${variants.length} varyant CSV olarak indirildi`,
    });
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportProgress({ current: 0, total: 0 });

    try {
      const fileName = file.name.toLowerCase();
      const isXLSX = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
      let rows: any[] = [];

      if (isXLSX) {
        // Handle XLSX files
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        // Skip header row and convert to structured format
        rows = (jsonData as any[]).slice(1).map((row: any) => ({
          id: row[0]?.toString().trim() || '',
          canonical_question: row[1]?.toString().trim() || '',
          canonical_answer: row[2]?.toString().trim() || '',
          variants: row[3],
          source_document: row[4]?.toString().trim() || ''
        }));
      } else {
        // Handle CSV files
        const text = await file.text();
        const cleanText = text.replace(/^\uFEFF/, ''); // Remove BOM
        const lines = cleanText.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          toast({
            title: "Hata",
            description: "Dosya boş veya sadece başlık satırı içeriyor",
            variant: "destructive",
          });
          return;
        }

        // Skip header and parse CSV rows
        const dataLines = lines.slice(1);
        rows = dataLines.map(line => {
          const regex = /(?:^|,)("(?:[^"]|"")*"|[^,]*)/g;
          const matches = [...line.matchAll(regex)]
            .map(match => match[1])
            .filter(val => val !== undefined)
            .map(val => val.replace(/^"|"$/g, '').replace(/""/g, '"').trim());

          return {
            id: matches[0] || '',
            canonical_question: matches[1] || '',
            canonical_answer: matches[2] || '',
            variants: matches[3],
            source_document: matches[4] || ''
          };
        });
      }

      setImportProgress({ current: 0, total: rows.length });

      toast({
        title: "İçe Aktarma Başladı",
        description: `${rows.length} satır işlenecek...`,
      });

      let insertCount = 0;
      let updateCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        setImportProgress({ current: i + 1, total: rows.length });

        try {
          if (!row.canonical_question) {
            errors.push(`Satır ${i + 2}: Soru alanı boş`);
            errorCount++;
            continue;
          }

          // Parse variants - support multiple formats
          let variants: string[] = [];
          try {
            if (typeof row.variants === 'string') {
              const variantsStr = row.variants.trim();
              if (variantsStr.startsWith('[')) {
                // JSON array format: ["variant1", "variant2"]
                variants = JSON.parse(variantsStr);
              } else if (variantsStr.includes('|')) {
                // Pipe-separated format: variant1|variant2
                variants = variantsStr.split('|').map(v => v.trim()).filter(v => v);
              } else {
                // Single variant
                variants = variantsStr ? [variantsStr] : [];
              }
            } else if (Array.isArray(row.variants)) {
              variants = row.variants;
            }
          } catch (parseError) {
            errors.push(`Satır ${i + 2}: Variants parse edilemedi`);
            errorCount++;
            continue;
          }

          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          const isValidUUID = row.id && uuidRegex.test(row.id);

          if (isValidUUID) {
            // UPDATE existing row
            const updateData: any = {
              canonical_question: row.canonical_question,
              variants: variants,
            };

            if (row.canonical_answer) updateData.canonical_answer = row.canonical_answer;
            if (row.source_document) updateData.source_document = row.source_document;

            const { error: updateError } = await supabase
              .from("question_variants")
              .update(updateData)
              .eq("id", row.id);

            if (updateError) {
              errors.push(`Satır ${i + 2}: Update hatası - ${updateError.message}`);
              errorCount++;
            } else {
              updateCount++;
            }
          } else {
            // INSERT new row
            const { error: insertError } = await supabase
              .from("question_variants")
              .insert({
                canonical_question: row.canonical_question,
                canonical_answer: row.canonical_answer || "",
                variants: variants,
                source_document: row.source_document || null,
                embedding: null as any,
              });

            if (insertError) {
              errors.push(`Satır ${i + 2}: Insert hatası - ${insertError.message}`);
              errorCount++;
            } else {
              insertCount++;
            }
          }

          if ((i + 1) % 10 === 0) {
            toast({
              title: "İşleniyor...",
              description: `${i + 1} / ${rows.length} satır işlendi`,
            });
          }

        } catch (rowError: any) {
          errors.push(`Satır ${i + 2}: ${rowError.message}`);
          errorCount++;
        }
      }

      if (errors.length > 0) {
        console.error("Import errors:", errors.slice(0, 10));
      }

      toast({
        title: "İçe Aktarma Tamamlandı",
        description: `✅ ${insertCount} eklendi, 🔄 ${updateCount} güncellendi, ❌ ${errorCount} hata`,
        variant: errorCount > 0 ? "destructive" : "default",
      });

      await fetchVariants();
      
    } catch (error: any) {
      console.error("Import error:", error);
      toast({
        title: "Hata",
        description: `Dosya işlenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setImportProgress({ current: 0, total: 0 });
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Soru veya cevap ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="outline">
          {filteredVariants.length} / {variants.length} soru
        </Badge>
        <Button
          variant="outline"
          onClick={exportToCSV}
          disabled={variants.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          CSV İndir
        </Button>
        <Button
          variant="outline"
          disabled={isImporting}
          onClick={() => document.getElementById('csv-upload')?.click()}
        >
          {isImporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {importProgress.current} / {importProgress.total}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Excel/CSV Yükle
            </>
          )}
        </Button>
        <input
          id="csv-upload"
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={handleFileImport}
        />
        <Button
          variant="outline"
          onClick={() => {
            if (variants.length > 50) {
              setShowBatchConfirm(true);
            } else {
              regenerateAllEmbeddings();
            }
          }}
          disabled={isBatchRegenerating || variants.length === 0}
        >
          {isBatchRegenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {batchProgress.current} / {batchProgress.total}
            </>
          ) : (
            <>
              <GitMerge className="h-4 w-4 mr-2" />
              Tüm Embeddingleri Yenile
            </>
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filteredVariants.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchQuery ? "Sonuç bulunamadı" : "Henüz soru varyantı yok"}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredVariants.map((variant) => (
            <Collapsible key={variant.id} className="border rounded-lg">
              <div className="flex items-start gap-2 p-4">
                <CollapsibleTrigger className="flex-1 text-left">
                  <div className="flex items-start gap-2">
                    <ChevronDown className="h-5 w-5 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">{variant.canonical_question}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {variant.variants.length} varyasyon
                        </Badge>
                        {variant.source_document && (
                          <Badge variant="outline" className="text-xs">
                            {variant.source_document}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingVariant(variant);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(variant.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <CollapsibleContent className="px-4 pb-4">
                <div className="space-y-3 pt-2 border-t">
                  <div>
                    <p className="text-sm font-medium mb-1">Cevap:</p>
                    <p className="text-sm text-muted-foreground">
                      {variant.canonical_answer.substring(0, 200)}
                      {variant.canonical_answer.length > 200 && "..."}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Varyasyonlar:</p>
                    <div className="flex flex-wrap gap-2">
                      {variant.variants.map((v, idx) => (
                        <Badge key={idx} variant="outline">
                          {v}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Soru Varyantını Düzenle</DialogTitle>
            <DialogDescription>
              Canonical soruyu, cevabı ve varyasyonları düzenleyebilirsiniz
            </DialogDescription>
          </DialogHeader>

          {editingVariant && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="canonical_question">Canonical Soru</Label>
                <Input
                  id="canonical_question"
                  value={editingVariant.canonical_question}
                  onChange={(e) =>
                    setEditingVariant({
                      ...editingVariant,
                      canonical_question: e.target.value,
                    })
                  }
                  placeholder="Ana soru formülasyonu"
                />
              </div>

              <div>
                <Label htmlFor="canonical_answer">Cevap</Label>
                <Textarea
                  id="canonical_answer"
                  value={editingVariant.canonical_answer}
                  onChange={(e) =>
                    setEditingVariant({
                      ...editingVariant,
                      canonical_answer: e.target.value,
                    })
                  }
                  placeholder="Sorunun cevabı"
                  rows={6}
                />
              </div>

              <div>
                <Label htmlFor="source">Kaynak Döküman (Opsiyonel)</Label>
                <Input
                  id="source"
                  value={editingVariant.source_document || ""}
                  onChange={(e) =>
                    setEditingVariant({
                      ...editingVariant,
                      source_document: e.target.value,
                    })
                  }
                  placeholder="Örn: HIT-30 Kılavuzu"
                />
              </div>

              <div>
                <Label>Varyasyonlar</Label>
                <div className="space-y-2">
                  {editingVariant.variants.map((variant, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={variant}
                        onChange={(e) => {
                          const newVariants = [...editingVariant.variants];
                          newVariants[idx] = e.target.value;
                          setEditingVariant({
                            ...editingVariant,
                            variants: newVariants,
                          });
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVariant(idx)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addVariant}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Varyasyon Ekle
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={regenerateEmbedding}
              disabled={isRegeneratingEmbedding}
            >
              {isRegeneratingEmbedding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Embedding Oluşturuluyor...
                </>
              ) : (
                <>
                  <GitMerge className="h-4 w-4 mr-2" />
                  Embedding Yenile
                </>
              )}
            </Button>
            <div className="flex-1" />
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu soru grubunu ve tüm varyasyonlarını silmek üzeresiniz. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Regeneration Confirmation */}
      <AlertDialog open={showBatchConfirm} onOpenChange={setShowBatchConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Toplu Güncelleme Onayı</AlertDialogTitle>
            <AlertDialogDescription>
              {variants.length} adet varyant için embedding oluşturulacak.
              Bu işlem yaklaşık {Math.ceil(variants.length / 60)} dakika sürebilir.
              Devam etmek istiyor musunuz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={regenerateAllEmbeddings}>
              Devam Et
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
