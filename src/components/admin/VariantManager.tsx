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
} from "lucide-react";

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

    try {
      const { error } = await supabase
        .from("question_variants")
        .update({
          canonical_question: editingVariant.canonical_question,
          canonical_answer: editingVariant.canonical_answer,
          variants: editingVariant.variants.filter((v) => v.trim()),
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

  const addVariant = (variantText: string) => {
    if (!editingVariant || !variantText.trim()) return;
    
    const newVariants = [...editingVariant.variants, variantText.trim()];
    setEditingVariant({
      ...editingVariant,
      variants: newVariants,
    });
  };

  const removeVariant = (index: number) => {
    if (!editingVariant) return;
    
    const newVariants = editingVariant.variants.filter((_, i) => i !== index);
    setEditingVariant({
      ...editingVariant,
      variants: newVariants,
    });
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
                    onClick={() => addVariant("")}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Varyasyon Ekle
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
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
    </div>
  );
}
