import React, { useCallback, useEffect, useState } from 'react';
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
  type CarouselApi,
} from '@/components/ui/carousel';
import { ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import Autoplay from 'embla-carousel-autoplay';
import { NewsletterSubscribeForm } from '@/components/NewsletterSubscribeForm';

const AnnouncementCarousel = () => {
  const navigate = useNavigate();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const autoplay = React.useRef(
    Autoplay({
      delay: 4000,
      stopOnInteraction: true,
      stopOnMouseEnter: true,
    })
  );

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

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const onDotClick = useCallback(
    (index: number) => {
      if (!api) return;
      api.scrollTo(index);
    },
    [api]
  );

  if (isLoading) {
    return (
      <div className="w-full py-12 animate-fade-in">
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
    <div className="w-full py-12 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
        <h2 className="text-3xl font-bold text-center text-slate-900">
          Güncel Destek Duyuruları
        </h2>
        <NewsletterSubscribeForm />
      </div>
      
      <div className="relative">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[autoplay.current]}
          className="w-full max-w-6xl mx-auto"
          setApi={setApi}
        >
        <CarouselContent className="-ml-4">
          {announcements.map((announcement) => (
            <CarouselItem key={announcement.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
              <Card 
                className="card-modern hover:shadow-xl transition-all duration-300 h-full cursor-pointer hover-scale"
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
                      <ExternalLink className="h-4 w-4 text-primary hover:text-primary/80 transition-colors" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>

      {/* Slide Indicators */}
      {count > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: count }).map((_, index) => (
            <button
              key={index}
              onClick={() => onDotClick(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === current
                  ? 'w-8 bg-primary'
                  : 'w-2 bg-primary/30 hover:bg-primary/50'
              }`}
              aria-label={`Slayt ${index + 1}'e git`}
            />
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default AnnouncementCarousel;
