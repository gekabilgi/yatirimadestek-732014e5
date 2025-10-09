import React from 'react';

interface Agency {
  name: string;
  fullName: string;
  logo: string;
  website: string;
}

const agencies: Agency[] = [
  { name: 'AHKA', fullName: 'Ahiler Kalkınma Ajansı', logo: '/img/image.png', website: 'https://www.ahika.gov.tr' },
  { name: 'BAKKA', fullName: 'Batı Akdeniz Kalkınma Ajansı', logo: '/img/image.png', website: 'https://www.bakka.gov.tr' },
  { name: 'BEBKA', fullName: 'Bursa Eskişehir Bilecik Kalkınma Ajansı', logo: '/img/image.png', website: 'https://www.bebka.org.tr' },
  { name: 'BİKA', fullName: 'Batı Karadeniz Kalkınma Ajansı', logo: '/img/image.png', website: 'https://www.bka.org.tr' },
  { name: 'DİKA', fullName: 'Dicle Kalkınma Ajansı', logo: '/img/image.png', website: 'https://www.dika.org.tr' },
  { name: 'DOĞAKA', fullName: 'Doğu Akdeniz Kalkınma Ajansı', logo: '/img/image.png', website: 'https://www.dogaka.gov.tr' },
  { name: 'DOKA', fullName: 'Doğu Karadeniz Kalkınma Ajansı', logo: '/img/image.png', website: 'https://www.doka.org.tr' },
  { name: 'FKA', fullName: 'Fırat Kalkınma Ajansı', logo: '/img/image.png', website: 'https://www.fka.gov.tr' },
  { name: 'GEKA', fullName: 'Güney Ege Kalkınma Ajansı', logo: '/img/image.png', website: 'https://www.geka.gov.tr' },
  { name: 'GMKA', fullName: 'Güney Marmara Kalkınma Ajansı', logo: '/img/image.png', website: 'https://www.gmka.gov.tr' },
  { name: 'İKA', fullName: 'İzmir Kalkınma Ajansı', logo: '/img/image.png', website: 'https://www.izka.org.tr' },
  { name: 'İSTKA', fullName: 'İstanbul Kalkınma Ajansı', logo: '/img/image.png', website: 'https://www.istka.org.tr' },
];

const AgencyLogosSection = () => {
  const handleAgencyClick = (website: string) => {
    window.open(website, '_blank', 'noopener,noreferrer');
  };

  // Duplicate agencies for seamless loop
  const duplicatedAgencies = [...agencies, ...agencies];

  return (
    <section className="w-full py-16 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">
          İşbirliği İçinde Olduğumuz Kurumlar
        </h2>
        
        <div className="relative">
          <div className="flex gap-8 animate-scroll">
            {duplicatedAgencies.map((agency, index) => (
              <div
                key={`${agency.name}-${index}`}
                onClick={() => handleAgencyClick(agency.website)}
                className="flex-shrink-0 flex items-center justify-center w-40 h-24 p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
                title={agency.fullName}
              >
                <img
                  src={agency.logo}
                  alt={agency.fullName}
                  className="max-w-full max-h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-scroll {
          animation: scroll 40s linear infinite;
        }
        
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};

export default AgencyLogosSection;
