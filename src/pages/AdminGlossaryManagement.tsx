import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Search, BookOpen } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { BookOpen } from 'lucide-react';

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
  const { data: termsData, isLoading, error } = useQuery({
    queryKey: ['admin-glossary-terms', searchQuery, currentPage],
    queryFn: async () => {
      console.log('Fetching glossary terms...', { searchQuery, currentPage });
      
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
      console.log('Query result:', { data, error, count });
      
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

  // Generate pagination range with ellipsis
  const generatePaginationRange = () => {
    const range = [];
    const showEllipsis = totalPages > 7;
    
    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        range.push(i);
      }
    } else {
      range.push(1);
      
      if (currentPage > 4) {
        range.push('ellipsis-start');
      }
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (!range.includes(i)) {
          range.push(i);
        }
      }
      
      if (currentPage < totalPages - 3) {
        range.push('ellipsis-end');
      }
      
      if (!range.includes(totalPages)) {
        range.push(totalPages);
      }
    }
    
    return range;
  };

  // Debug logging
  console.log('Component render:', { 
    termsData, 
    isLoading, 
    error, 
    searchQuery, 
    currentPage 
  });

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Yatırımcı Sözlüğü Yönetimi"
        description="Yatırım terimleri ve tanımlarını yönetin"
        icon={BookOpen}
      >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Terim Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <span>{editingTerm ? 'Terim Düzenle' : 'Yeni Terim Ekle'}</span>
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="term" className="text-sm font-medium">Terim</Label>
                <Input
                  id="term"
                  value={formData.term}
                  onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                  placeholder="Terim adını girin..."
                  className="h-10"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="definition" className="text-sm font-medium">Tanım</Label>
                <textarea
                  id="definition"
                  value={formData.definition}
                  onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
                  placeholder="Terim tanımını girin..."
                  className="w-full min-h-32 p-3 border border-input rounded-md bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                  required
                />
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  İptal
                </Button>
                <Button type="submit" disabled={createUpdateMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                  {createUpdateMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </AdminPageHeader>
      
      <div className="p-6 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Terim</p>
                  <p className="text-2xl font-bold text-gray-900">{termsData?.total || 0}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Bu Sayfada</p>
                  <p className="text-2xl font-bold text-gray-900">{termsData?.terms.length || 0}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Search className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sayfa</p>
                  <p className="text-2xl font-bold text-gray-900">{currentPage} / {totalPages}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <span className="text-purple-600 font-bold text-lg">#</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Table */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-lg font-semibold">Terim Listesi</CardTitle>
              <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-2">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Terim veya tanımda ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Yükleniyor...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600">Hata: {error.message}</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold text-gray-900">Terim</TableHead>
                        <TableHead className="font-semibold text-gray-900">Tanım</TableHead>
                        <TableHead className="w-24 font-semibold text-gray-900">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {termsData?.terms && termsData.terms.length > 0 ? (
                        termsData.terms.map((term, index) => (
                          <TableRow key={term.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <TableCell className="font-medium text-gray-900 max-w-xs">
                              <div className="truncate" title={term.term}>{term.term}</div>
                            </TableCell>
                            <TableCell className="text-gray-600 max-w-md">
                              <div className="truncate" title={term.definition}>{term.definition}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(term)}
                                  className="h-8 w-8 p-0 hover:bg-blue-100"
                                >
                                  <Edit className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(term.id)}
                                  className="h-8 w-8 p-0 hover:bg-red-100"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-12">
                            <p className="text-gray-600">Hiç terim bulunamadı.</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center py-6 border-t bg-gray-50">
                    <div className="flex flex-wrap items-center justify-center gap-1 max-w-full">
                      <Pagination>
                        <PaginationContent className="flex-wrap">
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              className={`${currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-blue-50'} text-sm`}
                            />
                          </PaginationItem>
                          
                          {generatePaginationRange().map((page, index) => (
                            <PaginationItem key={index}>
                              {page === 'ellipsis-start' || page === 'ellipsis-end' ? (
                                <PaginationEllipsis />
                              ) : (
                                <PaginationLink
                                  onClick={() => setCurrentPage(page as number)}
                                  isActive={currentPage === page}
                                  className={`cursor-pointer text-sm min-w-[36px] ${
                                    currentPage === page 
                                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                      : 'hover:bg-blue-50'
                                  }`}
                                >
                                  {page}
                                </PaginationLink>
                              )}
                            </PaginationItem>
                          ))}
                          
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                              className={`${currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-blue-50'} text-sm`}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
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
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Terim Ekle
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <span>{editingTerm ? 'Terim Düzenle' : 'Yeni Terim Ekle'}</span>
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="term" className="text-sm font-medium">Terim</Label>
                    <Input
                      id="term"
                      value={formData.term}
                      onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                      placeholder="Terim adını girin..."
                      className="h-10"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="definition" className="text-sm font-medium">Tanım</Label>
                    <textarea
                      id="definition"
                      value={formData.definition}
                      onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
                      placeholder="Terim tanımını girin..."
                      className="w-full min-h-32 p-3 border border-input rounded-md bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                      required
                    />
                  </div>
                  <DialogFooter className="gap-2">
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      İptal
                    </Button>
                    <Button type="submit" disabled={createUpdateMutation.isPending} className="bg-blue-600 hover:bg-blue-700">
                      {createUpdateMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Terim</p>
                  <p className="text-2xl font-bold text-gray-900">{termsData?.total || 0}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Bu Sayfada</p>
                  <p className="text-2xl font-bold text-gray-900">{termsData?.terms.length || 0}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Search className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sayfa</p>
                  <p className="text-2xl font-bold text-gray-900">{currentPage} / {totalPages}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <span className="text-purple-600 font-bold text-lg">#</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Table */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-lg font-semibold">Terim Listesi</CardTitle>
              <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-2">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Terim veya tanımda ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Yükleniyor...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600">Hata: {error.message}</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold text-gray-900">Terim</TableHead>
                        <TableHead className="font-semibold text-gray-900">Tanım</TableHead>
                        <TableHead className="w-24 font-semibold text-gray-900">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {termsData?.terms && termsData.terms.length > 0 ? (
                        termsData.terms.map((term, index) => (
                          <TableRow key={term.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <TableCell className="font-medium text-gray-900 max-w-xs">
                              <div className="truncate" title={term.term}>{term.term}</div>
                            </TableCell>
                            <TableCell className="text-gray-600 max-w-md">
                              <div className="truncate" title={term.definition}>{term.definition}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(term)}
                                  className="h-8 w-8 p-0 hover:bg-blue-100"
                                >
                                  <Edit className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(term.id)}
                                  className="h-8 w-8 p-0 hover:bg-red-100"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-12">
                            <p className="text-gray-600">Hiç terim bulunamadı.</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center py-6 border-t bg-gray-50">
                    <div className="flex flex-wrap items-center justify-center gap-1 max-w-full">
                      <Pagination>
                        <PaginationContent className="flex-wrap">
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                              className={`${currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-blue-50'} text-sm`}
                            />
                          </PaginationItem>
                          
                          {generatePaginationRange().map((page, index) => (
                            <PaginationItem key={index}>
                              {page === 'ellipsis-start' || page === 'ellipsis-end' ? (
                                <PaginationEllipsis />
                              ) : (
                                <PaginationLink
                                  onClick={() => setCurrentPage(page as number)}
                                  isActive={currentPage === page}
                                  className={`cursor-pointer text-sm min-w-[36px] ${
                                    currentPage === page 
                                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                      : 'hover:bg-blue-50'
                                  }`}
                                >
                                  {page}
                                </PaginationLink>
                              )}
                            </PaginationItem>
                          ))}
                          
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                              className={`${currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer hover:bg-blue-50'} text-sm`}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
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
