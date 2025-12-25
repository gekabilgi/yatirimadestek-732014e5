import React, { useState, useEffect, useRef } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { SupportList } from '@/components/SupportList';
import { SearchFilters, SupportProgram } from '@/types/support';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import MainNavbar from '@/components/MainNavbar';
import StandardHero from '@/components/StandardHero';
import { Target } from 'lucide-react';
import { useSearchAnalytics } from '@/hooks/useSearchAnalytics';

const SearchSupport = () => {
  const [programs, setPrograms] = useState<SupportProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const { trackSearch } = useSearchAnalytics();
  const searchStartTimeRef = useRef<number>(0);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const isProgramOpen = (program: SupportProgram) => {
    if (!program?.application_deadline) return true;
    const today = new Date();
    const deadline = new Date(program.application_deadline);
    return today <= deadline;
  };

  const sortPrograms = (programs: SupportProgram[]) => {
    return programs.sort((a, b) => {
      const aIsOpen = isProgramOpen(a);
      const bIsOpen = isProgramOpen(b);
      
      // First sort by open/closed status (open programs first)
      if (aIsOpen !== bIsOpen) {
        return bIsOpen ? 1 : -1;
      }
      
      // Then sort by created_at (most recent first)
      const aDate = new Date(a.created_at);
      const bDate = new Date(b.created_at);
      return bDate.getTime() - aDate.getTime();
    });
  };

  const fetchPrograms = async (searchFilters?: SearchFilters, shouldTrack = false) => {
    setLoading(true);
    searchStartTimeRef.current = performance.now();
    try {
      let query = supabase
        .from('support_programs')
        .select(`
          *,
          institution:institutions(*),
          support_program_tags(
            tag:tags(
              *,
              category:tag_categories(*)
            )
          ),
          files:file_attachments(*)
        `)
        .order('created_at', { ascending: false });

      // If institution dropdown is selected, filter directly by institution_id
      if (searchFilters?.institutionId) {
        query = query.eq('institution_id', searchFilters.institutionId);
      }

      const { data, error } = await query;

      if (error) throw error;

      let filteredPrograms = data || [];

      // Hybrid keyword search: search in title, description, eligibility_criteria, and institution name
      if (searchFilters?.keyword) {
        const keywordLower = searchFilters.keyword.toLowerCase().trim();
        const keywords = keywordLower.split(/\s+/).filter(k => k.length >= 2);
        
        filteredPrograms = filteredPrograms.filter(program => {
          const searchableText = [
            program.title,
            program.description,
            program.eligibility_criteria,
            program.contact_info,
            program.institution?.name
          ].filter(Boolean).join(' ').toLowerCase();
          
          // Match if any keyword is found in the searchable text
          return keywords.some(kw => searchableText.includes(kw));
        });
      }

      // Apply tag filters on the client side
      if (searchFilters?.tags && searchFilters.tags.length > 0) {
        filteredPrograms = filteredPrograms.filter(program => {
          const programTagIds = program.support_program_tags?.map(spt => spt.tag?.id).filter(Boolean) || [];
          return searchFilters.tags!.some(tagId => programTagIds.includes(tagId));
        });
      }

      // Apply status filter (open/closed)
      if (searchFilters?.status) {
        filteredPrograms = filteredPrograms.filter(program => {
          const deadline = program.application_deadline;
          const isOpen = !deadline || new Date() <= new Date(deadline);
          if (searchFilters.status === 'open') return isOpen;
          if (searchFilters.status === 'closed') return !isOpen;
          return true;
        });
      }

      // Transform the data to match our SupportProgram interface
      const transformedPrograms: SupportProgram[] = filteredPrograms.map(program => ({
        ...program,
        tags: program.support_program_tags?.map(spt => spt.tag).filter(Boolean) || [],
        files: program.files || []
      }));

      // Sort programs by open/closed status and then by updated date
      const sortedPrograms = sortPrograms(transformedPrograms);
      setPrograms(sortedPrograms);

      // Track search analytics
      if (shouldTrack && (searchFilters?.keyword || searchFilters?.institutionId || searchFilters?.tags?.length)) {
        const endTime = performance.now();
        const institutionName = searchFilters?.institutionId 
          ? filteredPrograms.find(p => p.institution_id === searchFilters.institutionId)?.institution?.name 
          : undefined;
        
        const searchQuery = [
          searchFilters?.keyword,
          institutionName,
          searchFilters?.tags?.join(',')
        ].filter(Boolean).join(' | ');
        
        await trackSearch(searchQuery, 'support_search', {
          responseTimeMs: Math.round(endTime - searchStartTimeRef.current),
          resultsCount: sortedPrograms.length,
          filters: {
            keyword: searchFilters?.keyword,
            institutionId: searchFilters?.institutionId,
            tags: searchFilters?.tags,
            status: searchFilters?.status
          }
        });
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast.error('Destek programları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
      setInitialLoadComplete(true);
    }
  };

  const handleSearch = (searchFilters: SearchFilters) => {
    setFilters(searchFilters);
    fetchPrograms(searchFilters, true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavbar />
      
      <StandardHero
        title="Destek Programları"
        description="Size uygun destek programlarını bulun ve başvuru süreçlerinizi kolaylaştırın."
        badge={{
          text: "Aktif Destek Çağrıları",
          icon: Target
        }}
        compact
      />
      
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <SearchBar onSearch={handleSearch} filters={filters} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SupportList programs={programs} isLoading={loading || !initialLoadComplete} />
      </div>
    </div>
  );
};

export default SearchSupport;
