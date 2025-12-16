
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Trash2, Eye, Plus, Copy, Upload, ArrowUpDown, FileSpreadsheet, Loader2, Download, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { SupportProgram } from '@/types/support';
import { deleteFileFromStorage } from '@/utils/fileUpload';
import * as XLSX from 'xlsx';

interface ProgramsListProps {
  onEdit: (program: SupportProgram) => void;
  onCreateNew: () => void;
  onClone: (program: SupportProgram) => void;
}

type SortOrder = 'newest' | 'oldest' | 'title-asc' | 'title-desc';

export const ProgramsList = ({ onEdit, onCreateNew, onClone }: ProgramsListProps) => {
  const [programs, setPrograms] = useState<SupportProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPrograms();
  }, [sortOrder]);

  const fetchPrograms = async () => {
    try {
      let query = supabase
        .from('support_programs')
        .select(`
          *,
          institution:institutions(id, name, created_at),
          support_program_tags(
            tag:tags(id, name, category_id, created_at)
          ),
          files:file_attachments(*)
        `);

      // Apply sorting
      if (sortOrder === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortOrder === 'oldest') {
        query = query.order('created_at', { ascending: true });
      } else if (sortOrder === 'title-asc') {
        query = query.order('title', { ascending: true });
      } else if (sortOrder === 'title-desc') {
        query = query.order('title', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      const transformedPrograms: SupportProgram[] = (data || []).map(program => ({
        ...program,
        institution: program.institution || undefined,
        tags: program.support_program_tags?.map(spt => spt.tag).filter(Boolean) || [],
        files: (program.files || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      }));

      setPrograms(transformedPrograms);
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast.error('Failed to load programs');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Lütfen Excel (.xlsx, .xls) veya CSV dosyası yükleyin');
      return;
    }

    setImporting(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast.error('Dosya boş veya geçersiz format');
        return;
      }

      // Fetch institutions, categories, and tags for mapping
      const { data: institutions } = await supabase.from('institutions').select('id, name');
      const { data: categories } = await supabase.from('tag_categories').select('id, name');
      const { data: tags } = await supabase.from('tags').select('id, name, category_id');
      
      const institutionMap = new Map(institutions?.map(i => [i.name.toLowerCase().trim(), i.id]) || []);
      const tagMap = new Map(tags?.map(t => [t.name.toLowerCase().trim(), { id: t.id, category_id: t.category_id }]) || []);
      
      // Category name to ID mapping
      const categoryNameToId = new Map(categories?.map(c => [c.name.toLowerCase().trim(), c.id]) || []);

      let successCount = 0;
      let errorCount = 0;

      for (const row of jsonData as any[]) {
        try {
          // Map Excel columns to database fields
          const title = row['Program Adı'] || row['title'] || row['Başlık'];
          const description = row['Açıklama'] || row['description'] || row['Detay'] || '';
          const institutionName = row['Kurum'] || row['institution'] || row['Kurum Adı'];
          const deadline = row['Son Başvuru'] || row['deadline'] || row['application_deadline'];
          const eligibility = row['Uygunluk Kriterleri'] || row['eligibility_criteria'] || '';
          const contact = row['İletişim'] || row['contact_info'] || '';
          const createdAtRaw = row['Oluşturma Tarihi'] || row['created_at'] || '';

          // Tag columns (comma-separated values)
          const basvuruSahibiTuru = row['Başvuru Sahibi Türü'] || '';
          const destekTuru = row['Destek Türü'] || '';
          const destekUnsuru = row['Destek Unsuru'] || '';
          const sektor = row['Sektör'] || '';
          const il = row['İl'] || '';
          
          // File URLs (comma-separated)
          const fileUrls = row['Dosya URL\'leri'] || row['Dosya URLleri'] || '';

          if (!title) {
            errorCount++;
            continue;
          }

          // Find institution ID
          let institutionId = null;
          if (institutionName) {
            institutionId = institutionMap.get(institutionName.toLowerCase().trim()) || null;
          }

          // Helper function to parse Excel dates (handles both serial numbers and date strings)
          const parseExcelDate = (value: any): Date | null => {
            if (!value) return null;
            
            // If it's a number (Excel serial date)
            if (typeof value === 'number') {
              // Excel serial date: days since 1900-01-01 (with Excel's leap year bug)
              const excelEpoch = new Date(1899, 11, 30); // Dec 30, 1899
              const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
              return date;
            }
            
            // If it's a string, try to parse it
            if (typeof value === 'string') {
              // Try DD.MM.YYYY format first (common in Turkish Excel)
              const ddmmyyyy = value.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
              if (ddmmyyyy) {
                return new Date(parseInt(ddmmyyyy[3]), parseInt(ddmmyyyy[2]) - 1, parseInt(ddmmyyyy[1]));
              }
              
              // Try YYYY-MM-DD format
              const yyyymmdd = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
              if (yyyymmdd) {
                return new Date(parseInt(yyyymmdd[1]), parseInt(yyyymmdd[2]) - 1, parseInt(yyyymmdd[3]));
              }
              
              // Fallback to Date constructor
              const parsed = new Date(value);
              if (!isNaN(parsed.getTime())) {
                return parsed;
              }
            }
            
            return null;
          };

          // Parse deadline date
          let applicationDeadline = null;
          const deadlineParsed = parseExcelDate(deadline);
          if (deadlineParsed) {
            applicationDeadline = deadlineParsed.toISOString().split('T')[0];
          }

          // Parse created_at date
          let createdAt = null;
          const createdAtParsed = parseExcelDate(createdAtRaw);
          if (createdAtParsed) {
            createdAt = createdAtParsed.toISOString();
          }

          // Get current user
          const { data: { user } } = await supabase.auth.getUser();

          // Insert the program
          const { data: insertedProgram, error: programError } = await supabase
            .from('support_programs')
            .insert({
              title,
              description,
              institution_id: institutionId,
              application_deadline: applicationDeadline,
              eligibility_criteria: eligibility,
              contact_info: contact,
              created_by: user?.id || null,
              ...(createdAt && { created_at: createdAt })
            })
            .select('id')
            .single();

          if (programError || !insertedProgram) {
            console.error('Insert error:', programError);
            errorCount++;
            continue;
          }

          const programId = insertedProgram.id;

          // Parse and insert tags
          const allTagStrings = [
            basvuruSahibiTuru,
            destekTuru,
            destekUnsuru,
            sektor,
            il
          ].filter(Boolean);

          const tagIds: number[] = [];
          
          for (const tagString of allTagStrings) {
            const tagNames = tagString.split(',').map((t: string) => t.trim()).filter(Boolean);
            for (const tagName of tagNames) {
              const tagInfo = tagMap.get(tagName.toLowerCase().trim());
              if (tagInfo) {
                tagIds.push(tagInfo.id);
              }
            }
          }

          // Insert tag associations
          if (tagIds.length > 0) {
            const tagInserts = tagIds.map(tagId => ({
              support_program_id: programId,
              tag_id: tagId
            }));
            
            const { error: tagError } = await supabase
              .from('support_program_tags')
              .insert(tagInserts);
              
            if (tagError) {
              console.error('Tag insert error:', tagError);
            }
          }

          // Parse and insert file attachments
          if (fileUrls) {
            const urls = fileUrls.split(',').map((u: string) => u.trim()).filter(Boolean);
            if (urls.length > 0) {
              const fileInserts = urls.map((url: string, index: number) => ({
                support_program_id: programId,
                file_url: url,
                filename: url.split('/').pop() || `file_${index + 1}`,
                display_order: index + 1
              }));
              
              const { error: fileError } = await supabase
                .from('file_attachments')
                .insert(fileInserts);
                
              if (fileError) {
                console.error('File insert error:', fileError);
              }
            }
          }

          successCount++;
        } catch (err) {
          console.error('Row processing error:', err);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} program başarıyla içe aktarıldı (etiketler ve dosyalar dahil)`);
        fetchPrograms();
      }
      if (errorCount > 0) {
        toast.warning(`${errorCount} satır içe aktarılamadı`);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Dosya işlenirken hata oluştu');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (programId: string, programTitle: string) => {
    if (!confirm(`"${programTitle}" programını silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const { data: files } = await supabase
        .from('file_attachments')
        .select('file_url')
        .eq('support_program_id', programId);

      if (files && files.length > 0) {
        for (const file of files) {
          await deleteFileFromStorage(file.file_url);
        }
      }

      const { error: tagsError } = await supabase
        .from('support_program_tags')
        .delete()
        .eq('support_program_id', programId);

      if (tagsError) throw tagsError;

      const { error: filesError } = await supabase
        .from('file_attachments')
        .delete()
        .eq('support_program_id', programId);

      if (filesError) throw filesError;

      const { error: programError } = await supabase
        .from('support_programs')
        .delete()
        .eq('id', programId);

      if (programError) throw programError;

      toast.success('Program silindi');
      fetchPrograms();
    } catch (error) {
      console.error('Error deleting program:', error);
      toast.error('Program silinirken hata oluştu');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const isProgramOpen = (deadline?: string) => {
    if (!deadline) return true;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    return today <= deadlineDate;
  };

  const downloadTemplate = async () => {
    try {
      // Fetch all tag categories and tags
      const { data: categories } = await supabase
        .from('tag_categories')
        .select('id, name')
        .order('id');
      
      const { data: tags } = await supabase
        .from('tags')
        .select('id, name, category_id')
        .order('name');

      const { data: institutions } = await supabase
        .from('institutions')
        .select('name')
        .order('name');

      // Create program template with all columns
      const template = [
        {
          'Program Adı': 'Örnek Destek Programı',
          'Açıklama': 'Program açıklaması buraya yazılır',
          'Kurum': institutions?.[0]?.name || 'KOSGEB',
          'Son Başvuru': '2025-12-31',
          'Uygunluk Kriterleri': 'KOBİ niteliğinde olmak',
          'İletişim': 'info@example.com',
          'Oluşturma Tarihi': '2024-01-15',
          'Başvuru Sahibi Türü': 'KOBİ, Girişimci',
          'Destek Türü': 'Hibe, Kredi',
          'Destek Unsuru': 'Makine Teçhizat, Yazılım',
          'Sektör': 'İmalat, Teknoloji',
          'İl': 'İstanbul, Ankara',
          'Dosya URL\'leri': 'https://example.com/file1.pdf, https://example.com/file2.pdf',
          'Oluşturan': '(Otomatik doldurulur - giriş yapan admin)'
        }
      ];

      // Create programs sheet
      const wsPrograms = XLSX.utils.json_to_sheet(template);
      
      // Set column widths
      wsPrograms['!cols'] = [
        { wch: 30 }, { wch: 50 }, { wch: 20 }, { wch: 15 },
        { wch: 30 }, { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 25 },
        { wch: 30 }, { wch: 25 }, { wch: 30 }, { wch: 50 }, { wch: 30 }
      ];

      // Create tag reference sheet
      const tagRefData: { Kategori: string; 'Etiket Adı': string }[] = [];
      
      categories?.forEach(category => {
        const categoryTags = tags?.filter(t => t.category_id === category.id) || [];
        categoryTags.forEach(tag => {
          tagRefData.push({
            'Kategori': category.name,
            'Etiket Adı': tag.name
          });
        });
      });

      // Add institution list to reference
      const instRefData = institutions?.map(i => ({ 'Kurum Adı': i.name })) || [];

      const wsTagRef = XLSX.utils.json_to_sheet(tagRefData);
      wsTagRef['!cols'] = [{ wch: 25 }, { wch: 40 }];

      const wsInstRef = XLSX.utils.json_to_sheet(instRefData);
      wsInstRef['!cols'] = [{ wch: 40 }];

      // Create workbook with multiple sheets
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsPrograms, 'Programlar');
      XLSX.utils.book_append_sheet(wb, wsTagRef, 'Etiket Listesi');
      XLSX.utils.book_append_sheet(wb, wsInstRef, 'Kurum Listesi');
      
      XLSX.writeFile(wb, 'destek_programlari_sablon.xlsx');
      toast.success('Şablon indirildi (3 sayfa: Programlar, Etiketler, Kurumlar)');
    } catch (error) {
      console.error('Template download error:', error);
      toast.error('Şablon oluşturulurken hata oluştu');
    }
  };

  // Export current data to Excel
  const exportToExcel = async () => {
    setExporting(true);
    try {
      // Fetch all data with relations
      const { data: categories } = await supabase
        .from('tag_categories')
        .select('id, name')
        .order('id');
      
      const { data: allTags } = await supabase
        .from('tags')
        .select('id, name, category_id')
        .order('name');

      const { data: institutions } = await supabase
        .from('institutions')
        .select('id, name')
        .order('name');

      // Build category ID to name map
      const categoryMap = new Map(categories?.map(c => [c.id, c.name]) || []);

      // Build programs export data
      const programsData = programs.map(program => {
        // Group tags by category
        const tagsByCategory: Record<string, string[]> = {};
        program.tags.forEach(tag => {
          const categoryName = categoryMap.get(tag.category_id) || 'Diğer';
          if (!tagsByCategory[categoryName]) {
            tagsByCategory[categoryName] = [];
          }
          tagsByCategory[categoryName].push(tag.name);
        });

        return {
          'Program Adı': program.title,
          'Açıklama': program.description,
          'Kurum': program.institution?.name || '',
          'Son Başvuru': program.application_deadline || '',
          'Uygunluk Kriterleri': program.eligibility_criteria || '',
          'İletişim': program.contact_info || '',
          'Başvuru Sahibi Türü': (tagsByCategory['Başvuru Sahibi Türü'] || []).join(', '),
          'Destek Türü': (tagsByCategory['Destek Türü'] || []).join(', '),
          'Destek Unsuru': (tagsByCategory['Destek Unsuru'] || []).join(', '),
          'Sektör': (tagsByCategory['Sektör'] || []).join(', '),
          'İl': (tagsByCategory['İl'] || []).join(', '),
          'Dosya URL\'leri': program.files.map(f => f.file_url).join(', '),
          'Oluşturan': (program as any).creator?.full_name || (program as any).creator?.email || ''
        };
      });

      // Build tags export data
      const tagsData: { Kategori: string; 'Etiket Adı': string; 'Etiket ID': number }[] = [];
      categories?.forEach(category => {
        const categoryTags = allTags?.filter(t => t.category_id === category.id) || [];
        categoryTags.forEach(tag => {
          tagsData.push({
            'Kategori': category.name,
            'Etiket Adı': tag.name,
            'Etiket ID': tag.id
          });
        });
      });

      // Build institutions export data
      const institutionsData = institutions?.map(i => ({ 
        'Kurum Adı': i.name, 
        'Kurum ID': i.id 
      })) || [];

      // Create workbook
      const wsPrograms = XLSX.utils.json_to_sheet(programsData);
      wsPrograms['!cols'] = [
        { wch: 40 }, { wch: 60 }, { wch: 25 }, { wch: 15 },
        { wch: 40 }, { wch: 30 }, { wch: 35 }, { wch: 25 },
        { wch: 35 }, { wch: 30 }, { wch: 40 }, { wch: 60 }, { wch: 30 }
      ];

      const wsTags = XLSX.utils.json_to_sheet(tagsData);
      wsTags['!cols'] = [{ wch: 25 }, { wch: 40 }, { wch: 12 }];

      const wsInst = XLSX.utils.json_to_sheet(institutionsData);
      wsInst['!cols'] = [{ wch: 50 }, { wch: 12 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsPrograms, 'Programlar');
      XLSX.utils.book_append_sheet(wb, wsTags, 'Etiketler');
      XLSX.utils.book_append_sheet(wb, wsInst, 'Kurumlar');

      const timestamp = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `destek_programlari_export_${timestamp}.xlsx`);
      
      toast.success(`${programs.length} program, ${tagsData.length} etiket, ${institutionsData.length} kurum dışa aktarıldı`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Dışa aktarma hatası');
    } finally {
      setExporting(false);
    }
  };

  // Delete all programs (keeps tags and institutions)
  const handleDeleteAllPrograms = async () => {
    setDeleting(true);
    try {
      // Delete in order: tags → files → programs
      const { error: tagsError } = await supabase
        .from('support_program_tags')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (tagsError) throw tagsError;

      const { error: filesError } = await supabase
        .from('file_attachments')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (filesError) throw filesError;

      const { error: programsError } = await supabase
        .from('support_programs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (programsError) throw programsError;

      toast.success('Tüm programlar silindi. Etiketler ve kurumlar korundu.');
      fetchPrograms();
    } catch (error) {
      console.error('Delete all error:', error);
      toast.error('Silme işlemi sırasında hata oluştu');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Card className="space-y-6 mt-16">
        <CardHeader>
          <CardTitle>Destek Programları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Yükleniyor...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Destek Programları ({programs.length})</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {/* Sort Select */}
            <Select value={sortOrder} onValueChange={(value: SortOrder) => setSortOrder(value)}>
              <SelectTrigger className="w-[160px]">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sırala" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">En Yeni</SelectItem>
                <SelectItem value="oldest">En Eski</SelectItem>
                <SelectItem value="title-asc">A-Z</SelectItem>
                <SelectItem value="title-desc">Z-A</SelectItem>
              </SelectContent>
            </Select>

            {/* Bulk Import */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Şablon
            </Button>
            <Button
              variant="outline"
              onClick={exportToExcel}
              disabled={exporting || programs.length === 0}
              className="gap-2"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Dışa Aktar
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="gap-2"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              İçe Aktar
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  disabled={programs.length === 0 || deleting}
                  className="gap-2 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Tümünü Sil
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    Tüm Programları Sil
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    <strong>{programs.length} program</strong> silinecek. Bu işlem geri alınamaz!
                    <br /><br />
                    <span className="text-muted-foreground">
                      Not: Etiketler ve kurumlar silinmeyecek, sadece programlar ve ilişkili dosyalar temizlenecek.
                    </span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>İptal</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteAllPrograms}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Evet, Tümünü Sil
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

          </div>
        </div>
      </CardHeader>
      <CardContent>
        {programs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Destek programı bulunamadı.</p>
            <Button onClick={onCreateNew} variant="outline" className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Destek Programı Oluştur
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Program Adı</TableHead>
                  <TableHead>Kurum</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Son Başvuru</TableHead>
                  <TableHead>Oluşturma Tarihi</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs.map((program) => {
                  const isOpen = isProgramOpen(program.application_deadline);
                  return (
                    <TableRow key={program.id}>
                      <TableCell className="font-medium max-w-xs">
                        <div className="truncate" title={program.title}>
                          {program.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        {program.institution?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${isOpen ? 'bg-green-500' : 'bg-primary/60'}`}></div>
                          <span className={`text-sm ${isOpen ? 'text-green-600' : 'text-primary/80'}`}>
                            {isOpen ? 'Açık' : 'Kapalı'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {program.application_deadline 
                          ? formatDate(program.application_deadline)
                          : 'Süresiz'
                        }
                      </TableCell>
                      <TableCell>{formatDate(program.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/program/${program.id}`, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(program)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onClone(program)}
                            className="text-primary hover:text-primary/80"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(program.id, program.title)}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
