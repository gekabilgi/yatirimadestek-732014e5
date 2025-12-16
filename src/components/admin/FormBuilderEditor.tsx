import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Settings, 
  Eye, 
  Plus,
  GripVertical,
  Trash2,
  Type,
  AlignLeft,
  Mail,
  Phone,
  Hash,
  Calendar,
  ChevronDown,
  Circle,
  CheckSquare,
  Upload,
  Heading,
  FileText,
  Minus,
  Palette,
  Image
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  fetchFormTemplate,
  fetchFormFields,
  updateFormTemplate,
  createFormField,
  updateFormField,
  deleteFormField,
  reorderFormFields,
} from '@/services/formBuilderService';
import type { FormTemplate, FormField, FieldType, DisplayMode, FormBranding, HeaderLayout, DEFAULT_BRANDING } from '@/types/formBuilder';
import FormFieldConfigurator from './FormFieldConfigurator';

const FIELD_ICONS: Record<FieldType, React.ComponentType<{ className?: string }>> = {
  text: Type,
  textarea: AlignLeft,
  email: Mail,
  phone: Phone,
  number: Hash,
  date: Calendar,
  select: ChevronDown,
  radio: Circle,
  checkbox: CheckSquare,
  file: Upload,
  heading: Heading,
  paragraph: FileText,
  divider: Minus,
};

const FIELD_LABELS: Record<FieldType, string> = {
  text: 'Metin',
  textarea: 'Uzun Metin',
  email: 'E-posta',
  phone: 'Telefon',
  number: 'Sayı',
  date: 'Tarih',
  select: 'Açılır Liste',
  radio: 'Tek Seçim',
  checkbox: 'Çoklu Seçim',
  file: 'Dosya',
  heading: 'Başlık',
  paragraph: 'Açıklama',
  divider: 'Ayırıcı',
};

const FormBuilderEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [form, setForm] = useState<FormTemplate | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Form settings state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitButtonText, setSubmitButtonText] = useState('');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('standalone');
  
  // Branding state
  const [branding, setBranding] = useState<FormBranding>({
    show_header: false,
    header_layout: 'centered',
  });

  useEffect(() => {
    if (id) {
      loadFormData();
    }
  }, [id]);

  const loadFormData = async () => {
    try {
      setLoading(true);
      const [formData, fieldsData] = await Promise.all([
        fetchFormTemplate(id!),
        fetchFormFields(id!),
      ]);

      if (formData) {
        setForm(formData);
        setFormName(formData.name);
        setFormDescription(formData.description || '');
        setSuccessMessage(formData.settings?.success_message || 'Form başarıyla gönderildi!');
        setSubmitButtonText(formData.settings?.submit_button_text || 'Gönder');
        setDisplayMode(formData.display_mode || 'standalone');
        setBranding(formData.branding || { show_header: false, header_layout: 'centered' });
      }
      setFields(fieldsData);
    } catch (error) {
      console.error('Error loading form:', error);
      toast.error('Form yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBranding = async (updates: Partial<FormBranding>) => {
    if (!form) return;
    const newBranding = { ...branding, ...updates };
    setBranding(newBranding);
    try {
      await updateFormTemplate(form.id, { branding: newBranding });
      setForm({ ...form, branding: newBranding });
      toast.success('Görünüm ayarları güncellendi');
    } catch (error) {
      toast.error('Görünüm ayarları güncellenirken hata oluştu');
    }
  };

  const handleSaveForm = async () => {
    if (!form) return;

    try {
      setSaving(true);
      await updateFormTemplate(form.id, {
        name: formName,
        description: formDescription || undefined,
        display_mode: displayMode,
        settings: {
          ...form.settings,
          success_message: successMessage,
          submit_button_text: submitButtonText,
        },
      });
      toast.success('Form kaydedildi');
      setIsSettingsOpen(false);
      loadFormData();
    } catch (error) {
      console.error('Error saving form:', error);
      toast.error('Form kaydedilirken hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleAddField = async (fieldType: FieldType) => {
    if (!form) return;

    try {
      const newField = await createFormField(form.id, {
        field_type: fieldType,
        label: FIELD_LABELS[fieldType],
        name: `field_${Date.now()}`,
        is_required: false,
        display_order: fields.length,
        options: [],
        validation_rules: {},
      });
      setFields([...fields, newField]);
      setIsAddFieldOpen(false);
      setSelectedField(newField);
      toast.success('Alan eklendi');
    } catch (error) {
      console.error('Error adding field:', error);
      toast.error('Alan eklenirken hata oluştu');
    }
  };

  const handleUpdateField = async (fieldId: string, updates: Partial<FormField>) => {
    try {
      await updateFormField(fieldId, updates);
      setFields(fields.map(f => f.id === fieldId ? { ...f, ...updates } : f));
      if (selectedField?.id === fieldId) {
        setSelectedField({ ...selectedField, ...updates });
      }
      toast.success('Alan güncellendi');
    } catch (error) {
      console.error('Error updating field:', error);
      toast.error('Alan güncellenirken hata oluştu');
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    try {
      await deleteFormField(fieldId);
      setFields(fields.filter(f => f.id !== fieldId));
      if (selectedField?.id === fieldId) {
        setSelectedField(null);
      }
      toast.success('Alan silindi');
    } catch (error) {
      console.error('Error deleting field:', error);
      toast.error('Alan silinirken hata oluştu');
    }
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newFields = [...fields];
    const [draggedItem] = newFields.splice(draggedIndex, 1);
    newFields.splice(dropIndex, 0, draggedItem);

    setFields(newFields);
    setDraggedIndex(null);
    setDragOverIndex(null);

    try {
      await reorderFormFields(form!.id, newFields.map(f => f.id));
    } catch (error) {
      console.error('Error reordering fields:', error);
      toast.error('Sıralama güncellenirken hata oluştu');
      loadFormData(); // Reload to restore original order
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Form bulunamadı</p>
        <Button variant="link" onClick={() => navigate('/admin/form-builder')}>
          Geri Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/form-builder')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{form.name}</h2>
            <p className="text-muted-foreground">{fields.length} alan</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {form.is_active && (
            <Button variant="outline" onClick={() => window.open(`/form/${form.slug}`, '_blank')}>
              <Eye className="h-4 w-4 mr-2" />
              Önizle
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Ayarlar
          </Button>
          <Button onClick={() => setIsAddFieldOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Alan Ekle
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fields List */}
        <div className="lg:col-span-2 space-y-2">
          {fields.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Plus className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Henüz alan yok</h3>
                <p className="text-muted-foreground mb-4">Formunuza alan ekleyerek başlayın</p>
                <Button onClick={() => setIsAddFieldOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Alan Ekle
                </Button>
              </CardContent>
            </Card>
          ) : (
            fields.map((field, index) => {
              const Icon = FIELD_ICONS[field.field_type];
              return (
                <Card
                  key={field.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`cursor-pointer transition-all ${
                    selectedField?.id === field.id ? 'ring-2 ring-primary' : ''
                  } ${draggedIndex === index ? 'opacity-50' : ''} ${
                    dragOverIndex === index ? 'border-primary border-2' : ''
                  }`}
                  onClick={() => setSelectedField(field)}
                >
                  <CardContent className="flex items-center gap-3 py-3">
                    <div className="cursor-grab hover:cursor-grabbing">
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{field.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {FIELD_LABELS[field.field_type]}
                        {field.is_required && <span className="text-destructive ml-1">*</span>}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteField(field.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Field Configuration Panel */}
        <div className="lg:col-span-1">
          {selectedField ? (
            <FormFieldConfigurator
              field={selectedField}
              onUpdate={(updates) => handleUpdateField(selectedField.id, updates)}
              onClose={() => setSelectedField(null)}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Settings className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  Ayarlarını düzenlemek için bir alan seçin
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Field Dialog */}
      <Dialog open={isAddFieldOpen} onOpenChange={setIsAddFieldOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Alan Ekle</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 py-4">
            {(Object.keys(FIELD_ICONS) as FieldType[]).map((type) => {
              const Icon = FIELD_ICONS[type];
              return (
                <button
                  key={type}
                  onClick={() => handleAddField(type)}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <Icon className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm font-medium">{FIELD_LABELS[type]}</span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Sheet */}
      <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <SheetContent className="flex flex-col sm:max-w-lg h-full p-0">
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <SheetTitle>Form Ayarları</SheetTitle>
          </SheetHeader>
          
          <Tabs defaultValue="general" className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2 mx-6 w-[calc(100%-3rem)] mt-4 shrink-0">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Genel
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Görünüm
              </TabsTrigger>
            </TabsList>
            
            <ScrollArea className="flex-1 h-0">
              {/* General Settings Tab */}
              <TabsContent value="general" className="mt-0 px-6">
                <div className="space-y-4 py-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="formName">Form Adı</Label>
                    <Input
                      id="formName"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="formDescription">Açıklama</Label>
                    <Textarea
                      id="formDescription"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-1.5">
                    <Label htmlFor="submitButtonText">Gönder Butonu Metni</Label>
                    <Input
                      id="submitButtonText"
                      value={submitButtonText}
                      onChange={(e) => setSubmitButtonText(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="successMessage">Başarı Mesajı</Label>
                    <Textarea
                      id="successMessage"
                      value={successMessage}
                      onChange={(e) => setSuccessMessage(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between py-1">
                    <div>
                      <Label>Form Durumu</Label>
                      <p className="text-xs text-muted-foreground">{form.is_active ? 'Aktif' : 'Pasif'}</p>
                    </div>
                    <Switch
                      checked={form.is_active}
                      onCheckedChange={async (checked) => {
                        try {
                          await updateFormTemplate(form.id, { is_active: checked });
                          setForm({ ...form, is_active: checked });
                          toast.success(checked ? 'Form aktif edildi' : 'Form pasif yapıldı');
                        } catch (error) {
                          toast.error('Durum güncellenirken hata oluştu');
                        }
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <div>
                      <Label>Herkese Açık</Label>
                      <p className="text-xs text-muted-foreground">Giriş yapmadan doldurulabilir</p>
                    </div>
                    <Switch
                      checked={form.is_public}
                      onCheckedChange={async (checked) => {
                        try {
                          await updateFormTemplate(form.id, { is_public: checked });
                          setForm({ ...form, is_public: checked });
                          toast.success('Ayar güncellendi');
                        } catch (error) {
                          toast.error('Ayar güncellenirken hata oluştu');
                        }
                      }}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Yayın Şekli</Label>
                    <RadioGroup 
                      value={displayMode} 
                      onValueChange={async (v) => {
                        const newMode = v as DisplayMode;
                        setDisplayMode(newMode);
                        try {
                          await updateFormTemplate(form.id, { display_mode: newMode });
                          setForm({ ...form, display_mode: newMode });
                          toast.success('Yayın şekli güncellendi');
                        } catch (error) {
                          toast.error('Yayın şekli güncellenirken hata oluştu');
                        }
                      }}
                      className="space-y-2"
                    >
                      <div className="flex items-start space-x-3 p-2.5 rounded-lg border hover:border-primary/50 transition-colors">
                        <RadioGroupItem value="standalone" id="standalone" className="mt-0.5" />
                        <div className="flex-1">
                          <Label htmlFor="standalone" className="font-medium cursor-pointer text-sm">Minimal</Label>
                          <p className="text-xs text-muted-foreground">Menü olmadan sadece form</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-2.5 rounded-lg border hover:border-primary/50 transition-colors">
                        <RadioGroupItem value="integrated" id="integrated" className="mt-0.5" />
                        <div className="flex-1">
                          <Label htmlFor="integrated" className="font-medium cursor-pointer text-sm">Entegre</Label>
                          <p className="text-xs text-muted-foreground">Site şablonu ile tam sayfa</p>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </TabsContent>

              {/* Appearance/Branding Tab */}
              <TabsContent value="appearance" className="mt-0 px-6">
                <div className="space-y-4 py-4">
                  {displayMode === 'standalone' ? (
                    <>
                      {/* Show Header Toggle */}
                      <div className="flex items-center justify-between py-1">
                        <div>
                          <Label>Özel Başlık Göster</Label>
                          <p className="text-xs text-muted-foreground">Formun üstünde özel başlık</p>
                        </div>
                        <Switch
                          checked={branding.show_header}
                          onCheckedChange={(checked) => handleUpdateBranding({ show_header: checked })}
                        />
                      </div>

                      {branding.show_header && (
                        <>
                          <Separator />

                          <div className="space-y-1.5">
                            <Label htmlFor="headerTitle">Başlık Metni</Label>
                            <Input
                              id="headerTitle"
                              value={branding.header_title || ''}
                              onChange={(e) => setBranding({ ...branding, header_title: e.target.value })}
                              onBlur={() => handleUpdateBranding({ header_title: branding.header_title })}
                              placeholder={formName}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="headerSubtitle">Alt Başlık</Label>
                            <Input
                              id="headerSubtitle"
                              value={branding.header_subtitle || ''}
                              onChange={(e) => setBranding({ ...branding, header_subtitle: e.target.value })}
                              onBlur={() => handleUpdateBranding({ header_subtitle: branding.header_subtitle })}
                              placeholder="Opsiyonel alt başlık"
                            />
                          </div>

                          <Separator />

                          <div className="space-y-1.5">
                            <Label>Başlık Düzeni</Label>
                            <Select
                              value={branding.header_layout || 'centered'}
                              onValueChange={(v) => handleUpdateBranding({ header_layout: v as HeaderLayout })}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="centered">Ortalanmış</SelectItem>
                                <SelectItem value="left-image">Görsel Solda</SelectItem>
                                <SelectItem value="right-image">Görsel Sağda</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <Separator />

                          <div className="space-y-1.5">
                            <Label htmlFor="accentColor">Vurgu Rengi</Label>
                            <div className="flex gap-2">
                              <Input
                                id="accentColor"
                                type="color"
                                value={branding.accent_color || '#14b8a6'}
                                onChange={(e) => handleUpdateBranding({ accent_color: e.target.value })}
                                className="w-12 h-9 p-1 cursor-pointer"
                              />
                              <Input
                                value={branding.accent_color || '#14b8a6'}
                                onChange={(e) => setBranding({ ...branding, accent_color: e.target.value })}
                                onBlur={() => handleUpdateBranding({ accent_color: branding.accent_color })}
                                placeholder="#14b8a6"
                                className="flex-1 h-9"
                              />
                            </div>
                            <div className="flex gap-1.5 mt-1.5">
                              {['#14b8a6', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'].map((color) => (
                                <button
                                  key={color}
                                  onClick={() => handleUpdateBranding({ accent_color: color })}
                                  className="w-6 h-6 rounded-full border-2 border-transparent hover:border-foreground/30 transition-colors"
                                  style={{ backgroundColor: color }}
                                  title={color}
                                />
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="bgColor">Arka Plan Rengi</Label>
                            <div className="flex gap-2">
                              <Input
                                id="bgColor"
                                type="color"
                                value={branding.background_color || '#f8fafc'}
                                onChange={(e) => handleUpdateBranding({ background_color: e.target.value })}
                                className="w-12 h-9 p-1 cursor-pointer"
                              />
                              <Input
                                value={branding.background_color || '#f8fafc'}
                                onChange={(e) => setBranding({ ...branding, background_color: e.target.value })}
                                onBlur={() => handleUpdateBranding({ background_color: branding.background_color })}
                                placeholder="#f8fafc"
                                className="flex-1 h-9"
                              />
                            </div>
                          </div>

                          <Separator />

                          <div className="space-y-1.5">
                            <Label htmlFor="logoUrl">Logo URL</Label>
                            <Input
                              id="logoUrl"
                              value={branding.logo_url || ''}
                              onChange={(e) => setBranding({ ...branding, logo_url: e.target.value })}
                              onBlur={() => handleUpdateBranding({ logo_url: branding.logo_url })}
                              placeholder="https://example.com/logo.png"
                              className="h-9"
                            />
                            {branding.logo_url && (
                              <div className="mt-1.5 p-2 bg-muted rounded-lg">
                                <img 
                                  src={branding.logo_url} 
                                  alt="Logo" 
                                  className="h-10 w-auto object-contain"
                                  onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                              </div>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="headerImageUrl">Başlık Görseli URL</Label>
                            <Input
                              id="headerImageUrl"
                              value={branding.header_image_url || ''}
                              onChange={(e) => setBranding({ ...branding, header_image_url: e.target.value })}
                              onBlur={() => handleUpdateBranding({ header_image_url: branding.header_image_url })}
                              placeholder="https://example.com/image.jpg"
                              className="h-9"
                            />
                            {branding.header_image_url && (
                              <div className="mt-1.5 p-2 bg-muted rounded-lg">
                                <img 
                                  src={branding.header_image_url} 
                                  alt="Header" 
                                  className="w-full max-h-24 object-cover rounded"
                                  onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <Image className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Görünüm ayarları sadece "Minimal" yayın şekli için geçerlidir.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
          
          <div className="border-t p-4 shrink-0">
            <Button onClick={handleSaveForm} disabled={saving} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default FormBuilderEditor;
