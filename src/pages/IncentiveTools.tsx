import React, { useState, useEffect } from "react";
import { Search, Calculator, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MainNavbar from "@/components/MainNavbar";
import StandardHero from "@/components/StandardHero";
import UnifiedIncentiveQuery from "@/components/UnifiedIncentiveQuery";
import IncentiveTypeCalculator from "@/components/IncentiveTypeCalculator";
import { useSearchParams } from "react-router-dom";
import { useActivityTracking } from "@/hooks/useActivityTracking";

const IncentiveTools = () => {
  const [searchParams] = useSearchParams();
  const moduleParam = searchParams.get("module") as "query" | "calculator";
  const [activeModule, setActiveModule] = useState<"query" | "calculator">(moduleParam || "query");
  const { trackPageView } = useActivityTracking();

  useEffect(() => {
    if (moduleParam === "query" || moduleParam === "calculator") {
      setActiveModule(moduleParam);
    }
  }, [moduleParam]);

  useEffect(() => {
    // Track incentive tools page visit
    trackPageView("/incentive-tools");
  }, [trackPageView]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 overflow-x-hidden">
      <MainNavbar />

      <StandardHero
        title="9903 Yatırım Teşvik Sistemi"
        description="Teşvik araçlarını kullanarak yeni teşvik sisteminde size uygun olabilecek destekleri bulun, bilgi amaçlı sunulan teşvik tutarlarını hesaplayın."
        badge={{
          text: "Türkiye Yüzyılı Kalkınma Hamlesi",
          icon: TrendingUp,
        }}
        compact
      />

      {/* Incentive Tools Section */}
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 sm:py-6">
        <div className="mb-6">
          <Card className="card-elevated border-0 animate-fade-in">
            <CardHeader className="pb-3 pt-3 px-4 sm:px-6">
              <CardTitle className="text-center text-xl sm:text-2xl lg:text-3xl font-bold">
                9903 | Teşvik Robotu
              </CardTitle>
              <p className="text-center text-sm sm:text-base lg:text-lg text-gray-600 mt-2">
                İhtiyacınıza uygun modülü seçerek işlemlerinizi gerçekleştirebilirsiniz.
              </p>
            </CardHeader>
            <CardContent className="pt-4 px-4 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-6 justify-center mb-6 sm:mb-10">
                <Button
                  variant={activeModule === "query" ? "default" : "outline"}
                  onClick={() => setActiveModule("query")}
                  className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 text-sm sm:text-base lg:text-lg font-semibold rounded-xl transition-all duration-300 w-full sm:w-auto ${
                    activeModule === "query"
                      ? "shadow-lg hover:shadow-xl"
                      : "hover:bg-primary/5 hover:border-primary/30"
                  }`}
                >
                  <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-center">Sektör Bazlı Teşvik Sorgusu</span>
                </Button>
                <Button
                  variant={activeModule === "calculator" ? "default" : "outline"}
                  onClick={() => setActiveModule("calculator")}
                  className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 text-sm sm:text-base lg:text-lg font-semibold rounded-xl transition-all duration-300 w-full sm:w-auto ${
                    activeModule === "calculator"
                      ? "shadow-lg hover:shadow-xl"
                      : "hover:bg-primary/5 hover:border-primary/30"
                  }`}
                >
                  <Calculator className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-center">Türkiye Yüzyılı Teşvikleri Hesaplama</span>
                </Button>
              </div>

              <div className="w-full animate-fade-in">
                {activeModule === "query" && (
                  <div>
                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mb-6 sm:mb-8 justify-center text-center">
                      <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                        <Search className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                      </div>
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">
                        Yüksek Teknoloji, Orta-Yüksek Teknoloji, Hedef Sektörler, Öncelikli Sektörler Teşvik Sorgusu
                      </h2>
                    </div>

                    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8">
                      <UnifiedIncentiveQuery />
                    </div>
                  </div>
                )}

                {activeModule === "calculator" && (
                  <div>
                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mb-6 sm:mb-8 justify-center text-center">
                      <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                        <Calculator className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                      </div>
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">
                        Teknoloji Hamlesi, Yerel Kalkınma Hamlesi ve Stratejik Hamle Kapsamında Teşvik Hesaplama
                      </h2>
                    </div>
                    <IncentiveTypeCalculator />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default IncentiveTools;
