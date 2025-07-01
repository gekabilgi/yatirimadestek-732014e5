
import React from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';

const geoUrl =
  'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson';

interface CountryData {
  [countryName: string]: number;
}

interface WorldMapChartProps {
  data: CountryData;
  isLoading?: boolean;
}

// Mapping from Google Analytics country names to GeoJSON country names
const countryNameMapping: { [key: string]: string } = {
  'Türkiye': 'Turkey',
  'United States': 'United States of America',
  'USA': 'United States of America',
  'Spain': 'Spain',
  'Singapore': 'Singapore',
  'Germany': 'Germany',
  'France': 'France',
  'United Kingdom': 'United Kingdom',
  'UK': 'United Kingdom',
  'Russia': 'Russia',
  'China': 'China',
  'Japan': 'Japan',
  'India': 'India',
  'Brazil': 'Brazil',
  'Canada': 'Canada',
  'Australia': 'Australia',
  'Italy': 'Italy',
  'Netherlands': 'Netherlands',
  'South Korea': 'South Korea',
  'Mexico': 'Mexico',
  'Argentina': 'Argentina',
  'South Africa': 'South Africa',
  'Saudi Arabia': 'Saudi Arabia',
  'United Arab Emirates': 'United Arab Emirates',
  'Egypt': 'Egypt',
  'Nigeria': 'Nigeria',
  'Kenya': 'Kenya',
  'Morocco': 'Morocco',
  'Algeria': 'Algeria',
  'Tunisia': 'Tunisia',
  'Libya': 'Libya',
  'Sudan': 'Sudan',
  'Ethiopia': 'Ethiopia',
  'Ghana': 'Ghana',
  'Cameroon': 'Cameroon',
  'Uganda': 'Uganda',
  'Tanzania': 'Tanzania',
  'Zimbabwe': 'Zimbabwe',
  'Zambia': 'Zambia',
  'Botswana': 'Botswana',
  'Namibia': 'Namibia',
  'Angola': 'Angola',
  'Democratic Republic of the Congo': 'Democratic Republic of the Congo',
  'Republic of the Congo': 'Republic of the Congo',
  'Central African Republic': 'Central African Republic',
  'Chad': 'Chad',
  'Niger': 'Niger',
  'Mali': 'Mali',
  'Burkina Faso': 'Burkina Faso',
  'Senegal': 'Senegal',
  'Guinea': 'Guinea',
  'Sierra Leone': 'Sierra Leone',
  'Liberia': 'Liberia',
  'Côte d\'Ivoire': 'Côte d\'Ivoire',
  'Ivory Coast': 'Côte d\'Ivoire',
  'Togo': 'Togo',
  'Benin': 'Benin',
  'Gabon': 'Gabon',
  'Equatorial Guinea': 'Equatorial Guinea',
  'São Tomé and Príncipe': 'São Tomé and Príncipe',
  'Cape Verde': 'Cape Verde',
  'Gambia': 'Gambia',
  'Guinea-Bissau': 'Guinea-Bissau',
  'Mauritania': 'Mauritania',
  'Western Sahara': 'Western Sahara',
  'Djibouti': 'Djibouti',
  'Eritrea': 'Eritrea',
  'Somalia': 'Somalia',
  'Comoros': 'Comoros',
  'Madagascar': 'Madagascar',
  'Mauritius': 'Mauritius',
  'Seychelles': 'Seychelles',
  'Réunion': 'Réunion',
  'Mayotte': 'Mayotte'
};

export const WorldMapChart: React.FC<WorldMapChartProps> = ({
  data,
  isLoading = false,
}) => {
  // Normalize country data using mapping
  const normalizedData = React.useMemo(() => {
    if (!data || Object.keys(data).length === 0) return {};

    console.log('Original data from Analytics:', data);

    const normalized: CountryData = {};
    Object.entries(data).forEach(([country, value]) => {
      if (!country || typeof country !== 'string' || country === '(not set)') return;

      // Use mapping if available, otherwise use original name
      const mappedName = countryNameMapping[country] || country;
      normalized[mappedName] = value;
      
      console.log(`Mapping: "${country}" -> "${mappedName}" (${value} users)`);
    });

    console.log('Normalized data for map:', normalized);
    return normalized;
  }, [data]);

  const maxVisits = Math.max(...Object.values(normalizedData || {}));
  console.log('Max visits for color scaling:', maxVisits);

  const getCountryColor = (geo: any) => {
    const countryName = geo.properties.NAME;
    const visits = normalizedData?.[countryName] || 0;

    console.log(`Checking color for country: ${countryName}, visits: ${visits}`);

    if (visits === 0) {
      return '#f8fafc'; // Light gray for no data
    }

    const intensity = visits / maxVisits;
    console.log(`Country: ${countryName}, Visits: ${visits}, Intensity: ${intensity}, MaxVisits: ${maxVisits}`);

    // Color scale from light blue to dark blue
    if (intensity >= 0.8) return '#1e40af'; // Dark blue
    if (intensity >= 0.6) return '#3b82f6'; // Medium-dark blue
    if (intensity >= 0.4) return '#60a5fa'; // Medium blue
    if (intensity >= 0.2) return '#93c5fd'; // Light-medium blue
    return '#dbeafe'; // Light blue
  };

  const getTooltipContent = (geo: any) => {
    const countryName = geo.properties.NAME;
    const visits = normalizedData?.[countryName] || 0;
    return visits > 0
      ? `${countryName}: ${visits} kullanıcı`
      : `${countryName}: Veri yok`;
  };

  if (isLoading) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center">
        <Skeleton className="w-full h-full rounded-lg" />
      </div>
    );
  }

  const hasData = normalizedData && Object.keys(normalizedData).length > 0;

  return (
    <div className="w-full">
      <TooltipProvider>
        <div className="relative">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 120,
              center: [0, 20],
            }}
            width={800}
            height={400}
            className="w-full h-auto border rounded-lg bg-slate-50"
          >
            <ZoomableGroup>
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const fillColor = getCountryColor(geo);
                    return (
                      <Tooltip key={geo.rsmKey}>
                        <TooltipTrigger asChild>
                          <Geography
                            geography={geo}
                            fill={fillColor}
                            stroke="#e2e8f0"
                            strokeWidth={0.5}
                            style={{
                              default: { outline: 'none' },
                              hover: {
                                fill: '#1e293b',
                                outline: 'none',
                                cursor: 'pointer',
                              },
                              pressed: { fill: '#0f172a', outline: 'none' },
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{getTooltipContent(geo)}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>
        </div>
      </TooltipProvider>

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

      {hasData && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            En Çok Kullanıcı Olan Ülkeler
          </h4>
          <div className="grid grid-cols-2 gap-2 max-h-24 overflow-y-auto">
            {Object.entries(normalizedData)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 8)
              .map(([country, users]) => (
                <div
                  key={country}
                  className="flex justify-between items-center text-xs p-2 bg-white rounded border"
                >
                  <span className="font-medium truncate">{country}</span>
                  <span className="text-blue-600 font-bold ml-2">{users}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {!hasData && (
        <div className="mt-4 text-center text-gray-500 text-sm">
          Henüz ülke verisi bulunmuyor
        </div>
      )}
    </div>
  );
};
