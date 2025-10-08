import { useNavigate } from "react-router-dom";
import MainNavbar from "@/components/MainNavbar";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, Search, Link as LinkIcon, Building2, MessageSquare } from "lucide-react";

const Start = () => {
  const navigate = useNavigate();

  const featureCards = [
    {
      icon: Calculator,
      title: "Teşvik Robotu",
      description: "Yatırımınız için alabileceğiniz teşvik miktarını hesaplayın",
      path: "/incentive-tools",
      gradient: "from-green-500 to-emerald-600",
    },
    {
      icon: Search,
      title: "Destek Arama",
      description: "Güncel destekleri inceleyin",
      path: "/searchsupport",
      gradient: "from-blue-500 to-cyan-600",
    },
    {
      icon: LinkIcon,
      title: "Tedarik Zinciri",
      description: "Yerli tedarikçilerle buluşun",
      path: "/tzy",
      gradient: "from-purple-500 to-violet-600",
    },
    {
      icon: Building2,
      title: "Yatırım Fırsatları",
      description: "Bölgesel yatırım fırsatlarını inceleyin",
      path: "/yatirim-firsatlari",
      gradient: "from-orange-500 to-amber-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <MainNavbar />
      
      {/* Hero Section */}
      <section className="relative py-16 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Teşvik ve Destek Platformu
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            İhtiyacınıza uygun bölümü seçerek devam edin
          </p>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featureCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card
                  key={card.title}
                  className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden"
                  onClick={() => navigate(card.path)}
                >
                  <CardContent className="p-6">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-xl mb-2">{card.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {card.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Expert Support Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-2xl mb-4">Uzman Desteği Alın</CardTitle>
              <CardDescription className="text-base mb-6 max-w-2xl mx-auto">
                Teşvik başvuru sürecinizde profesyonel destek almak için uzmanlarımızla iletişime geçin.
              </CardDescription>
              <Button
                size="lg"
                onClick={() => navigate("/qna")}
                className="shadow-lg hover:shadow-xl transition-all"
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                Soru Sor
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Start;
