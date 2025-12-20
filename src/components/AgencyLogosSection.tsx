import React from "react";

interface Agency {
  name: string;
  fullName: string;
  logo: string;
  website: string;
}

const agencies: Agency[] = [
  {
    name: "AHİKA",
    fullName: "Ahiler Kalkınma Ajansı",
    logo: "/img/agencies/ahika.png",
    website: "http://www.ahika.gov.tr",
  },
  {
    name: "ANKARAKA",
    fullName: "Ankara Kalkınma Ajansı",
    logo: "/img/agencies/ankaraka.png",
    website: "http://www.ankaraka.org.tr",
  },
  {
    name: "BAKA",
    fullName: "Batı Akdeniz Kalkınma Ajansı",
    logo: "/img/agencies/baka.png",
    website: "http://www.baka.gov.tr",
  },
  {
    name: "BAKKA",
    fullName: "Batı Karadeniz Kalkınma Ajansı",
    logo: "/img/agencies/bakka.png",
    website: "http://www.bakka.gov.tr",
  },
  {
    name: "BEBKA",
    fullName: "Bursa Eskişehir Bilecik Kalkınma Ajansı",
    logo: "/img/agencies/bebka.png",
    website: "http://www.bebka.org.tr",
  },
  {
    name: "ÇKA",
    fullName: "Çukurova Kalkınma Ajansı",
    logo: "/img/agencies/cka.png",
    website: "http://www.cka.org.tr",
  },
  {
    name: "DAKA",
    fullName: "Doğu Anadolu Kalkınma Ajansı",
    logo: "/img/agencies/daka.png",
    website: "http://www.daka.org.tr",
  },
  {
    name: "DİKA",
    fullName: "Dicle Kalkınma Ajansı",
    logo: "/img/agencies/dika.png",
    website: "http://www.dika.org.tr",
  },
  {
    name: "DOĞAKA",
    fullName: "Doğu Akdeniz Kalkınma Ajansı",
    logo: "/img/agencies/dogaka.png",
    website: "https://www.dogaka.gov.tr",
  },
  {
    name: "DOKA",
    fullName: "Doğu Karadeniz Kalkınma Ajansı",
    logo: "/img/agencies/doka.png",
    website: "http://www.doka.org.tr",
  },
  {
    name: "MARKA",
    fullName: "Doğu Marmara Kalkınma Ajansı",
    logo: "/img/agencies/marka.png",
    website: "http://www.marka.org.tr",
  },
  { name: "FKA", fullName: "Fırat Kalkınma Ajansı", logo: "/img/agencies/fka.png", website: "http://www.fka.gov.tr" },
  {
    name: "GEKA",
    fullName: "Güney Ege Kalkınma Ajansı",
    logo: "/img/agencies/geka.png",
    website: "http://www.geka.gov.tr",
  },
  {
    name: "GMKA",
    fullName: "Güney Marmara Kalkınma Ajansı",
    logo: "/img/agencies/gmka.png",
    website: "http://www.gmka.gov.tr",
  },
  {
    name: "İKA",
    fullName: "İpekyolu Kalkınma Ajansı",
    logo: "/img/agencies/ika.png",
    website: "http://www.ika.org.tr",
  },
  {
    name: "İSTKA",
    fullName: "İstanbul Kalkınma Ajansı",
    logo: "/img/agencies/istka.png",
    website: "http://www.istka.org.tr",
  },
  {
    name: "İZKA",
    fullName: "İzmir Kalkınma Ajansı",
    logo: "/img/agencies/izka.png",
    website: "http://www.izka.org.tr",
  },
  {
    name: "KARACADAĞ",
    fullName: "Karacadağ Kalkınma Ajansı",
    logo: "/img/agencies/karacadag.png",
    website: "http://www.karacadag.gov.tr",
  },
  {
    name: "KUZKA",
    fullName: "Kuzey Anadolu Kalkınma Ajansı",
    logo: "/img/agencies/kuzka.png",
    website: "http://www.kuzka.gov.tr",
  },
  {
    name: "KUDAKA",
    fullName: "Kuzeydoğu Anadolu Kalkınma Ajansı",
    logo: "/img/agencies/kudaka.png",
    website: "http://kudaka.ka.gov.tr",
  },
  {
    name: "MEVKA",
    fullName: "Mevlana Kalkınma Ajansı",
    logo: "/img/agencies/mevka.png",
    website: "http://www.mevka.org.tr",
  },
  {
    name: "ORAN",
    fullName: "Orta Anadolu Kalkınma Ajansı",
    logo: "/img/agencies/oran.png",
    website: "http://www.oran.org.tr",
  },
  {
    name: "OKA",
    fullName: "Orta Karadeniz Kalkınma Ajansı",
    logo: "/img/agencies/oka.png",
    website: "http://oka.ka.gov.tr",
  },
  {
    name: "SERKA",
    fullName: "Serhat Kalkınma Ajansı",
    logo: "/img/agencies/serka.png",
    website: "http://www.serka.gov.tr",
  },
  {
    name: "TRAKYAKA",
    fullName: "Trakya Kalkınma Ajansı",
    logo: "/img/agencies/trakyaka.png",
    website: "http://www.trakyaka.org.tr",
  },
  {
    name: "ZAFER",
    fullName: "Zafer Kalkınma Ajansı",
    logo: "/img/agencies/zafer.png",
    website: "http://www.zafer.gov.tr",
  },
];

const AgencyLogosSection = () => {
  const handleAgencyClick = (website: string) => {
    window.open(website, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="w-full py-16 bg-muted/30 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">Kalkınma Ajansları</h2>

        <div className="relative">
          {/* The track must be as wide as its content: w-max + no wrap */}
          <div className="flex w-max flex-nowrap gap-8 animate-scroll will-change-transform">
            {/* First copy */}
            {agencies.map((agency, i) => (
              <button
                key={`a-${agency.name}-${i}`}
                onClick={() => handleAgencyClick(agency.website)}
                className="flex-shrink-0 flex items-center justify-center w-40 h-24 p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
                title={agency.fullName}
                aria-label={agency.fullName}
              >
                <img
                  src={agency.logo}
                  alt={agency.fullName}
                  className="max-w-full max-h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
                />
              </button>
            ))}

            {/* Second copy (aria-hidden for accessibility) */}
            {agencies.map((agency, i) => (
              <button
                key={`b-${agency.name}-${i}`}
                onClick={() => handleAgencyClick(agency.website)}
                className="flex-shrink-0 flex items-center justify-center w-40 h-24 p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
                title={agency.fullName}
                aria-hidden="true"
                tabIndex={-1}
              >
                <img
                  src={agency.logo}
                  alt=""
                  className="max-w-full max-h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(calc(-50%)); }
        }
        .animate-scroll {
          animation: scroll 50s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-scroll { animation: none; transform: none; }
        }
      `}</style>
    </section>
  );
};

export default AgencyLogosSection;
