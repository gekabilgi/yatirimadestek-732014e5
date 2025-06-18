
import React from 'react';
import { Bell, Calendar, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const AnnouncementStream = () => {
  const announcements = [
    {
      id: 1,
      title: "Yeni Teşvik Düzenlemeleri Yürürlükte",
      summary: "2024 yılı için güncellenmiş teşvik oranları ve başvuru süreçleri hakkında önemli bilgiler.",
      date: "15 Haziran 2025",
      urgent: true,
    },
    {
      id: 2,
      title: "Teknoloji Hamlesi Başvuruları",
      summary: "Teknoloji odaklı yatırımlar için özel teşvik paketi başvuruları başladı.",
      date: "10 Haziran 2025",
      urgent: false,
    },
    {
      id: 3,
      title: "Bölgesel Kalkınma Destekleri",
      summary: "4., 5. ve 6. bölgelerdeki yatırımlar için ek teşvik imkanları açıklandı.",
      date: "8 Haziran 2025",
      urgent: false,
    },
  ];

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Bell className="h-6 w-6 text-primary" />
            <h2 className="text-3xl font-bold text-gray-900">Duyurular ve Güncellemeler</h2>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Teşvik sistemi hakkında son gelişmeler ve önemli duyurular
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className={`transition-all hover:shadow-md ${announcement.urgent ? 'border-orange-200 bg-orange-50' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {announcement.urgent && (
                        <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">
                          Acil
                        </span>
                      )}
                      <h3 className="text-xl font-semibold text-gray-900">
                        {announcement.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 mb-3">
                      {announcement.summary}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {announcement.date}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="ml-4">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Detay
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline">
            Tüm Duyuruları Görüntüle
          </Button>
        </div>
      </div>
    </section>
  );
};

export default AnnouncementStream;
