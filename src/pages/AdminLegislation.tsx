import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, FileText, Upload, Calendar, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { uploadLegislationFiles } from '@/utils/fileUpload';

interface LegalDocument {
  id: string;
  title: string;
  description: string;
  document_type: string;
  ministry: string;
  file_url: string;
  external_url: string;
  publication_date: string;
  status: string;
  keywords: string;
  document_number: string;
}

interface DocumentFormData {
  title: string;
  description: string;
  document_type: string;
  ministry: string;
  external_url: string;
  publication_date: string;
  keywords: string;
  document_number: string;
}

const AdminLegislation = () => {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<LegalDocument | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<DocumentFormData>({
    title: '',
    description: '',
    document_type: '',
    ministry: '',
    external_url: '',
    publication_date: '',
    keywords: '',
    document_number: ''
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Hata",
        description: "Dökümanlar yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      document_type: '',
      ministry: '',
      external_url: '',
      publication_date: '',
      keywords: '',
      document_number: ''
    });
    setUploadedFiles([]);
    setEditingDocument(null);
  };

  const openEditDialog = (document: LegalDocument) => {
    setEditingDocument(document);
    setFormData({
      title: document.title,
      description: document.description,
      document_type: document.document_type,
      ministry: document.ministry || '',
      external_url: document.external_url || '',
      publication_date: document.publication_date?.split('T')[0] || '',
      keywords: document.keywords || '',
      document_number: document.document_number || ''
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setUploadedFiles(Array.from(files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.document_type) {
      toast({
        title: "Hata",
        description: "Başlık, açıklama ve döküman türü zorunludur.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      let fileUrl = formData.external_url;

      // Upload file if provided
      if (uploadedFiles.length > 0) {
        const uploadedFile = await uploadLegislationFiles(uploadedFiles);
        fileUrl = uploadedFile[0]?.file_url || fileUrl;
      }

      const documentData = {
        ...formData,
        file_url: fileUrl,
        status: 'active'
      };

      if (editingDocument) {
        // Update existing document
        const { error } = await supabase
          .from('legal_documents')
          .update(documentData)
          .eq('id', editingDocument.id);

        if (error) throw error;

        toast({
          title: "Başarılı",
          description: "Döküman güncellendi.",
        });
      } else {
        // Create new document
        const { error } = await supabase
          .from('legal_documents')
          .insert([documentData]);

        if (error) throw error;

        toast({
          title: "Başarılı",
          description: "Yeni döküman eklendi.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchDocuments();
    } catch (error) {
      console.error('Error saving document:', error);
      toast({
        title: "Hata",
        description: "Döküman kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu dökümanı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('legal_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: "Döküman silindi.",
      });
      
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Hata",
        description: "Döküman silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const { error } = await supabase
        .from('legal_documents')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: `Döküman ${newStatus === 'active' ? 'aktif' : 'pasif'} edildi.`,
      });
      
      fetchDocuments();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Hata",
        description: "Durum güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
  };

  return (
    <AdminLayout>
      <AdminPageHeader 
        title="Mevzuat Yönetimi"
        description="Mevzuat dökümanlarını yönetin"
      />

      <div className="space-y-6">
        {/* Add Document Button */}
        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Döküman Ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingDocument ? 'Döküman Düzenle' : 'Yeni Döküman Ekle'}
                </DialogTitle>
                <DialogDescription>
                  Mevzuat dökümanı bilgilerini girin.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Başlık *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Döküman başlığı"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="document_type">Döküman Türü *</Label>
                    <Select 
                      value={formData.document_type} 
                      onValueChange={(value) => setFormData({...formData, document_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Döküman türü seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Kanun">Kanun</SelectItem>
                        <SelectItem value="Yönetmelik">Yönetmelik</SelectItem>
                        <SelectItem value="Tebliğ">Tebliğ</SelectItem>
                        <SelectItem value="Genelge">Genelge</SelectItem>
                        <SelectItem value="Karar">Karar</SelectItem>
                        <SelectItem value="Diğer">Diğer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Açıklama *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Döküman açıklaması (2-3 satır)"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ministry">Bakanlık/Kurum</Label>
                    <Input
                      id="ministry"
                      value={formData.ministry}
                      onChange={(e) => setFormData({...formData, ministry: e.target.value})}
                      placeholder="İlgili bakanlık veya kurum"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="document_number">Döküman Numarası</Label>
                    <Input
                      id="document_number"
                      value={formData.document_number}
                      onChange={(e) => setFormData({...formData, document_number: e.target.value})}
                      placeholder="Resmi döküman numarası"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="publication_date">Yayın Tarihi</Label>
                    <Input
                      id="publication_date"
                      type="date"
                      value={formData.publication_date}
                      onChange={(e) => setFormData({...formData, publication_date: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="keywords">Anahtar Kelimeler</Label>
                    <Input
                      id="keywords"
                      value={formData.keywords}
                      onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                      placeholder="Virgülle ayrılmış anahtar kelimeler"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="external_url">Harici Link</Label>
                  <Input
                    id="external_url"
                    type="url"
                    value={formData.external_url}
                    onChange={(e) => setFormData({...formData, external_url: e.target.value})}
                    placeholder="https://example.com/document.pdf"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file_upload">Dosya Yükle</Label>
                  <Input
                    id="file_upload"
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.xlsx,.xls"
                    multiple={false}
                  />
                  <p className="text-sm text-muted-foreground">
                    PDF, DOCX, XLSX formatları desteklenir. Harici link varsa dosya yükleme opsiyoneldir.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Kaydediliyor...' : (editingDocument ? 'Güncelle' : 'Ekle')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Documents Table */}
        <Card>
          <CardHeader>
            <CardTitle>Mevzuat Dökümanları</CardTitle>
            <CardDescription>
              Tüm mevzuat dökümanlarını görüntüleyin ve yönetin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Başlık</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead>Bakanlık</TableHead>
                    <TableHead>Yayın Tarihi</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{doc.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {doc.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{doc.document_type}</Badge>
                      </TableCell>
                      <TableCell>{doc.ministry || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(doc.publication_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={doc.status === 'active' ? 'default' : 'secondary'}>
                          {doc.status === 'active' ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {(doc.file_url || doc.external_url) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(doc.file_url || doc.external_url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(doc)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleStatus(doc.id, doc.status)}
                          >
                            {doc.status === 'active' ? 'Pasif Et' : 'Aktif Et'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(doc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminLegislation;