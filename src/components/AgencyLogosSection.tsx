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

  return (
    <div className="w-full py-12 border-t border-slate-200">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
          {agencies.map((agency) => (
            <div
              key={agency.name}
              onClick={() => handleAgencyClick(agency.website)}
              className="flex items-center justify-center p-4 rounded-lg hover:bg-slate-50 transition-all duration-200 cursor-pointer group"
              title={agency.fullName}
            >
              <div className="w-full h-16 flex items-center justify-center grayscale group-hover:grayscale-0 opacity-60 group-hover:opacity-100 transition-all duration-200">
                <img
                  src={agency.logo}
                  alt={agency.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AgencyLogosSection;
