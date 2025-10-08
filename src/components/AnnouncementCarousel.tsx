import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { ExternalLink } from 'lucide-react';

interface Announcement {
  id: number;
  agency: string;
  agencyLogo: string;
  title: string;
  date: string;
  link?: string;
}

const announcements: Announcement[] = [
  {
    id: 1,
    agency: 'TKDK',
    agencyLogo: '/img/image.png',
    title: 'İPARD III (2021-2027) Onuncu Başvuru Çağrı Dönemi İlan Edilmiştir.',
    date: '18 TEMMUZ 2025',
    link: '#',
  },
  {
    id: 2,
    agency: 'TKDK',
    agencyLogo: '/img/image.png',
    title: 'İPARD III (2021-2027) Onuncu Başvuru Çağrı Dönemi İlan Edilmiştir.',
    date: '07 EKİM 2025',
    link: '#',
  },
  {
    id: 3,
    agency: 'İŞKUR',
    agencyLogo: '/img/image.png',
    title: 'İŞKUR Engellilere ve Eski Hükümlülere Yönelik 2025/3 Hibe Desteği Başvuruları Başlamıştır.',
    date: '02 EKİM 2025',
    link: '#',
  },
  {
    id: 4,
    agency: 'TKDK',
    agencyLogo: '/img/image.png',
    title: 'İPARD III (2021-2027) Dokuzuncu Başvuru Çağrı Dönemi İlan Edilmiştir.',
    date: '08 EYLÜL 2025',
    link: '#',
  },
  {
    id: 5,
    agency: 'BİGG',
    agencyLogo: '/img/image.png',
    title: 'BİGG Programı 2025/2 Dönemi Başvuruları Başlamıştır.',
    date: '15 AĞUSTOS 2025',
    link: '#',
  },
];

const AnnouncementCarousel = () => {
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
              <Card className="card-modern hover:shadow-xl transition-all duration-300 h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  {/* Agency Logo */}
                  <div className="mb-4 flex justify-center">
                    <div className="w-24 h-24 bg-white rounded-lg shadow-sm flex items-center justify-center p-2">
                      <img 
                        src={announcement.agencyLogo} 
                        alt={announcement.agency}
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
                    <span className="font-medium">{announcement.date}</span>
                    {announcement.link && (
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
