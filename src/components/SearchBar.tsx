
import React, { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchFilters, Tag, Institution } from '@/types/support';
import { supabase } from '@/integrations/supabase/client';

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  filters: SearchFilters;
}

export const SearchBar = ({ onSearch, filters }: SearchBarProps) => {
  const [showFilters, setShowFilters] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [availableInstitutions, setAvailableInstitutions] = useState<Institution[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>(filters.tags || []);
  const [keyword, setKeyword] = useState(filters.keyword || '');
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<number | undefined>(filters.institutionId);
  const [status, setStatus] = useState<'all' | 'open' | 'closed'>(filters.status || 'all');

  useEffect(() => {
    fetchTags();
    fetchInstitutions();
  }, []);

  // Auto-search with debouncing when keyword changes
  useEffect(() => {
    if (keyword.length >= 3) {
      const debounceTimer = setTimeout(() => {
        handleSearch();
      }, 400);
      
      return () => clearTimeout(debounceTimer);
    } else if (keyword.length === 0) {
      handleSearch();
    }
  }, [keyword]);

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*, category:tag_categories(*)')
        .order('name');
      
      if (error) throw error;
      setAvailableTags(data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchInstitutions = async () => {
    try {
      const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setAvailableInstitutions(data || []);
    } catch (error) {
      console.error('Error fetching institutions:', error);
    }
  };

  const handleTagToggle = (tagId: number) => {
    const newSelectedTags = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];
    
    setSelectedTags(newSelectedTags);
  };

  const handleSearch = async () => {
    console.log('SearchBar handleSearch called - NO TRACKING (support search page)');
    
    onSearch({
      keyword: keyword.trim() || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      institutionId: selectedInstitutionId,
      status: status !== 'all' ? status : undefined,
    });
  };

  const clearFilters = () => {
    setKeyword('');
    setSelectedInstitutionId(undefined);
    setSelectedTags([]);
    setStatus('all');
    onSearch({});
  };

  const getSelectedTagNames = () => {
    return availableTags
      .filter(tag => selectedTags.includes(tag.id))
      .map(tag => tag.name);
  };

  const getSelectedInstitutionName = () => {
    return availableInstitutions.find(inst => inst.id === selectedInstitutionId)?.name;
  };

  // Group tags by category
  const groupedTags = availableTags.reduce((acc, tag) => {
    const categoryName = tag.category?.name || 'Diğer';
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(tag);
    return acc;
  }, {} as Record<string, Tag[]>);

  const activeFilterCount = selectedTags.length + (selectedInstitutionId ? 1 : 0) + (status !== 'all' ? 1 : 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-3 lg:gap-2">
        <div className="flex-1 lg:flex-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Destek adı, kurum, çağrı veya anahtar kelime ile ara..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-10 h-11 text-base w-full"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>
        
        <div className="flex gap-2 lg:gap-2 lg:flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 h-11 flex-1 lg:flex-none lg:min-w-[120px] justify-center"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filtreler</span>
            <span className="sm:hidden">Filtre</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          
          <Button onClick={handleSearch} className="h-11 flex-1 lg:flex-none lg:min-w-[80px]">
            <span className="hidden sm:inline">Ara</span>
            <Search className="w-4 h-4 sm:hidden" />
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="institution-select">Kurum</Label>
                <Select
                  value={selectedInstitutionId?.toString() || 'all'}
                  onValueChange={(val) => setSelectedInstitutionId(val === 'all' ? undefined : parseInt(val))}
                >
                  <SelectTrigger id="institution-select" className="mt-1">
                    <SelectValue placeholder="Tüm Kurumlar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Kurumlar</SelectItem>
                    {availableInstitutions.map(inst => (
                      <SelectItem key={inst.id} value={inst.id.toString()}>
                        {inst.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Başvuru Durumu</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button
                    type="button"
                    variant={status === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatus('all')}
                  >
                    Tümü
                  </Button>
                  <Button
                    type="button"
                    variant={status === 'open' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatus('open')}
                    className={status === 'open' ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    Açık Başvurular
                  </Button>
                  <Button
                    type="button"
                    variant={status === 'closed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatus('closed')}
                    className={status === 'closed' ? 'bg-red-600 hover:bg-red-700' : ''}
                  >
                    Kapalı Başvurular
                  </Button>
                </div>
              </div>

              <div>
                <Label>Etiketler</Label>
                <Accordion type="multiple" className="mt-2">
                  {Object.entries(groupedTags).map(([categoryName, tags]) => (
                    <AccordionItem key={categoryName} value={categoryName}>
                      <AccordionTrigger className="text-sm font-medium">
                        {categoryName === 'Applicant Type' ? 'Kimler Başvurabilir?' : categoryName}
                        {tags.some(tag => selectedTags.includes(tag.id)) && (
                          <Badge variant="secondary" className="ml-2">
                            {tags.filter(tag => selectedTags.includes(tag.id)).length}
                          </Badge>
                        )}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                          {tags.map((tag) => (
                            <div key={tag.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`tag-${tag.id}`}
                                checked={selectedTags.includes(tag.id)}
                                onCheckedChange={() => handleTagToggle(tag.id)}
                              />
                              <Label
                                htmlFor={`tag-${tag.id}`}
                                className="text-sm cursor-pointer"
                              >
                                {tag.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Filtreleri Temizle
                </Button>
                <Button onClick={handleSearch}>
                  Filtreleri Uygula
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Filters Display */}
      {(selectedTags.length > 0 || selectedInstitutionId || status !== 'all') && (
        <div className="flex flex-wrap gap-2">
          {status !== 'all' && (
            <Badge 
              variant="secondary" 
              className={`flex items-center gap-1 ${status === 'open' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
            >
              {status === 'open' ? 'Açık Başvurular' : 'Kapalı Başvurular'}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => setStatus('all')}
              />
            </Badge>
          )}
          {selectedInstitutionId && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Kurum: {getSelectedInstitutionName()}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => setSelectedInstitutionId(undefined)}
              />
            </Badge>
          )}
          {getSelectedTagNames().map((tagName, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {tagName}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => {
                  const tagToRemove = availableTags.find(tag => tag.name === tagName);
                  if (tagToRemove) {
                    handleTagToggle(tagToRemove.id);
                  }
                }}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
