import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, X, Tag, Building2, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchFilters, Tag as TagType, Institution } from '@/types/support';
import { supabase } from '@/integrations/supabase/client';
import { useSearchSuggestions, SearchSuggestion } from '@/hooks/useSearchSuggestions';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  filters: SearchFilters;
}

export const SearchBar = ({ onSearch, filters }: SearchBarProps) => {
  const [showFilters, setShowFilters] = useState(false);
  const [availableTags, setAvailableTags] = useState<TagType[]>([]);
  const [availableInstitutions, setAvailableInstitutions] = useState<Institution[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>(filters.tags || []);
  const [keyword, setKeyword] = useState(filters.keyword || '');
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<number | undefined>(filters.institutionId);
  const [status, setStatus] = useState<'all' | 'open' | 'closed'>(filters.status || 'all');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  const { suggestions, loading: suggestionsLoading, fetchSuggestions, clearSuggestions } = useSearchSuggestions();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

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

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  }, {} as Record<string, TagType[]>);

  const activeFilterCount = selectedTags.length + (selectedInstitutionId ? 1 : 0) + (status !== 'all' ? 1 : 0);

  // Handle keyword input change
  const handleKeywordChange = (value: string) => {
    setKeyword(value);
    fetchSuggestions(value);
    setShowSuggestions(true);
    setSelectedSuggestionIndex(-1);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    if (suggestion.suggestion_type === 'tag') {
      // Add tag to filters
      const tagId = parseInt(suggestion.suggestion_id);
      if (!selectedTags.includes(tagId)) {
        const newSelectedTags = [...selectedTags, tagId];
        setSelectedTags(newSelectedTags);
      }
      setKeyword('');
    } else if (suggestion.suggestion_type === 'institution') {
      // Set institution filter
      setSelectedInstitutionId(parseInt(suggestion.suggestion_id));
      setKeyword('');
    } else {
      // Set keyword to program title
      setKeyword(suggestion.suggestion_text);
    }
    
    setShowSuggestions(false);
    clearSuggestions();
    
    // Trigger search after a short delay
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  // Handle keyboard navigation in suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedSuggestionIndex]);
        } else {
          setShowSuggestions(false);
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  // Group suggestions by type for display
  const tagSuggestions = suggestions.filter(s => s.suggestion_type === 'tag');
  const institutionSuggestions = suggestions.filter(s => s.suggestion_type === 'institution');
  const programSuggestions = suggestions.filter(s => s.suggestion_type === 'program');

  // Get flat index for a suggestion
  const getSuggestionIndex = (type: string, indexInGroup: number): number => {
    if (type === 'tag') return indexInGroup;
    if (type === 'institution') return tagSuggestions.length + indexInGroup;
    return tagSuggestions.length + institutionSuggestions.length + indexInGroup;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-3 lg:gap-2">
        <div className="flex-1 lg:flex-auto relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              ref={inputRef}
              placeholder="Destek adı, kurum, etiket veya anahtar kelime ile ara..."
              value={keyword}
              onChange={(e) => handleKeywordChange(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              className="pl-10 h-11 text-base w-full"
            />
          </div>
          
          {/* Autocomplete Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div 
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-lg shadow-lg overflow-hidden"
            >
              <div className="max-h-80 overflow-y-auto py-1">
                {/* Tag Suggestions */}
                {tagSuggestions.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                      Etiketler
                    </div>
                    {tagSuggestions.map((suggestion, idx) => {
                      const flatIndex = getSuggestionIndex('tag', idx);
                      return (
                        <button
                          key={`tag-${suggestion.suggestion_id}`}
                          onClick={() => handleSuggestionSelect(suggestion)}
                          className={cn(
                            "w-full px-3 py-2 flex items-center gap-3 hover:bg-accent text-left transition-colors",
                            selectedSuggestionIndex === flatIndex && "bg-accent"
                          )}
                        >
                          <Tag className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          <span className="flex-1 truncate">{suggestion.suggestion_text}</span>
                          {suggestion.category_name && (
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {suggestion.category_name}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Institution Suggestions */}
                {institutionSuggestions.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                      Kurumlar
                    </div>
                    {institutionSuggestions.map((suggestion, idx) => {
                      const flatIndex = getSuggestionIndex('institution', idx);
                      return (
                        <button
                          key={`inst-${suggestion.suggestion_id}`}
                          onClick={() => handleSuggestionSelect(suggestion)}
                          className={cn(
                            "w-full px-3 py-2 flex items-center gap-3 hover:bg-accent text-left transition-colors",
                            selectedSuggestionIndex === flatIndex && "bg-accent"
                          )}
                        >
                          <Building2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="flex-1 truncate">{suggestion.suggestion_text}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Program Suggestions */}
                {programSuggestions.length > 0 && (
                  <div>
                    <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                      Destek Programları
                    </div>
                    {programSuggestions.map((suggestion, idx) => {
                      const flatIndex = getSuggestionIndex('program', idx);
                      return (
                        <button
                          key={`prog-${suggestion.suggestion_id}`}
                          onClick={() => handleSuggestionSelect(suggestion)}
                          className={cn(
                            "w-full px-3 py-2 flex items-center gap-3 hover:bg-accent text-left transition-colors",
                            selectedSuggestionIndex === flatIndex && "bg-accent"
                          )}
                        >
                          <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                          <span className="flex-1 truncate">{suggestion.suggestion_text}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
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
