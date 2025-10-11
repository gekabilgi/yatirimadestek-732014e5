import React from "react";

interface Agency {
  name: string;
  fullName: string;
  logo: string;
  website: string;
}

const agencies: Agency[] = [
  // ... your agencies exactly as you have them ...
];

const AgencyLogosSection = () => {
  const handleAgencyClick = (website: string) => {
    window.open(website, "_blank", "noopener,noreferrer");
  };

  return (
    <section className="w-full py-16 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4">
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
          animation: scroll 40s linear infinite;
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
