
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Users, Clock, CheckCircle } from 'lucide-react';
import SoruSorModal from './SoruSorModal';
import { supabase } from '@/integrations/supabase/client';

const QnaSection = () => {
  const [averageResponseTime, setAverageResponseTime] = useState("Hesaplanıyor...");

  useEffect(() => {
    const fetchAverageResponseTime = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('calculate-avg-response-time');
        
        if (error) {
          console.error('Error fetching average response time:', error);
          setAverageResponseTime("24 saat");
          return;
        }

        setAverageResponseTime(data.averageResponseTime || "24 saat");
      } catch (error) {
        console.error('Error calling average response time function:', error);
        setAverageResponseTime("24 saat");
      }
    };

    fetchAverageResponseTime();
  }, []);

  const stats = [
    { label: "Toplam Soru", value: "2.450+", icon: MessageSquare },
    { label: "Aktif Uzman", value: "50+", icon: Users },
    { label: "Ortalama Yanıt Süresi", value: averageResponseTime, icon: Clock },
    { label: "Yanıtlanan Sorular", value: "%95", icon: CheckCircle },
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
            Uzmanlarımıza 
            <span className="bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">
              {" "}Soru Sorun
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Yatırım destekleri, teşvik sistemleri ve başvuru süreçleri hakkında merak ettiklerinizi 
            alanında uzman ekibimize sorabilirsiniz. Sorularınız en kısa sürede yanıtlanacaktır.
          </p>
          
          <SoruSorModal />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index} className="border-0 shadow-md bg-white/60 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-3">
                    <div className="rounded-lg bg-primary/10 p-3">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Nasıl Çalışır?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-semibold">1</span>
                  Yukarıdaki "Soru Sor" butonuna tıklayarak form ile sorunuzu gönderin
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-semibold">2</span>
                  Sorunuz ilgili uzman ekibe yönlendirilir
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-semibold">3</span>
                  24-48 saat içinde e-posta ile yanıt alırsınız
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Sık Sorulan Konular
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-600">
                <li>• Yatırım teşvik başvuru süreçleri</li>
                <li>• Sektörel destek programları</li>
                <li>• Bölgesel teşvik imkanları</li>
                <li>• Gerekli belgeler ve şartlar</li>
                <li>• Başvuru sonrası süreçler</li>
                <li>• Vergi indirimleri ve muafiyetler</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default QnaSection;
