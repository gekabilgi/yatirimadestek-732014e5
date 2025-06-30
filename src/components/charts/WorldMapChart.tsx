
import React from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';

const geoUrl = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";

interface CountryData {
  [countryName: string]: number;
}

interface WorldMapChartProps {
  data: CountryData;
  isLoading?: boolean;
}

// Country name mapping from Google Analytics to GeoJSON
const countryNameMapping: { [key: string]: string } = {
  'United States': 'United States of America',
  'South Korea': 'Korea',
  'Czech Republic': 'Czechia',
  'Russia': 'Russian Federation',
  'Tanzania': 'United Republic of Tanzania',
  'Venezuela': 'Venezuela (Bolivarian Republic of)',
  'Syria': 'Syrian Arab Republic',
  'Iran': 'Iran (Islamic Republic of)',
  'Vietnam': 'Viet Nam',
  'Bolivia': 'Bolivia (Plurinational State of)',
  'Moldova': 'Republic of Moldova',
  'North Macedonia': 'Macedonia',
  'Democratic Republic of the Congo': 'Democratic Republic of the Congo',
  'Republic of the Congo': 'Congo',
  'Laos': "Lao People's Democratic Republic",
  'Myanmar': 'Myanmar',
  'Palestine': 'Palestine',
  'Brunei': 'Brunei Darussalam',
  'East Timor': 'Timor-Leste',
  'Eswatini': 'eSwatini',
  'Ivory Coast': "Côte d'Ivoire",
  'Cape Verde': 'Cabo Verde',
  'Micronesia': 'Micronesia (Federated States of)',
};

export const WorldMapChart: React.FC<WorldMapChartProps> = ({ data, isLoading = false }) => {
  console.log('WorldMapChart received data:', data);
  
  // Normalize country names for mapping
  const normalizedData = React.useMemo(() => {
    if (!data) return {};
    
    const normalized: CountryData = {};
    Object.entries(data).forEach(([country, value]) => {
      const mappedCountry = countryNameMapping[country] || country;
      normalized[mappedCountry] = value;
    });
    
    console.log('Normalized country data:', normalized);
    return normalized;
  }, [data]);

  // Calculate the maximum visits for color scaling
  const maxVisits = Math.max(...Object.values(normalizedData || {}));
  console.log('Max visits for scaling:', maxVisits);
  
  // Color intensity function
  const getCountryColor = (countryName: string) => {
    if (!normalizedData || !normalizedData[countryName]) {
      return '#f8fafc'; // Very light gray for no data
    }
    
    const visits = normalizedData[countryName];
    const intensity = visits / maxVisits;
    
    // Blue gradient based on intensity
    if (intensity >= 0.8) return '#1e40af'; // Dark blue
    if (intensity >= 0.6) return '#3b82f6'; // Blue
    if (intensity >= 0.4) return '#60a5fa'; // Light blue
    if (intensity >= 0.2) return '#93c5fd'; // Lighter blue
    return '#dbeafe'; // Very light blue
  };

  const getTooltipContent = (geo: any) => {
    const countryName = geo.properties.NAME;
    const visits = normalizedData?.[countryName] || 0;
    return visits > 0 ? `${countryName}: ${visits} kullanıcı` : `${countryName}: Veri yok`;
  };

  if (isLoading) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center">
        <Skeleton className="w-full h-full rounded-lg" />
      </div>
    );
  }

  const hasData = normalizedData && Object.keys(normalizedData).length > 0;
  console.log('Has data:', hasData);

  return (
    <div className="w-full">
      <TooltipProvider>
        <div className="relative">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 120,
              center: [0, 20]
            }}
            width={800}
            height={400}
            className="w-full h-auto border rounded-lg bg-slate-50"
          >
            <ZoomableGroup>
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Tooltip key={geo.rsmKey}>
                      <TooltipTrigger asChild>
                        <Geography
                          geography={geo}
                          fill={getCountryColor(geo.properties.NAME)}
                          stroke="#e2e8f0"
                          strokeWidth={0.5}
                          style={{
                            default: {
                              outline: "none",
                            },
                            hover: {
                              fill: "#1e293b",
                              outline: "none",
                              cursor: "pointer",
                            },
                            pressed: {
                              fill: "#0f172a",
                              outline: "none",
                            },
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{getTooltipContent(geo)}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>
        </div>
      </TooltipProvider>

      {/* Legend */}
      {hasData && maxVisits > 0 && (
        <div className="mt-4 flex justify-center space-x-4 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-slate-200 rounded"></div>
            <span>Veri yok</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-100 rounded"></div>
            <span>Az (1-{Math.round(maxVisits * 0.2)})</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-300 rounded"></div>
            <span>Orta ({Math.round(maxVisits * 0.2)}-{Math.round(maxVisits * 0.6)})</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Çok ({Math.round(maxVisits * 0.6)}-{Math.round(maxVisits * 0.8)})</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-700 rounded"></div>
            <span>En çok ({Math.round(maxVisits * 0.8)}+)</span>
          </div>
        </div>
      )}

      {/* Top Countries List */}
      {hasData && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">En Çok Kullanıcı Olan Ülkeler</h4>
          <div className="grid grid-cols-2 gap-2 max-h-24 overflow-y-auto">
            {Object.entries(normalizedData)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 8)
              .map(([country, users]) => (
                <div key={country} className="flex justify-between items-center text-xs p-2 bg-white rounded border">
                  <span className="font-medium truncate">{country}</span>
                  <span className="text-blue-600 font-bold ml-2">{users}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* No Data Message */}
      {!hasData && (
        <div className="mt-4 text-center text-gray-500 text-sm">
          Henüz ülke verisi bulunmuyor
        </div>
      )}
    </div>
  );
};
