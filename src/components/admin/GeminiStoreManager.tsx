import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Upload, FileText, CheckCircle2 } from 'lucide-react';
import {
  listRagStores,
  createRagStore,
  deleteRagStore,
  listDocuments,
  uploadDocument,
  deleteDocument,
  getActiveStore,
  setActiveStore,
  type RagStore,
  type Document,
} from '@/services/geminiRagService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

export const GeminiStoreManager = () => {
  const { toast } = useToast();
  const [stores, setStores] = useState<RagStore[]>([]);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [activeStore, setActiveStoreState] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadStores();
    getActiveStore().then(setActiveStoreState);
  }, []);

  useEffect(() => {
    if (selectedStore) {
      loadDocuments(selectedStore);
      setCurrentPage(1);
    } else {
      setDocuments([]);
    }
  }, [selectedStore]);

  const loadStores = async () => {
    setLoading(true);
    try {
      const data = await listRagStores();
      setStores(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load stores',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async (storeName: string) => {
    setLoading(true);
    try {
      const data = await listDocuments(storeName);
      setDocuments(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load documents',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStore = async () => {
    if (!newStoreName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a store name',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await createRagStore(newStoreName);
      setNewStoreName('');
      toast({
        title: 'Success',
        description: 'Store created successfully',
      });
      await loadStores();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create store',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStore = async (storeName: string) => {
    if (!confirm('Are you sure you want to delete this store and all its documents?')) {
      return;
    }

    setLoading(true);
    try {
      await deleteRagStore(storeName);
      if (selectedStore === storeName) {
        setSelectedStore(null);
      }
      if (activeStore === storeName) {
        setActiveStoreState(null);
        await setActiveStore('');
      }
      toast({
        title: 'Success',
        description: 'Store deleted successfully',
      });
      await loadStores();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete store',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedStore) return;

    const file = files[0];
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/pdf',
      'text/plain',
      'text/csv',
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Error',
        description: 'Please upload DOCX, XLSX, PDF, TXT, or CSV files',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      await uploadDocument(selectedStore, file);
      toast({
        title: 'Success',
        description: 'Document uploaded successfully',
      });
      await loadDocuments(selectedStore);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteDocument = async (docName: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    setLoading(true);
    try {
      await deleteDocument(docName);
      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      });
      if (selectedStore) {
        await loadDocuments(selectedStore);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetActiveStore = async (storeName: string) => {
    try {
      await setActiveStore(storeName);
      setActiveStoreState(storeName);
      toast({
        title: 'Success',
        description: 'Active chatbot store updated',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update active store',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Store</CardTitle>
          <CardDescription>Create a new Gemini file search store</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Store name"
              value={newStoreName}
              onChange={(e) => setNewStoreName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateStore()}
            />
            <Button onClick={handleCreateStore} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Stores</CardTitle>
          <CardDescription>Select a store to manage documents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {stores.length === 0 ? (
            <p className="text-sm text-muted-foreground">No stores created yet</p>
          ) : (
            <div className="space-y-2">
              {stores.map((store) => (
                <div
                  key={store.name}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{store.displayName}</span>
                    {activeStore === store.name && (
                      <Badge variant="default" className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedStore(store.name)}
                    >
                      View Documents
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleSetActiveStore(store.name)}
                      disabled={activeStore === store.name}
                    >
                      Set Active
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteStore(store.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedStore && (
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>
              Manage documents in{' '}
              {stores.find((s) => s.name === selectedStore)?.displayName || selectedStore}
              {documents.length > 0 && ` (${documents.length} document${documents.length === 1 ? '' : 's'})`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                type="file"
                accept=".docx,.xlsx,.pdf,.txt,.csv"
                onChange={handleFileUpload}
                disabled={uploading}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Supported formats: DOCX, XLSX, PDF, TXT, CSV
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document Name</TableHead>
                      <TableHead>Upload Date & Time</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((doc) => (
                        <TableRow key={doc.name}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              {doc.displayName}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {doc.createTime
                                ? new Date(doc.createTime).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteDocument(doc.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
                {documents.length > itemsPerPage && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          className={
                            currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.ceil(documents.length / itemsPerPage) }, (_, i) => i + 1).map(
                        (page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            setCurrentPage((p) => Math.min(Math.ceil(documents.length / itemsPerPage), p + 1))
                          }
                          className={
                            currentPage === Math.ceil(documents.length / itemsPerPage)
                              ? 'pointer-events-none opacity-50'
                              : 'cursor-pointer'
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
