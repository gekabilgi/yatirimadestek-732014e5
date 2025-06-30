import React, { useMemo, useEffect, useState } from 'react';
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

export const WorldMapChart: React.FC<WorldMapChartProps> = ({ data, isLoading = false }) => {
  const [geoCountryNames, setGeoCountryNames] = useState<string[]>([]);

  // Fetch country names from GeoJSON for dynamic matching
  useEffect(() => {
    fetch(geoUrl)
      .then((res) => res.json())
      .then((geoData) => {
        const names = geoData.features.map((f: any) => f.properties.NAME);
        setGeoCountryNames(names);
      });
  }, []);

  // Normalize incoming country names to match GeoJSON
  const normalizedData = useMemo(() => {
    if (!data || geoCountryNames.length === 0) return {};
    const normalized: CountryData = {};

    Object.entries(data).forEach(([country, value]) => {
      if (!country || country.toLowerCase() === '(not set)') return;

      const matchedGeo = geoCountryNames.find(
        (geoName) =>
          geoName.toLowerCase() === country.toLowerCase() ||
          geoName.toLowerCase().includes(country.toLowerCase()) ||
          country.toLowerCase().includes(geoName.toLowerCase())
      );

      const normalizedName = matchedGeo || country;
      normalized[normalizedName] = value;
    });

    return normalized;
  }, [data, geoCountryNames]);

  const maxVisits = Math.max(...Object.values(normalizedData || {}));

  const getCountryColor = (geo: any) => {
    const countryName = geo.properties.NAME;
    const visits = normalizedData?.[countryName];

    if (!visits) return '#f8fafc';
    const intensity = visits / maxVisits;

    if (intensity >= 0.8) return '#1e40af';
    if (intensity >= 0.6) return '#3b82f6';
    if (intensity >= 0.4) return '#60a5fa';
    if (intensity >= 0.2) return '#93c5fd';
    return '#dbeafe';
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

  return (
    <div className="w-full">
      <TooltipProvider>
        <div className="relative">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale: 120, center: [0, 20] }}
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
                          fill={getCountryColor(geo)}
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

      {/* Top Countries */}
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

      {!hasData && (
        <div className="mt-4 text-center text-gray-500 text-sm">
          Henüz ülke verisi bulunmuyor
        </div>
      )}
    </div>
  );
};
