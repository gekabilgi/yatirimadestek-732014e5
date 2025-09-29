import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import MainNavbar from '@/components/MainNavbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Download, FileText, Filter, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

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
}

interface DocumentCategory {
  id: number;
  name: string;
  description: string;
}

const Legislation = () => {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDocType, setSelectedDocType] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments();
    fetchCategories();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('status', 'active');

      if (error) throw error;
      
      // Sort documents: custom order first (display_order > 0), then by publication_date
      const sortedData = (data || []).sort((a, b) => {
        if (a.display_order > 0 && b.display_order > 0) {
          return a.display_order - b.display_order;
        }
        if (a.display_order > 0) return -1;
        if (b.display_order > 0) return 1;
        return new Date(b.publication_date).getTime() - new Date(a.publication_date).getTime();
      });
      
      setDocuments(sortedData);
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

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('document_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchTerm === '' || 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.keywords?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDocType = selectedDocType === 'all' || doc.document_type === selectedDocType;
    
    return matchesSearch && matchesDocType;
  });

  const getFileExtension = (url: string) => {
    if (!url) return 'LINK';
    const extension = url.split('.').pop()?.toUpperCase();
    return extension || 'FILE';
  };

  const formatFileSize = () => {
    // Since we don't have file size in database, show as available
    return 'Mevcut';
  };

  const handleDownload = (doc: LegalDocument) => {
    const url = doc.file_url || doc.external_url;
    if (url) {
      window.open(url, '_blank');
    } else {
      toast({
        title: "Hata",
        description: "Dosya bulunamadı.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
  };

  const getDocumentTypeOptions = () => {
    const types = [...new Set(documents.map(doc => doc.document_type))];
    return types;
  };

  return (
    <div className="min-h-screen bg-background">
      <MainNavbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Mevzuat
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Teşvikler ve yatırım mevzuatına ilişkin güncel dökümanları buradan inceleyebilir ve indirebilirsiniz.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-card rounded-lg border p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Döküman ara (başlık, açıklama, anahtar kelime)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Döküman Türü" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Türler</SelectItem>
                  {getDocumentTypeOptions().map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            {filteredDocuments.length} döküman bulundu
          </p>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted rounded mb-4"></div>
                  <div className="h-10 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Döküman bulunamadı
            </h3>
            <p className="text-muted-foreground">
              Arama kriterlerinizi değiştirmeyi deneyin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg leading-tight">{doc.title}</CardTitle>
                    <Badge variant="secondary" className="shrink-0">
                      {getFileExtension(doc.file_url || doc.external_url)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDate(doc.publication_date)}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <CardDescription className="line-clamp-3">
                    {doc.description}
                  </CardDescription>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{doc.document_type}</Badge>
                    {doc.ministry && (
                      <Badge variant="outline">{doc.ministry}</Badge>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm text-muted-foreground">
                      {formatFileSize()}
                    </span>
                    <Button 
                      onClick={() => handleDownload(doc)}
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      İndir / Görüntüle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Legislation;