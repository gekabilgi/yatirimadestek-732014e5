import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2, FileText, Share2, MessageSquare, Download } from 'lucide-react';
import { SupportProgram } from '@/types/support';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getFileIcon, getFileIconColor } from '@/utils/fileIcons';

const ProgramDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [program, setProgram] = useState<SupportProgram | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProgram();
    }
  }, [id]);

  const fetchProgram = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
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
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        const transformedProgram: SupportProgram = {
          ...data,
          tags: data.support_program_tags?.map(spt => spt.tag).filter(Boolean) || [],
          files: data.files || []
        };
        setProgram(transformedProgram);
      }
    } catch (error) {
      console.error('Error fetching program:', error);
      toast.error('Program bilgileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const isProgramOpen = () => {
    if (!program?.application_deadline) return true;
    const today = new Date();
    const deadline = new Date(program.application_deadline);
    return today <= deadline;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: program?.title,
        text: program?.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link kopyalandı!');
    }
  };

  const handleFeedback = () => {
    toast.info('Geri bildirim özelliği yakında eklenecek');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-white rounded-lg p-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">Program bulunamadı</div>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri Dön
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isOpen = isProgramOpen();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto max-w-4xl">
        <Button 
          onClick={() => navigate('/')} 
          variant="ghost" 
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Geri Dön
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                  {program.title}
                </CardTitle>
                
                {program.institution && (
                  <div className="flex items-center text-gray-600 mb-3">
                    <Building2 className="w-5 h-5 mr-2" />
                    <span className="text-lg">{program.institution.name}</span>
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Güncellenme: {formatDate(program.updated_at)}</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={isOpen ? 'text-green-600' : 'text-red-600'}>
                      {isOpen ? 'Açık' : 'Kapalı'}
                    </span>
                    {program.application_deadline && (
                      <span>- Son Başvuru: {formatDate(program.application_deadline)}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button variant="outline" size="sm" onClick={handleFeedback}>
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Geri Bildirim
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-1" />
                  Paylaş
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {program.files && program.files.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  <FileText className="w-5 h-5 inline mr-2" />
                  İlgili Belgeler
                </h3>
                <div className="space-y-2">
                  {program.files.map((file) => {
                    const FileIcon = getFileIcon(file.filename);
                    const iconColor = getFileIconColor(file.filename);
                    
                    return (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 flex-1">
                          <FileIcon className={`w-5 h-5 ${iconColor}`} />
                          <span className="text-sm text-gray-700">
                            {file.filename}
                          </span>
                        </div>
                        <a
                          href={file.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          İndir
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProgramDetails;
