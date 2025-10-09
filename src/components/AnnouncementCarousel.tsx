import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

const AnnouncementCarousel = () => {
  const navigate = useNavigate();

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('announcement_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="w-full py-12">
        <h2 className="text-3xl font-bold text-center mb-8 text-slate-900">
          Güncel Destek Duyuruları
        </h2>
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-72">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="w-24 h-24 mx-auto rounded-lg" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="w-full py-12">
        <h2 className="text-3xl font-bold text-center mb-8 text-slate-900">
          Güncel Destek Duyuruları
        </h2>
        <p className="text-center text-muted-foreground">Henüz duyuru bulunmamaktadır.</p>
      </div>
    );
  }

  return (
    <div className="w-full py-12">
      <h2 className="text-3xl font-bold text-center mb-8 text-slate-900">
        Güncel Destek Duyuruları
      </h2>
      
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full max-w-6xl mx-auto"
      >
        <CarouselContent className="-ml-4">
          {announcements.map((announcement) => (
            <CarouselItem key={announcement.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
              <Card 
                className="card-modern hover:shadow-xl transition-all duration-300 h-full cursor-pointer"
                onClick={() => navigate(`/duyuru/${announcement.id}`)}
              >
                <CardContent className="p-6 flex flex-col h-full">
                  {/* Agency Logo */}
                  <div className="mb-4 flex justify-center">
                    <div className="w-24 h-24 bg-white rounded-lg shadow-sm flex items-center justify-center p-2">
                      <img 
                        src={announcement.institution_logo} 
                        alt={announcement.institution_name}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-semibold text-slate-900 mb-4 line-clamp-3 flex-grow">
                    {announcement.title}
                  </h3>

                  {/* Date */}
                  <div className="flex items-center justify-between text-xs text-slate-600 pt-4 border-t">
                    <span className="font-medium uppercase">
                      {format(new Date(announcement.announcement_date), 'd MMMM yyyy', { locale: tr })}
                    </span>
                    {announcement.external_link && (
                      <ExternalLink className="h-4 w-4 text-primary" />
                    )}
                  </div>

                  {/* Progress bar indicator */}
                  <div className="mt-4">
                    <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full w-1/3 bg-slate-900 rounded-full"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-0 -translate-x-12" />
        <CarouselNext className="right-0 translate-x-12" />
      </Carousel>
    </div>
  );
};

export default AnnouncementCarousel;
