
import React from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
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

// Enhanced mapping from Google Analytics country names to GeoJSON country names
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
  'Mayotte': 'Mayotte',
  'Republic of Singapore': 'Singapore'
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

  const getCountryName = (geo: any) => {
    // Try different possible property names for country name in order of preference
    const possibleNames = [
      geo.properties?.name, 
      geo.properties?.NAME,
      geo.properties?.NAME_EN,
      geo.properties?.ADMIN,
      geo.properties?.sovereignt,
      geo.properties?.NAME_LONG,
      geo.properties?.BRK_NAME,
      geo.properties?.NAME_SORT,
      geo.properties?.SUBUNIT,
      geo.properties?.NAME_CIAWF
    ];
    
    for (const name of possibleNames) {
      if (name && typeof name === 'string' && name.trim() !== '') {
        return name.trim();
      }
    }
    
    console.log('No valid country name found in properties:', geo.properties);
    return 'Unknown';
  };

  const getCountryVisits = (geoCountryName: string) => {
    console.log(`\n=== Matching country: "${geoCountryName}"`);
    
    // First, try direct match with normalized data
    let visits = normalizedData?.[geoCountryName] || 0;
    
    if (visits > 0) {
      console.log(`✓ Direct match found for ${geoCountryName}: ${visits} visits`);
      return visits;
    }

    // Check original data for exact matches
    if (data?.[geoCountryName]) {
      visits = data[geoCountryName];
      console.log(`✓ Original data match found for ${geoCountryName}: ${visits} visits`);
      return visits;
    }

    // USA variations - check multiple possible GeoJSON names
    if (geoCountryName === 'United States of America' || 
        geoCountryName === 'United States' || 
        geoCountryName === 'USA' || 
        geoCountryName === 'US' ||
        geoCountryName === 'America') {
      visits = data?.['United States'] || normalizedData?.['United States of America'] || 0;
      if (visits > 0) {
        console.log(`✓ USA match found for ${geoCountryName}: ${visits} visits`);
        return visits;
      }
    }

    // Turkey variations
    if (geoCountryName === 'Turkey' || geoCountryName === 'Türkiye') {
      visits = data?.['Türkiye'] || normalizedData?.['Turkey'] || 0;
      if (visits > 0) {
        console.log(`✓ Turkey match found for ${geoCountryName}: ${visits} visits`);
        return visits;
      }
    }

    // Singapore variations - check all possible names
    if (geoCountryName === 'Singapore' || 
        geoCountryName === 'Republic of Singapore' ||
        geoCountryName === 'SGP' ||
        geoCountryName.toLowerCase().includes('singapore')) {
      visits = data?.['Singapore'] || normalizedData?.['Singapore'] || 0;
      if (visits > 0) {
        console.log(`✓ Singapore match found for ${geoCountryName}: ${visits} visits`);
        return visits;
      }
    }

    // Try case-insensitive partial matching
    const lowerGeoName = geoCountryName.toLowerCase();
    for (const [analyticsCountry, analyticsVisits] of Object.entries(data || {})) {
      if (analyticsCountry === '(not set)') continue;
      
      const lowerAnalyticsName = analyticsCountry.toLowerCase();
      if (lowerGeoName.includes(lowerAnalyticsName) || lowerAnalyticsName.includes(lowerGeoName)) {
        console.log(`✓ Partial match found: ${geoCountryName} <-> ${analyticsCountry}: ${analyticsVisits} visits`);
        return analyticsVisits as number;
      }
    }

    console.log(`✗ No match found for country: ${geoCountryName}`);
    return 0;
  };

  const getCountryColor = (geo: any) => {
    const geoCountryName = getCountryName(geo);
    const visits = getCountryVisits(geoCountryName);

    if (visits === 0) {
      return '#f8fafc'; // Light gray for no data
    }

    const intensity = visits / maxVisits;
    console.log(`Color for ${geoCountryName}: ${visits} visits, intensity: ${intensity}`);

    // Color scale from light blue to dark blue
    if (intensity >= 0.8) return '#1e40af'; // Dark blue
    if (intensity >= 0.6) return '#3b82f6'; // Medium-dark blue
    if (intensity >= 0.4) return '#60a5fa'; // Medium blue
    if (intensity >= 0.2) return '#93c5fd'; // Light-medium blue
    return '#dbeafe'; // Light blue
  };

  const getTooltipContent = (geo: any) => {
    const geoCountryName = getCountryName(geo);
    const visits = getCountryVisits(geoCountryName);
    
    return { countryName: geoCountryName, visits };
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
              {({ geographies }) => {
                // Debug: Log all geography names to see what we're working with
                const allCountryNames = geographies.map(g => getCountryName(g)).sort();
                console.log('All available country names in GeoJSON:', allCountryNames);
                
                // Look specifically for Singapore variants
                const singaporeVariants = allCountryNames.filter(name => 
                  name.toLowerCase().includes('singapore') || 
                  name.toLowerCase().includes('sing')
                );
                console.log('Singapore variants found:', singaporeVariants);
                
                return geographies.map((geo) => {
                  const fillColor = getCountryColor(geo);
                  const tooltipData = getTooltipContent(geo);
                  
                  return (
                    <HoverCard key={geo.rsmKey} openDelay={100} closeDelay={200}>
                      <HoverCardTrigger asChild>
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
                      </HoverCardTrigger>
                      {tooltipData.visits > 0 && (
                        <HoverCardContent className="w-64 p-4" side="top">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-sm flex items-center justify-center">
                                <span className="text-white text-xs font-bold">🌍</span>
                              </div>
                              <h4 className="font-semibold text-sm">{tooltipData.countryName}</h4>
                            </div>
                            <div className="border-t pt-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Etkin Kullanıcı Sayısı</span>
                                <span className="text-lg font-bold text-blue-600">
                                  {tooltipData.visits}
                                </span>
                              </div>
                              <div className="mt-1">
                                <div className="text-xs text-gray-500">
                                  Son 7 gün
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                  <div 
                                    className="bg-blue-500 h-1.5 rounded-full" 
                                    style={{ 
                                      width: `${Math.min((tooltipData.visits / maxVisits) * 100, 100)}%` 
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </HoverCardContent>
                      )}
                    </HoverCard>
                  );
                });
              }}
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

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
