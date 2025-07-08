
import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, FileText, List, UserCheck, Search, Handshake, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import MainNavbar from '@/components/MainNavbar';

const TZY = () => {
  const flowSteps = [
    {
      icon: Building2,
      title: "Alıcı Firma",
      description: "Tedarikçi Bulmak İçin Ön Talep Oluşturur",
      color: "text-blue-600"
    },
    {
      icon: FileText,
      title: "Değerlendirme",
      description: "Ön Talep Bakanlıkça Değerlendirilir",
      color: "text-purple-600"
    },
    {
      icon: List,
      title: "Listeleme",
      description: "Onaylı Talepler Listelenir",
      color: "text-green-600"
    },
    {
      icon: UserCheck,
      title: "Başvuru",
      description: "Yerli Tedarikçi Listeden Seçtiği Ürün İçin Başvuru Yapar",
      color: "text-orange-600"
    },
    {
      icon: Search,
      title: "İnceleme",
      description: "Başvurular Kalkınma Ajansları Tarafından İncelenir",
      color: "text-red-600"
    },
    {
      icon: Handshake,
      title: "Eşleştirme",
      description: "Alıcı Firma ile Tedarikçi Firma Buluşturulur",
      color: "text-indigo-600"
    },
    {
      icon: CheckCircle,
      title: "Anlaşma",
      description: "Alıcı Firma ve Tedarikçi Firma Anlaşma Sağlar",
      color: "text-emerald-600"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <MainNavbar />
      
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in">
            Tedarik Zinciri Yerlileştirme
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-4xl mx-auto animate-fade-in">
            Yerli tedarikçiler ile alıcı firmaları buluşturan, ekonomik büyümeyi destekleyen 
            dijital platform. Güvenilir iş ortaklıkları kurun, yerel ekonomiyi güçlendirin.
          </p>
        </div>
      </section>

      {/* Flow Diagram */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Süreç Akışı
          </h2>
          
          {/* Desktop Flow - Horizontal */}
          <div className="hidden lg:block">
            <div className="flex items-center justify-between mb-8">
              {flowSteps.map((step, index) => (
                <div key={index} className="flex items-center animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <Card className="p-6 text-center max-w-xs hover:shadow-lg transition-shadow duration-300">
                    <div className={`mx-auto mb-4 ${step.color}`}>
                      <step.icon className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2 text-gray-900">
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </Card>
                  
                  {index < flowSteps.length - 1 && (
                    <div className="mx-4 text-gray-400">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Mobile Flow - Vertical */}
          <div className="lg:hidden space-y-6">
            {flowSteps.map((step, index) => (
              <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <Card className="p-6 text-center hover:shadow-lg transition-shadow duration-300">
                  <div className="flex items-center justify-center mb-4">
                    <div className={`${step.color} mr-4`}>
                      <step.icon className="h-10 w-10" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-lg mb-1 text-gray-900">
                        {index + 1}. {step.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </Card>
                
                {index < flowSteps.length - 1 && (
                  <div className="flex justify-center py-2">
                    <div className="text-gray-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-8 text-gray-900">
            Hangi Kategoridesiniz?
          </h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            İhtiyacınıza uygun seçeneği seçerek hemen başlayın
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Tedarikçi Bul Button */}
            <Card className="p-8 hover:shadow-xl transition-all duration-300 border-2 border-gray-200 hover:border-red-300 animate-fade-in">
              <div className="text-red-600 mb-4">
                <Search className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">
                Tedarikçi Bul
              </h3>
              <p className="text-gray-600 mb-6">
                İhtiyacınız olan ürün veya hizmet için güvenilir yerli tedarikçiler bulun
              </p>
              <Link to="/tzyotg">
                <Button 
                  size="lg" 
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-300"
                >
                  Tedarikçi Aramaya Başla
                </Button>
              </Link>
            </Card>

            {/* Tedarikçi Ol Button */}
            <Card className="p-8 hover:shadow-xl transition-all duration-300 border-2 border-gray-200 hover:border-red-300 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="text-red-600 mb-4">
                <Building2 className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">
                Tedarikçi Ol
              </h3>
              <p className="text-gray-600 mb-6">
                Firmanızı kaydedin ve büyük projelerde tedarikçi olarak yer alın
              </p>
              <Link to="/tbg">
                <Button 
                  size="lg" 
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-300"
                >
                  Tedarikçi Olarak Başvur
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-8 text-gray-900">
            Neden Tedarik Zinciri Yerlileştirme?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="animate-fade-in">
              <div className="text-red-600 mb-4">
                <CheckCircle className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Güvenilir İş Ortaklıkları</h3>
              <p className="text-gray-600">
                Kalkınma ajansları tarafından incelenen, güvenilir tedarikçilerle çalışın
              </p>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="text-red-600 mb-4">
                <Handshake className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Kolay Eşleştirme</h3>
              <p className="text-gray-600">
                İhtiyacınıza uygun tedarikçilerle hızlı ve kolay eşleşin
              </p>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="text-red-600 mb-4">
                <Building2 className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Yerel Ekonomi</h3>
              <p className="text-gray-600">
                Yerli üretimi destekleyerek ekonomik büyümeye katkıda bulunun
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TZY;
