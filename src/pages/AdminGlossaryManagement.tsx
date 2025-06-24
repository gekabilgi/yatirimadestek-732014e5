
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  created_at: string;
  updated_at: string;
}

const AdminGlossaryManagement = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<GlossaryTerm | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({ term: '', definition: '' });
  const itemsPerPage = 10;

  const queryClient = useQueryClient();

  // Fetch glossary terms with search and pagination
  const { data: termsData, isLoading } = useQuery({
    queryKey: ['admin-glossary-terms', searchQuery, currentPage],
    queryFn: async () => {
      let query = supabase
        .from('glossary_terms')
        .select('*', { count: 'exact' });

      if (searchQuery) {
        query = query.or(`term.ilike.%${searchQuery}%,definition.ilike.%${searchQuery}%`);
      }

      query = query
        .order('term', { ascending: true })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      return { terms: data || [], total: count || 0 };
    },
  });

  // Create/Update mutation
  const createUpdateMutation = useMutation({
    mutationFn: async (data: { term: string; definition: string; id?: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from('glossary_terms')
          .update({ term: data.term, definition: data.definition, updated_at: new Date().toISOString() })
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('glossary_terms')
          .insert([{ term: data.term, definition: data.definition }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-glossary-terms'] });
      toast.success(editingTerm ? 'Terim güncellendi!' : 'Terim eklendi!');
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error('Hata: ' + error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('glossary_terms')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-glossary-terms'] });
      toast.success('Terim silindi!');
    },
    onError: (error) => {
      toast.error('Hata: ' + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.term.trim() || !formData.definition.trim()) {
      toast.error('Terim ve tanım alanları zorunludur!');
      return;
    }

    createUpdateMutation.mutate({
      ...formData,
      id: editingTerm?.id,
    });
  };

  const handleEdit = (term: GlossaryTerm) => {
    setEditingTerm(term);
    setFormData({ term: term.term, definition: term.definition });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTerm(null);
    setFormData({ term: '', definition: '' });
  };

  const handleDelete = (id: string) => {
    if (confirm('Bu terimi silmek istediğinizden emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  const totalPages = Math.ceil((termsData?.total || 0) / itemsPerPage);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Yatırımcı Sözlüğü Yönetimi</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Terim Ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingTerm ? 'Terim Düzenle' : 'Yeni Terim Ekle'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="term">Terim</Label>
                  <Input
                    id="term"
                    value={formData.term}
                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                    placeholder="Terim adını girin..."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="definition">Tanım</Label>
                  <textarea
                    id="definition"
                    value={formData.definition}
                    onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
                    placeholder="Terim tanımını girin..."
                    className="w-full min-h-32 p-3 border border-input rounded-md bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    İptal
                  </Button>
                  <Button type="submit" disabled={createUpdateMutation.isPending}>
                    {createUpdateMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Terim Listesi</CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Terim veya tanımda ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Yükleniyor...</div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Terim</TableHead>
                      <TableHead>Tanım</TableHead>
                      <TableHead className="w-24">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {termsData?.terms.map((term) => (
                      <TableRow key={term.id}>
                        <TableCell className="font-medium">{term.term}</TableCell>
                        <TableCell className="max-w-md truncate">{term.definition}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(term)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(term.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {totalPages > 1 && (
                  <div className="flex justify-center mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminGlossaryManagement;
