import React, { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import MainNavbar from '@/components/MainNavbar';
import StandardHero from '@/components/StandardHero';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Search, 
  Users, 
  CheckCircle, 
  Eye, 
  Settings,
  Download,
  ArrowRight,
  Clock,
  AlertCircle,
  CheckSquare
} from 'lucide-react';

interface ProcessStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ComponentType<any>;
  timeline: string;
  requirements: string[];
  stakeholders: string[];
  commonIssues: string[];
  nextSteps: string[];
}

const ApplicationProcess = () => {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const processSteps: ProcessStep[] = [
    {
      id: 1,
      title: "Çağrı Duyurusu ve Başvuru",
      subtitle: "Call Announcement & Application",
      description: "Destek programının duyurulması ve başvuru sürecinin başlatılması",
      color: "text-green-700",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      icon: FileText,
      timeline: "60 gün",
      requirements: [
        "Başvuru formunun eksiksiz doldurulması",
        "Gerekli belgelerin hazırlanması",
        "Proje önerisinin detaylandırılması",
        "Bütçe planının oluşturulması"
      ],
      stakeholders: ["Başvuru Sahibi", "Kalkınma Ajansı", "Teknik Destek Ekibi"],
      commonIssues: [
        "Eksik belgeler",
        "Yanlış kategori seçimi",
        "Bütçe hesaplama hataları"
      ],
      nextSteps: [
        "Başvuru onay mailinin beklenmesi",
        "Eksik belgelerin tamamlanması"
      ]
    },
    {
      id: 2,
      title: "Ön Değerlendirme ve Revizyon",
      subtitle: "Pre-Evaluation & Revision",
      description: "Başvuruların ön incelemesi ve gerekli düzeltmelerin yapılması",
      color: "text-blue-700",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      icon: Search,
      timeline: "10 gün",
      requirements: [
        "Başvuru kriterlerinin kontrolü",
        "Belge eksikliklerinin giderilmesi",
        "Proje uygunluğunun değerlendirilmesi",
        "Revizyon taleplerinin karşılanması"
      ],
      stakeholders: ["Değerlendirme Komisyonu", "Uzman Personel", "Başvuru Sahibi"],
      commonIssues: [
        "Kriterlere uyumsuzluk",
        "Belge kalitesi sorunları",
        "Proje kapsamı belirsizlikleri"
      ],
      nextSteps: [
        "Revizyon taleplerinin yerine getirilmesi",
        "Ek belgelerin sunulması"
      ]
    },
    {
      id: 3,
      title: "Fizibilite Raporu ve Diğer Bilgi ve Belegelerin Hazırlanması",
      subtitle: "Feasibility Report & Other Documents",
      description: "Yönetim kurulu tarafından projelerin stratejik değerlendirmesi",
      color: "text-orange-700",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      icon: Users,
      timeline: "60 gün",
      requirements: [
        "Yönetim kurulu sunumunun hazırlanması",
        "Proje etkilerinin analizi",
        "Stratejik uyumun değerlendirilmesi",
        "Kaynak tahsisinin planlanması"
      ],
      stakeholders: ["Yönetim Kurulu", "Genel Sekreter", "Bölge Müdürü"],
      commonIssues: [
        "Stratejik uyumsuzluk",
        "Kaynak yetersizliği",
        "Öncelik sıralaması sorunları"
      ],
      nextSteps: [
        "Kurul kararının beklenmesi",
        "Ek bilgi taleplerinin karşılanması"
      ]
    },
    {
      id: 4,
      title: "Ajans Yönetim Kurulu Değerlendirmesi",
      subtitle: "Agency Management Board Evaluation",
      description: "Yönetim kurulu tarafından projelerin stratejik değerlendirmesi",
      color: "text-purple-700",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      icon: CheckCircle,
      timeline: "45 gün",
      requirements: [
        "Teknik değerlendirme raporunun hazırlanması",
        "Mali analiz ve risk değerlendirmesi",
        "Komite sunumunun gerçekleştirilmesi",
        "Nihai karar sürecinin tamamlanması"
      ],
      stakeholders: ["Değerlendirme Komitesi", "Teknik Uzmanlar", "Mali Müşavir"],
      commonIssues: [
        "Teknik yetersizlikler",
        "Mali uyumsuzluklar",
        "Risk faktörleri"
      ],
      nextSteps: [
        "Destek kararının bildirilmesi",
        "Sözleşme sürecinin başlatılması"
      ]
    },
    {
      id: 5,
      title: "Komite Değerlendirmesi ve Destek Kararı",
      subtitle: "Committee Evaluation & Support Decision",
      description: "Uzman komite tarafından nihai değerlendirme ve karar verme",
      color: "text-pink-700",
      bgColor: "bg-pink-50",
      borderColor: "border-pink-200",
      icon: Eye,
      timeline: "30 gün",
      requirements: [
        "Düzenli ilerleme raporlarının sunulması",
        "Mali harcamaların belgelendirilmesi",
        "Performans göstergelerinin takibi",
        "Ara değerlendirmelerin yapılması"
      ],
      stakeholders: ["Proje Yürütücüsü", "İzleme Ekibi", "Mali İşler"],
      commonIssues: [
        "Rapor gecikmeleri",
        "Hedef sapmaları",
        "Bütçe aşımları"
      ],
      nextSteps: [
        "Düzenli raporlama",
        "Gerekli düzeltmelerin yapılması"
      ]
    },
    {
      id: 6,
      title: "İzleme, Revizyon, Sonlandırma ve Tamamlama",
      subtitle: "Revision, Termination & Completion",
      description: "Proje sonuçlarının değerlendirilmesi ve sürecin tamamlanması",
      color: "text-gray-700",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      icon: Settings,
      timeline: "2-4 hafta",
      requirements: [
        "Nihai raporun hazırlanması",
        "Çıktıların değerlendirilmesi",
        "Mali kapanış işlemlerinin tamamlanması",
        "Sürdürülebilirlik planının sunulması"
      ],
      stakeholders: ["Proje Ekibi", "Değerlendirme Uzmanları", "Mali Kontrol"],
      commonIssues: [
        "Eksik çıktılar",
        "Mali uyumsuzluklar",
        "Sürdürülebilirlik sorunları"
      ],
      nextSteps: [
        "Proje kapanışının onaylanması",
        "Deneyim paylaşımı"
      ]
    }
  ];

  const ProcessStepCard = ({ step, index }: { step: ProcessStep; index: number }) => {
    const { ref, inView } = useInView({
      threshold: 0.3,
      triggerOnce: true,
    });

    const isExpanded = expandedStep === step.id;
    const isEven = index % 2 === 0;

    return (
      <div
        ref={ref}
        className={`relative ${inView ? 'animate-fade-in' : 'opacity-0'}`}
        style={{ animationDelay: `${index * 0.2}s` }}
      >
        {/* Connecting Line */}
        {index < processSteps.length - 1 && (
          <div className="hidden lg:block absolute top-1/2 left-full w-16 h-0.5 bg-gradient-to-r from-gray-300 to-gray-400 transform -translate-y-1/2 z-0">
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        )}

        <Card 
          className={`relative z-10 cursor-pointer transition-all duration-300 hover:shadow-xl border-2 ${step.borderColor} ${step.bgColor} group`}
          onClick={() => setExpandedStep(isExpanded ? null : step.id)}
        >
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Step Number & Icon */}
              <div className="relative">
                <div className={`w-16 h-16 rounded-full ${step.bgColor} border-2 ${step.borderColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className={`h-8 w-8 ${step.color}`} />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                  {step.id}
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-1">
                <h3 className={`font-bold text-lg ${step.color}`}>
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 font-medium">
                  {step.subtitle}
                </p>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-700 leading-relaxed">
                {step.description}
              </p>

              {/* Timeline Badge */}
              <Badge variant="outline" className={`${step.color} border-current`}>
                <Clock className="h-3 w-3 mr-1" />
                {step.timeline}
              </Badge>

              {/* Expand Button */}
              <Button
                variant="outline"
                size="sm"
                className={`mt-4 ${step.color} border-current hover:bg-current hover:text-white transition-colors`}
              >
                {isExpanded ? 'Daha Az Göster' : 'Detayları Görüntüle'}
              </Button>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Requirements */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-green-600" />
                      Gereksinimler
                    </h4>
                    <ul className="space-y-2">
                      {step.requirements.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Stakeholders */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      Paydaşlar
                    </h4>
                    <ul className="space-y-2">
                      {step.stakeholders.map((stakeholder, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                          {stakeholder}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Common Issues */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      Yaygın Sorunlar
                    </h4>
                    <ul className="space-y-2">
                      {step.commonIssues.map((issue, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Next Steps */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-purple-600" />
                      Sonraki Adımlar
                    </h4>
                    <ul className="space-y-2">
                      {step.nextSteps.map((nextStep, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                          {nextStep}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <MainNavbar />
      
      <StandardHero
        title="Başvuru Süreci"
        subtitle="Adım Adım Rehber"
        description="Destek programlarına başvuru sürecinin detaylı açıklaması ve her aşamada yapılması gerekenler"
        badge={{
          text: "Resmi Süreç Rehberi",
          icon: FileText
        }}
        gradient="blue"
      />

      {/* Process Overview */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Başvuru Süreci Genel Bakış
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Destek programlarına başvuru sürecinin 6 ana aşaması ve her aşamada dikkat edilmesi gereken önemli noktalar
            </p>
          </div>

          {/* Desktop Timeline */}
          <div className="hidden lg:block">
            <div className="grid grid-cols-3 gap-8 mb-16">
              {processSteps.slice(0, 3).map((step, index) => (
                <ProcessStepCard key={step.id} step={step} index={index} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-8">
              {processSteps.slice(3, 6).map((step, index) => (
                <ProcessStepCard key={step.id} step={step} index={index + 3} />
              ))}
            </div>
          </div>

          {/* Mobile/Tablet Vertical Timeline */}
          <div className="lg:hidden space-y-8">
            {processSteps.map((step, index) => (
              <ProcessStepCard key={step.id} step={step} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Detaylı Süreç Rehberi
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Başvuru sürecinin tüm detaylarını içeren kapsamlı rehberi indirin
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/90">
            <Download className="h-5 w-5 mr-2" />
            Süreç Rehberini İndir (PDF)
          </Button>
        </div>
      </section>
    </div>
  );
};

export default ApplicationProcess;