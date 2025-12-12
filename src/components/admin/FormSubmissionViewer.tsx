import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Trash2, 
  Eye, 
  Check, 
  Archive, 
  RefreshCw,
  Mail,
  Calendar,
  FileText,
  Inbox
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  fetchFormTemplate,
  fetchFormFields,
  fetchFormSubmissions,
  updateSubmissionStatus,
  deleteFormSubmission,
  deleteFormSubmissions,
} from '@/services/formBuilderService';
import type { FormTemplate, FormField, FormSubmission } from '@/types/formBuilder';

const STATUS_CONFIG = {
  new: { label: 'Yeni', variant: 'destructive' as const },
  viewed: { label: 'Görüntülendi', variant: 'secondary' as const },
  processed: { label: 'İşlendi', variant: 'default' as const },
  archived: { label: 'Arşivlendi', variant: 'outline' as const },
};

const FormSubmissionViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormTemplate | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [formData, fieldsData, submissionsData] = await Promise.all([
        fetchFormTemplate(id!),
        fetchFormFields(id!),
        fetchFormSubmissions(id!),
      ]);
      setForm(formData);
      setFields(fieldsData);
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleViewSubmission = async (submission: FormSubmission) => {
    setSelectedSubmission(submission);
    if (submission.status === 'new') {
      try {
        await updateSubmissionStatus(submission.id, 'viewed');
        setSubmissions(submissions.map(s => 
          s.id === submission.id ? { ...s, status: 'viewed' } : s
        ));
      } catch (error) {
        console.error('Error updating status:', error);
      }
    }
  };

  const handleStatusChange = async (submissionId: string, status: FormSubmission['status']) => {
    try {
      await updateSubmissionStatus(submissionId, status);
      setSubmissions(submissions.map(s => 
        s.id === submissionId ? { ...s, status } : s
      ));
      toast.success('Durum güncellendi');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Durum güncellenirken hata oluştu');
    }
  };

  const handleDelete = async () => {
    if (deleteIds.length === 0) return;

    try {
      await deleteFormSubmissions(deleteIds);
      setSubmissions(submissions.filter(s => !deleteIds.includes(s.id)));
      setSelectedIds(selectedIds.filter(id => !deleteIds.includes(id)));
      setDeleteIds([]);
      toast.success(`${deleteIds.length} yanıt silindi`);
    } catch (error) {
      console.error('Error deleting submissions:', error);
      toast.error('Yanıtlar silinirken hata oluştu');
    }
  };

  const handleExportCSV = () => {
    if (submissions.length === 0) {
      toast.error('Dışa aktarılacak yanıt yok');
      return;
    }

    // Get all unique field names
    const fieldNames = fields.filter(f => !['heading', 'paragraph', 'divider'].includes(f.field_type));
    
    // Create CSV header
    const headers = ['Tarih', 'E-posta', 'Durum', ...fieldNames.map(f => f.label)];
    
    // Create CSV rows
    const rows = submissions.map(s => {
      const row = [
        new Date(s.created_at).toLocaleString('tr-TR'),
        s.submitter_email || '-',
        STATUS_CONFIG[s.status].label,
        ...fieldNames.map(f => {
          const value = s.data[f.name];
          if (Array.isArray(value)) return value.join(', ');
          return value || '-';
        }),
      ];
      return row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${form?.name || 'form'}_yanitlar_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success('CSV dosyası indirildi');
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === submissions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(submissions.map(s => s.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
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
            <h2 className="text-2xl font-bold text-foreground">{form.name} - Yanıtlar</h2>
            <p className="text-muted-foreground">{submissions.length} toplam yanıt</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Yenile
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            CSV İndir
          </Button>
          {selectedIds.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={() => setDeleteIds(selectedIds)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Sil ({selectedIds.length})
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const count = submissions.filter(s => s.status === status).length;
          return (
            <Card key={status}>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-muted-foreground text-sm">{config.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Submissions Table */}
      {submissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Henüz yanıt yok</h3>
            <p className="text-muted-foreground">Bu form için gönderilmiş yanıt bulunmuyor</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedIds.length === submissions.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead>E-posta</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedIds.includes(submission.id)}
                      onCheckedChange={() => toggleSelect(submission.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {new Date(submission.created_at).toLocaleString('tr-TR')}
                    </div>
                  </TableCell>
                  <TableCell>
                    {submission.submitter_email ? (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {submission.submitter_email}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_CONFIG[submission.status].variant}>
                      {STATUS_CONFIG[submission.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewSubmission(submission)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Görüntüle
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Durum
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleStatusChange(submission.id, 'new')}>
                            Yeni
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(submission.id, 'viewed')}>
                            Görüntülendi
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(submission.id, 'processed')}>
                            <Check className="h-4 w-4 mr-2" />
                            İşlendi
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(submission.id, 'archived')}>
                            <Archive className="h-4 w-4 mr-2" />
                            Arşivle
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setDeleteIds([submission.id])}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* View Submission Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Form Yanıtı
            </DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(selectedSubmission.created_at).toLocaleString('tr-TR')}
                </div>
                {selectedSubmission.submitter_email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {selectedSubmission.submitter_email}
                  </div>
                )}
                <Badge variant={STATUS_CONFIG[selectedSubmission.status].variant}>
                  {STATUS_CONFIG[selectedSubmission.status].label}
                </Badge>
              </div>

              <div className="border rounded-lg divide-y">
                {fields
                  .filter(f => !['heading', 'paragraph', 'divider'].includes(f.field_type))
                  .map((field) => {
                    const value = selectedSubmission.data[field.name];
                    let displayValue = value;
                    
                    if (Array.isArray(value)) {
                      displayValue = value.join(', ');
                    } else if (value === undefined || value === null || value === '') {
                      displayValue = '-';
                    }

                    return (
                      <div key={field.id} className="p-4">
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          {field.label}
                        </div>
                        <div className="text-foreground whitespace-pre-wrap">
                          {displayValue}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteIds.length > 0} onOpenChange={() => setDeleteIds([])}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Yanıtları Sil</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteIds.length} yanıtı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FormSubmissionViewer;
