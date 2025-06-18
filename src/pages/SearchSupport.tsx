
import React, { useState, useEffect } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { SupportList } from '@/components/SupportList';
import { SearchFilters, SupportProgram } from '@/types/support';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import MainNavbar from '@/components/MainNavbar';

const SearchSupport = () => {
  const [programs, setPrograms] = useState<SupportProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>({});

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
      
      // Then sort by updated_at (most recent first)
      const aDate = new Date(a.updated_at);
      const bDate = new Date(b.updated_at);
      return bDate.getTime() - aDate.getTime();
    });
  };

  const fetchPrograms = async (searchFilters?: SearchFilters) => {
    setLoading(true);
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

      // Apply keyword filter
      if (searchFilters?.keyword) {
        query = query.or(`title.ilike.%${searchFilters.keyword}%,description.ilike.%${searchFilters.keyword}%`);
      }

      // Apply institution filter
      if (searchFilters?.institution) {
        const { data: institutionData } = await supabase
          .from('institutions')
          .select('id')
          .ilike('name', `%${searchFilters.institution}%`);
        
        if (institutionData && institutionData.length > 0) {
          const institutionIds = institutionData.map(inst => inst.id);
          query = query.in('institution_id', institutionIds);
        } else {
          // No matching institutions found, return empty result
          setPrograms([]);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      let filteredPrograms = data || [];

      // Apply tag filters on the client side
      if (searchFilters?.tags && searchFilters.tags.length > 0) {
        filteredPrograms = filteredPrograms.filter(program => {
          const programTagIds = program.support_program_tags?.map(spt => spt.tag?.id).filter(Boolean) || [];
          return searchFilters.tags!.some(tagId => programTagIds.includes(tagId));
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
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast.error('Destek programları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchFilters: SearchFilters) => {
    setFilters(searchFilters);
    fetchPrograms(searchFilters);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavbar />
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Destek Programları
          </h1>
          <SearchBar onSearch={handleSearch} filters={filters} />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <SupportList programs={programs} isLoading={loading} />
      </div>
    </div>
  );
};

export default SearchSupport;
