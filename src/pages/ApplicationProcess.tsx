import React, { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import MainNavbar from '@/components/MainNavbar';
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
      title: "Başvuruların Alınması",
      subtitle: "Call Announcement & Application",
      description: "Başvuruların yerelkalkinmahamlesi.sanayi.gov.tr (Portal) web adresinden alınması (Başvuru aşamasında herhangi bir belge talep edilmemektedir. E-TÜYS firma kayıt yeterlidir.)",
      color: "text-green-700",
      bgColor: "bg-green-100",
      borderColor: "border-green-300",
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
      title: "Başvuruların Değerlendirilmesi ve Revizyonu",
      subtitle: "Pre-Evaluation & Revision",
      description: "Ajans tarafından yapılacak inceleme sonucunda eksik veya hatalı bilgilerden dolayı düzeltme gereken başvurular için revizyon yapılması",
      color: "text-blue-700",
      bgColor: "bg-blue-100",
      borderColor: "border-blue-300",
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
      title: "Kesin Başvurunun Alınması",
      subtitle: "Final Application Submission",
      description: "İnceleme sonucunda onaylanan başvurulara ait fizibilite raporlarının ve diğer ilgili belgelerin sisteme yüklenmesi",
      color: "text-orange-700",
      bgColor: "bg-orange-100",
      borderColor: "border-orange-300",
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
      title: "Ajans Yönetim Kurulunun Değerlendirmesi",
      subtitle: "Agency Management Board Evaluation",
      description: "Fizibilitesi ve diğer ilgili belgeleri başarıyla sisteme yüklenen projelerin Ajans Yönetim Kurulu tarafından değerlendirilmesi ve nihai karar için Komiteye sunulması",
      color: "text-purple-700",
      bgColor: "bg-purple-100",
      borderColor: "border-purple-300",
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
      title: "Komitenin Değerlendirmesi ve Destek Kararı Alması",
      subtitle: "Committee Evaluation & Support Decision",
      description: "Komite değerlendirmesi sonucunda destek almaya hak kazanan projelerin Teşvik Uygulama ve Yabancı Sermaye Genel Müdürlüğüne (TUYSGM) iletilmesi",
      color: "text-pink-700",
      bgColor: "bg-pink-100",
      borderColor: "border-pink-300",
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
      title: "Yatırım Teşvik Belgesinin Düzenlenmesi",
      subtitle: "Investment Incentive Certificate Issuance",
      description: "Komite değerlendirmesi sonucunda destek almaya hak kazanan projeler için TUYSGM tarafından Elektronik Teşvik Uygulama ve Yabancı Sermaye Bilgi Sistemi (E-TÜYS) üzerinden belge düzenlenmesi",
      color: "text-gray-700",
      bgColor: "bg-gray-100",
      borderColor: "border-gray-300",
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

    return (
      <div
        ref={ref}
        className={`relative ${inView ? 'animate-fade-in' : 'opacity-0'}`}
        style={{ animationDelay: `${index * 0.2}s` }}
      >
        <Card 
          className={`relative z-10 cursor-pointer transition-all duration-300 hover:shadow-xl border-2 ${step.borderColor} ${step.bgColor} group min-h-[280px]`}
          onClick={() => setExpandedStep(isExpanded ? null : step.id)}
        >
          <CardContent className="p-6">
            <div className="flex flex-col h-full">
              {/* Step Number Circle */}
              <div className="relative mb-4">
                <div className={`w-16 h-16 rounded-full ${step.bgColor} border-2 ${step.borderColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 mx-auto`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl`} style={{
                    backgroundColor: step.id === 1 ? '#22c55e' : 
                                   step.id === 2 ? '#3b82f6' : 
                                   step.id === 3 ? '#f97316' : 
                                   step.id === 4 ? '#a855f7' : 
                                   step.id === 5 ? '#ec4899' : '#6b7280'
                  }}>
                    {step.id}
                  </div>
                </div>
              </div>

              {/* Title & Description */}
              <div className="text-center flex-1 flex flex-col">
                <h3 className={`font-bold text-lg mb-2 ${step.color}`}>
                  {step.title}
                </h3>
                
                <p className="text-sm text-gray-700 leading-relaxed mb-4 flex-1">
                  {step.description}
                </p>

                {/* Timeline Badge */}
                <div className="flex justify-center items-center gap-2 mt-auto">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <Badge variant="outline" className={`${step.color} border-current text-sm px-3 py-1`}>
                    {step.timeline}
                  </Badge>
                </div>
              </div>
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
    <div className="min-h-screen bg-white">
      <MainNavbar />
      
      {/* Official Government Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Ministry Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="border-l-2 border-white/30 pl-4">
                <div className="text-sm font-medium opacity-90">T.C. SANAYİ VE</div>
                <div className="text-sm font-medium opacity-90">TEKNOLOJİ BAKANLIĞI</div>
              </div>
              <div className="bg-green-500 text-white px-3 py-1 rounded text-sm font-bold">
                #YEREL<br/>KALKINMA<br/>HAMLESİ
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold">Yerel Kalkınma Hamlesi</h1>
              <h2 className="text-2xl font-semibold">Başvuru Süreci</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Process Flow */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Row - Steps 1, 2, 3 */}
          <div className="relative mb-16">
            {/* Connecting Line */}
            <div className="hidden lg:block absolute top-20 left-0 right-0 h-1 bg-gray-300 z-0"></div>
            
            <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-8 z-10">
              {processSteps.slice(0, 3).map((step, index) => (
                <div key={step.id} className="relative">
                  <ProcessStepCard step={step} index={index} />
                  {/* Arrow for desktop */}
                  {index < 2 && (
                    <div className="hidden lg:block absolute top-20 -right-4 z-20">
                      <ArrowRight className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Curved Connector */}
          <div className="hidden lg:block relative mb-16">
            <svg className="w-full h-24" viewBox="0 0 800 100" fill="none">
              <path 
                d="M 750 20 Q 400 80 50 20" 
                stroke="#d1d5db" 
                strokeWidth="2" 
                fill="none"
                className="animate-pulse"
              />
            </svg>
          </div>

          {/* Bottom Row - Steps 4, 5, 6 */}
          <div className="relative">
            {/* Connecting Line */}
            <div className="hidden lg:block absolute top-20 left-0 right-0 h-1 bg-gray-300 z-0"></div>
            
            <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-8 z-10">
              {processSteps.slice(3, 6).map((step, index) => (
                <div key={step.id} className="relative">
                  <ProcessStepCard step={step} index={index + 3} />
                  {/* Arrow for desktop */}
                  {index < 2 && (
                    <div className="hidden lg:block absolute top-20 -right-4 z-20">
                      <ArrowRight className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Timeline */}
          <div className="lg:hidden space-y-8 mt-16">
            {processSteps.map((step, index) => (
              <div key={step.id} className="relative">
                <ProcessStepCard step={step} index={index} />
                {index < processSteps.length - 1 && (
                  <div className="flex justify-center my-4">
                    <div className="w-0.5 h-8 bg-gray-300"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Detaylı Süreç Rehberi
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Başvuru sürecinin tüm detaylarını içeren kapsamlı rehberi indirin
          </p>
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-5 w-5 mr-2" />
            Süreç Rehberini İndir (PDF)
          </Button>
        </div>
      </section>
    </div>
  );
};

export default ApplicationProcess;