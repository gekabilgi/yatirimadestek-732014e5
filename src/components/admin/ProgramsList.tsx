
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Eye, Plus, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { SupportProgram } from '@/types/support';
import { deleteFileFromStorage } from '@/utils/fileUpload';

interface ProgramsListProps {
  onEdit: (program: SupportProgram) => void;
  onCreateNew: () => void;
  onClone: (program: SupportProgram) => void;
}

export const ProgramsList = ({ onEdit, onCreateNew, onClone }: ProgramsListProps) => {
  const [programs, setPrograms] = useState<SupportProgram[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('support_programs')
        .select(`
          *,
          institution:institutions(id, name, created_at),
          support_program_tags(
            tag:tags(id, name, category_id, created_at)
          ),
          files:file_attachments(*)
        `)
        .order('created_at', { ascending: false });

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

  const handleDelete = async (programId: string, programTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${programTitle}"?`)) {
      return;
    }

    try {
      // Get files to delete from storage
      const { data: files } = await supabase
        .from('file_attachments')
        .select('file_url')
        .eq('support_program_id', programId);

      // Delete files from storage
      if (files && files.length > 0) {
        for (const file of files) {
          await deleteFileFromStorage(file.file_url);
        }
      }

      // Delete support program tags first
      const { error: tagsError } = await supabase
        .from('support_program_tags')
        .delete()
        .eq('support_program_id', programId);

      if (tagsError) throw tagsError;

      // Delete file attachments
      const { error: filesError } = await supabase
        .from('file_attachments')
        .delete()
        .eq('support_program_id', programId);

      if (filesError) throw filesError;

      // Delete the program
      const { error: programError } = await supabase
        .from('support_programs')
        .delete()
        .eq('id', programId);

      if (programError) throw programError;

      toast.success('Program deleted successfully');
      fetchPrograms(); // Refresh the list
    } catch (error) {
      console.error('Error deleting program:', error);
      toast.error('Failed to delete program');
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

  if (loading) {
    return (
      <Card className="space-y-6 mt-16">
        <CardHeader>
          <CardTitle>Destek Programları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading programs...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Destek Programları ({programs.length})</CardTitle>
          <Button onClick={onCreateNew} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Yeni Destek Ekle
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {programs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Destek programı bulunamadı.</p>
            <Button onClick={onCreateNew} variant="outline" className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
             Destek Programını Oluştur
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
                          <div className={`w-3 h-3 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className={`text-sm ${isOpen ? 'text-green-600' : 'text-red-600'}`}>
                            {isOpen ? 'Açık' : 'Kapalı'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {program.application_deadline 
                          ? formatDate(program.application_deadline)
                          : 'No deadline'
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
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(program.id, program.title)}
                            className="text-red-600 hover:text-red-700"
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
