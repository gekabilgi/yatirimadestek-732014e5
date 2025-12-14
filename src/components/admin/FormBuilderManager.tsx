import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff, 
  FileText, 
  ExternalLink,
  MoreVertical,
  Inbox,
  LayoutTemplate
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  fetchFormTemplates, 
  createFormTemplate, 
  createFormFromTemplate,
  deleteFormTemplate, 
  duplicateFormTemplate,
  updateFormTemplate,
  getFormStats
} from '@/services/formBuilderService';
import FormTemplateGallery from './FormTemplateGallery';
import type { FormTemplate } from '@/types/formBuilder';
import type { FormTemplatePreset } from '@/data/formTemplatePresets';

const FormBuilderManager: React.FC = () => {
  const navigate = useNavigate();
  const [forms, setForms] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteFormId, setDeleteFormId] = useState<string | null>(null);
  const [newFormName, setNewFormName] = useState('');
  const [newFormDescription, setNewFormDescription] = useState('');
  const [formStats, setFormStats] = useState<Record<string, { total: number; new: number }>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplatePreset | null>(null);
  const [createTab, setCreateTab] = useState<'blank' | 'template'>('blank');

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      setLoading(true);
      const data = await fetchFormTemplates();
      setForms(data);

      // Load stats for each form
      const stats: Record<string, { total: number; new: number }> = {};
      for (const form of data) {
        try {
          const formStat = await getFormStats(form.id);
          stats[form.id] = { total: formStat.total, new: formStat.new };
        } catch {
          stats[form.id] = { total: 0, new: 0 };
        }
      }
      setFormStats(stats);
    } catch (error) {
      console.error('Error loading forms:', error);
      toast.error('Formlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForm = async () => {
    const formName = createTab === 'template' && selectedTemplate 
      ? (newFormName.trim() || selectedTemplate.name)
      : newFormName.trim();
      
    if (!formName) {
      toast.error('Form adı gereklidir');
      return;
    }

    try {
      let newForm;
      if (createTab === 'template' && selectedTemplate) {
        newForm = await createFormFromTemplate(selectedTemplate, formName);
        toast.success('Form şablondan oluşturuldu');
      } else {
        newForm = await createFormTemplate(formName, newFormDescription);
        toast.success('Form oluşturuldu');
      }
      setIsCreateDialogOpen(false);
      setNewFormName('');
      setNewFormDescription('');
      setSelectedTemplate(null);
      setCreateTab('blank');
      navigate(`/admin/form-builder/${newForm.id}`);
    } catch (error) {
      console.error('Error creating form:', error);
      toast.error('Form oluşturulurken hata oluştu');
    }
  };

  const handleDeleteForm = async () => {
    if (!deleteFormId) return;

    try {
      await deleteFormTemplate(deleteFormId);
      toast.success('Form silindi');
      setDeleteFormId(null);
      loadForms();
    } catch (error) {
      console.error('Error deleting form:', error);
      toast.error('Form silinirken hata oluştu');
    }
  };

  const handleDuplicateForm = async (id: string) => {
    try {
      const newForm = await duplicateFormTemplate(id);
      toast.success('Form kopyalandı');
      navigate(`/admin/form-builder/${newForm.id}`);
    } catch (error) {
      console.error('Error duplicating form:', error);
      toast.error('Form kopyalanırken hata oluştu');
    }
  };

  const handleToggleActive = async (form: FormTemplate) => {
    try {
      await updateFormTemplate(form.id, { is_active: !form.is_active });
      toast.success(form.is_active ? 'Form pasif yapıldı' : 'Form aktif yapıldı');
      loadForms();
    } catch (error) {
      console.error('Error toggling form:', error);
      toast.error('Form güncellenirken hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Form Builder</h2>
          <p className="text-muted-foreground">Özel formlar oluşturun ve yönetin</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Form
        </Button>
      </div>

      {forms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Henüz form yok</h3>
            <p className="text-muted-foreground mb-4">İlk formunuzu oluşturmaya başlayın</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Form Oluştur
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <Card key={form.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{form.name}</CardTitle>
                    {form.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {form.description}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/admin/form-builder/${form.id}`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Düzenle
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/admin/form-builder/${form.id}/submissions`)}>
                        <FileText className="h-4 w-4 mr-2" />
                        Yanıtlar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicateForm(form.id)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Kopyala
                      </DropdownMenuItem>
                      {form.is_active && (
                        <DropdownMenuItem onClick={() => window.open(`/form/${form.slug}`, '_blank')}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Önizle
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleToggleActive(form)}>
                        {form.is_active ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Pasif Yap
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Aktif Yap
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => setDeleteFormId(form.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={form.is_active ? 'default' : 'secondary'}>
                    {form.is_active ? 'Aktif' : 'Pasif'}
                  </Badge>
                  <Badge variant="outline">
                    {form.is_public ? 'Herkese Açık' : 'Giriş Gerekli'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {formStats[form.id]?.total || 0} yanıt
                    {formStats[form.id]?.new > 0 && (
                      <Badge variant="destructive" className="ml-2 h-5">
                        {formStats[form.id].new} yeni
                      </Badge>
                    )}
                  </span>
                  <span>
                    {new Date(form.created_at).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Form Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Form Oluştur</DialogTitle>
          </DialogHeader>
          
          <Tabs value={createTab} onValueChange={(v) => setCreateTab(v as 'blank' | 'template')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="blank" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Boş Form
              </TabsTrigger>
              <TabsTrigger value="template" className="flex items-center gap-2">
                <LayoutTemplate className="h-4 w-4" />
                Şablondan Başla
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="blank" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="formName">Form Adı *</Label>
                <Input
                  id="formName"
                  value={newFormName}
                  onChange={(e) => setNewFormName(e.target.value)}
                  placeholder="örn: İletişim Formu"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="formDescription">Açıklama (Opsiyonel)</Label>
                <Textarea
                  id="formDescription"
                  value={newFormDescription}
                  onChange={(e) => setNewFormDescription(e.target.value)}
                  placeholder="Form hakkında kısa açıklama"
                  rows={3}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="template" className="py-4">
              <FormTemplateGallery 
                onSelectTemplate={setSelectedTemplate}
                selectedTemplateId={selectedTemplate?.id}
              />
              {selectedTemplate && (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="templateFormName">Form Adı (opsiyonel)</Label>
                  <Input
                    id="templateFormName"
                    value={newFormName}
                    onChange={(e) => setNewFormName(e.target.value)}
                    placeholder={selectedTemplate.name}
                  />
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              İptal
            </Button>
            <Button 
              onClick={handleCreateForm}
              disabled={createTab === 'template' && !selectedTemplate}
            >
              {createTab === 'template' ? 'Şablondan Oluştur' : 'Oluştur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteFormId} onOpenChange={() => setDeleteFormId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Formu Sil</AlertDialogTitle>
            <AlertDialogDescription>
              Bu formu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm form yanıtları da silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteForm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FormBuilderManager;
