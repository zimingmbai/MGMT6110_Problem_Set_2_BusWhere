import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Search, X, Navigation, RotateCw, MapPin, ChevronRight, Bus } from 'lucide-react';
import { BusStop } from '../types';
import { DisqusComments } from './DisqusComments';

interface FindMyStopProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectService: (stopCode: string, serviceNumber: string) => void;
  activeBoardingCode: string | null;
  activeServiceNumber: string | null;
  onStopsLoaded?: (stops: BusStop[]) => void;
}

/**
 * Calculates straight-line distance between two geographic coordinates using Haversine formula (km).
 */
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const FindMyStop: React.FC<FindMyStopProps> = ({
  searchQuery,
  onSearchChange,
  onSelectService,
  activeBoardingCode,
  activeServiceNumber,
  onStopsLoaded,
}) => {
  const [stops, setStops] = useState<BusStop[]>([]);
  const [fetchStatus, setFetchStatus] = useState<
    'loading' | 'empty' | 'refused' | 'unreachable' | 'success'
  >('loading');
  const [fetchSentence, setFetchSentence] = useState('Fetching bus stops...');

  // GPS "Near Me" states
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'success' | 'error'>('idle');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsErrorMessage, setGpsErrorMessage] = useState<string | null>(null);

  // Load /stops.json once on mount
  useEffect(() => {
    let isMounted = true;
    setFetchStatus('loading');
    setFetchSentence('Fetching bus stops...');

    fetch('/stops.json')
      .then(async (res) => {
        if (!isMounted) return;

        if (res.status === 401 || res.status === 403) {
          setFetchStatus('refused');
          setFetchSentence('The stop data service refused the request; showing distance-based estimate.');
          return;
        }

        if (!res.ok) {
          setFetchStatus('unreachable');
          setFetchSentence('Bus stop data is currently unreachable.');
          return;
        }

        try {
          const data = await res.json();
          if (!isMounted) return;

          if (!Array.isArray(data) || data.length === 0) {
            setFetchStatus('empty');
            setFetchSentence('No bus stops found in dataset.');
            return;
          }

          setStops(data);
          setFetchStatus('success');
          onStopsLoaded?.(data);
        } catch (_) {
          if (isMounted) {
            setFetchStatus('unreachable');
            setFetchSentence('Bus stop data is currently unreachable.');
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setFetchStatus('unreachable');
          setFetchSentence('Bus stop data is currently unreachable.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [onStopsLoaded]);

  // Request user GPS position
  const handleRequestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('error');
      setGpsErrorMessage('Geolocation is not supported by your browser.');
      return;
    }

    setGpsStatus('locating');
    setGpsErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setGpsStatus('success');
      },
      (error) => {
        setGpsStatus('error');
        if (error.code === error.PERMISSION_DENIED) {
          setGpsErrorMessage('Location permission was denied. Please allow location access in your browser settings.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setGpsErrorMessage('Location information is currently unavailable from your device.');
        } else if (error.code === error.TIMEOUT) {
          setGpsErrorMessage('GPS location request timed out. Please try again.');
        } else {
          setGpsErrorMessage('Unable to determine location. Please search by road name or stop code.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      }
    );
  }, []);

  const trimmedQuery = searchQuery.trim().toLowerCase();

  // Index stops by service number for instant service matching
  const serviceToStopsMap = useMemo(() => {
    const map = new Map<string, BusStop[]>();
    for (const stop of stops) {
      for (const svc of stop.services) {
        let list = map.get(svc);
        if (!list) {
          list = [];
          map.set(svc, list);
        }
        list.push(stop);
      }
    }
    return map;
  }, [stops]);

  // Omnibox: Matching bus services when query is typed
  const matchingServices = useMemo(() => {
    if (!trimmedQuery) return [];
    const results: Array<{ serviceNumber: string; stopCount: number; stops: BusStop[] }> = [];

    for (const [svcNum, svcStops] of serviceToStopsMap.entries()) {
      const lower = svcNum.toLowerCase();
      if (lower === trimmedQuery || lower.startsWith(trimmedQuery)) {
        results.push({
          serviceNumber: svcNum,
          stopCount: svcStops.length,
          stops: svcStops,
        });
      }
    }

    return results.sort((a, b) => {
      const aExact = a.serviceNumber.toLowerCase() === trimmedQuery;
      const bExact = b.serviceNumber.toLowerCase() === trimmedQuery;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return a.serviceNumber.localeCompare(b.serviceNumber, undefined, { numeric: true });
    });
  }, [serviceToStopsMap, trimmedQuery]);

  // Omnibox: Matching bus stops (by code, name, road, or service served)
  const filteredStops = useMemo(() => {
    if (!trimmedQuery) {
      return [];
    }
    return stops
      .filter((stop) => {
        const codeMatch = stop.code.toLowerCase().includes(trimmedQuery);
        const nameMatch = stop.name.toLowerCase().includes(trimmedQuery);
        const roadMatch = stop.road.toLowerCase().includes(trimmedQuery);
        const serviceMatch = stop.services.some((s) => s.toLowerCase() === trimmedQuery);
        return codeMatch || nameMatch || roadMatch || serviceMatch;
      })
      .sort((a, b) => {
        // Prioritize exact 5-digit code matches
        const aExactCode = a.code.toLowerCase() === trimmedQuery;
        const bExactCode = b.code.toLowerCase() === trimmedQuery;
        if (aExactCode && !bExactCode) return -1;
        if (!aExactCode && bExactCode) return 1;

        // Prioritize code prefix matches
        const aStartsCode = a.code.toLowerCase().startsWith(trimmedQuery);
        const bStartsCode = b.code.toLowerCase().startsWith(trimmedQuery);
        if (aStartsCode && !bStartsCode) return -1;
        if (!aStartsCode && bStartsCode) return 1;

        // Prioritize direct name/road matches over pure service inclusion
        const aDirect =
          a.name.toLowerCase().includes(trimmedQuery) || a.road.toLowerCase().includes(trimmedQuery);
        const bDirect =
          b.name.toLowerCase().includes(trimmedQuery) || b.road.toLowerCase().includes(trimmedQuery);
        if (aDirect && !bDirect) return -1;
        if (!aDirect && bDirect) return 1;

        return a.code.localeCompare(b.code, undefined, { numeric: true });
      });
  }, [stops, trimmedQuery]);

  // Nearby stops when GPS is active
  const nearbyStops = useMemo(() => {
    if (gpsStatus !== 'success' || !userLocation) return [];
    const withDistances = stops.map((stop) => ({
      stop,
      distanceKm: calculateDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        stop.latitude,
        stop.longitude
      ),
    }));

    withDistances.sort((a, b) => a.distanceKm - b.distanceKm);

    // Show stops within 1km; if fewer than 6, expand to top 15 closest
    const within1km = withDistances.filter((item) => item.distanceKm <= 1.0);
    if (within1km.length >= 6) {
      return within1km;
    }
    return withDistances.slice(0, 15);
  }, [stops, gpsStatus, userLocation]);

  /**
   * Helper to render a stop row as three stacked lines:
   * Line 1: Stop code, distance badge (if GPS active), and full untruncated name
   * Line 2: Road name
   * Line 3: Service chips wrapping onto multiple lines as needed
   */
  const renderStopRow = (stop: BusStop, distanceKm?: number) => {
    const isSelectedStop = stop.code === activeBoardingCode;

    return (
      <div
        key={stop.code}
        id={`bus-stop-row-${stop.code}`}
        className={`py-4 transition-colors ${
          isSelectedStop ? 'bg-red-50/70 -mx-3 px-3 rounded' : ''
        }`}
      >
        <div className="flex flex-col gap-1.5">
          {/* Line 1: Stop Code + Optional Distance + Full Name */}
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <span className="font-mono font-bold text-sm sm:text-base text-zinc-900 tracking-wider shrink-0">
              {stop.code}
            </span>
            {distanceKm !== undefined && (
              <span className="px-2 py-0.5 text-xs font-mono font-bold bg-red-100 text-red-700 rounded-none shrink-0">
                {distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m away` : `${distanceKm.toFixed(1)}km away`}
              </span>
            )}
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 leading-snug">
              {stop.name}
            </h2>
          </div>

          {/* Line 2: Road Name */}
          <p className="text-xs sm:text-sm text-zinc-500 leading-normal">
            {stop.road}
          </p>

          {/* Line 3: Service Chips (wrap onto as many lines as needed) */}
          <div
            id={`services-${stop.code}`}
            aria-label={`Services at ${stop.name}`}
            className="flex items-center gap-1.5 flex-wrap pt-1"
          >
            {stop.services.map((svcNum) => {
              const isSelected = isSelectedStop && svcNum === activeServiceNumber;
              const matchesQueryService = trimmedQuery && svcNum.toLowerCase() === trimmedQuery;

              return (
                <button
                  key={svcNum}
                  type="button"
                  id={`chip-${stop.code}-${svcNum}`}
                  onClick={() => onSelectService(stop.code, svcNum)}
                  className={`min-w-[40px] h-8 px-2.5 inline-flex items-center justify-center font-bold text-xs sm:text-sm transition-all focus:outline-none ${
                    isSelected
                      ? 'bg-red-600 text-white ring-2 ring-red-600 ring-offset-2'
                      : matchesQueryService
                      ? 'bg-zinc-900 text-white ring-2 ring-red-600'
                      : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-900 hover:text-white active:bg-red-600 active:text-white border border-zinc-200'
                  }`}
                  aria-label={`Select service ${svcNum} at ${stop.name}`}
                >
                  {svcNum}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="find-my-stop-screen" className="w-full flex-1 flex flex-col bg-white">
      {/* Search Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-zinc-200 px-4 sm:px-8 py-5">
        <div className="max-w-3xl mx-auto">
          {/* App title bar */}
          <div className="mb-4">
            <div className="flex items-baseline justify-between">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900">
                BusWhere
              </h1>
              <span className="text-xs font-mono text-zinc-400">Singapore Commute</span>
            </div>
            <p className="mt-1 text-[11px] sm:text-xs text-zinc-500 leading-relaxed">
              Contains information from{' '}
              <a
                href="https://datamall.lta.gov.sg/content/datamall/en.html"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-zinc-900 text-zinc-600 transition-colors"
              >
                LTA DataMall
              </a>{' '}
              datasets from the Land Transport Authority of Singapore (LTA), which is made available under the terms of the{' '}
              <a
                href="https://datamall.lta.gov.sg/content/datamall/en/SingaporeOpenDataLicence.html"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-zinc-900 text-zinc-600 transition-colors"
              >
                Singapore Open Data Licence version 1.0
              </a>
              .
            </p>
          </div>

          {/* Omnibox Search Field + Quick GPS Trigger */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
              <input
                id="stop-search-input"
                type="text"
                inputMode="search"
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  // Dismiss GPS mode if user starts typing a search query
                  if (gpsStatus === 'success') {
                    setGpsStatus('idle');
                  }
                }}
                placeholder="Search bus service, stop code, road, or landmark..."
                className="w-full h-13 pl-12 pr-11 bg-zinc-100 border border-transparent focus:border-red-600 focus:bg-white text-zinc-900 text-base sm:text-lg rounded-none transition-colors outline-none font-medium placeholder:text-zinc-400"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
              />
              {searchQuery && (
                <button
                  type="button"
                  id="clear-search-btn"
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-zinc-700 active:text-red-600 focus:outline-none"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Compact Header GPS Button */}
            <button
              type="button"
              id="header-near-me-btn"
              onClick={() => {
                onSearchChange('');
                handleRequestLocation();
              }}
              title="Find stops near me with GPS"
              className={`h-13 px-3.5 sm:px-4 shrink-0 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors border ${
                gpsStatus === 'success' && !trimmedQuery
                  ? 'bg-red-600 text-white border-red-600'
                  : gpsStatus === 'locating'
                  ? 'bg-zinc-200 text-zinc-700 border-zinc-300'
                  : 'bg-zinc-100 hover:bg-zinc-900 hover:text-white text-zinc-800 border-zinc-200'
              }`}
            >
              {gpsStatus === 'locating' ? (
                <RotateCw className="w-4 h-4 animate-spin text-red-600" />
              ) : (
                <Navigation className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Near Me</span>
            </button>
          </div>

          {/* Status Hint / Result Counts */}
          {fetchStatus !== 'success' ? (
            <p id="fetch-status-hint" className="mt-2.5 text-xs sm:text-sm text-zinc-600 font-medium">
              {fetchSentence}
            </p>
          ) : trimmedQuery ? (
            <div className="mt-2.5 flex items-baseline justify-between text-xs sm:text-sm font-mono text-zinc-500">
              <span id="search-count">
                {matchingServices.length > 0 && `${matchingServices.length} service${matchingServices.length === 1 ? '' : 's'} • `}
                {filteredStops.length} {filteredStops.length === 1 ? 'stop' : 'stops'} found
              </span>
              <span className="text-zinc-400 font-sans text-[11px]">
                Omnibox Search
              </span>
            </div>
          ) : gpsStatus === 'success' ? (
            <p id="search-count" className="mt-2.5 text-xs sm:text-sm text-zinc-600 font-mono">
              {nearbyStops.length} nearby stops within walking distance
            </p>
          ) : (
            <p id="search-hint" className="mt-2.5 text-xs sm:text-sm text-zinc-500 font-normal">
              Search by bus service (e.g. 65), stop code (e.g. 01012), road, or tap &ldquo;Near Me&rdquo;.
            </p>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4">
        <div className="max-w-3xl mx-auto">
          {/* Fetch states handling */}
          {fetchStatus !== 'success' ? (
            <div id="stops-state-message" className="py-16 text-center">
              <p className="text-zinc-800 text-sm font-medium">{fetchSentence}</p>
            </div>
          ) : trimmedQuery ? (
            /* ==============================================================
             * 1. SEARCH MODE: Single Omnibox with Service Matching & Stops
             * ============================================================== */
            <div>
              {/* SECTION A: Matching Bus Services (if user query matches a service number) */}
              {matchingServices.length > 0 && (
                <div id="matching-services-section" className="mb-6 pb-6 border-b border-zinc-200">
                  <div className="pb-2.5 mb-3 flex items-baseline justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Bus Services ({matchingServices.length})
                    </h3>
                    <span className="text-[11px] font-mono text-zinc-400">
                      Tap a service to open route
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {matchingServices.slice(0, 6).map((svc) => (
                      <div
                        key={svc.serviceNumber}
                        id={`service-card-${svc.serviceNumber}`}
                        onClick={() => {
                          if (svc.stops.length > 0) {
                            onSelectService(svc.stops[0].code, svc.serviceNumber);
                          }
                        }}
                        className="p-3.5 bg-zinc-50 hover:bg-zinc-100 active:bg-red-50 border border-zinc-200 hover:border-zinc-400 transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="min-w-[44px] h-9 px-2.5 inline-flex items-center justify-center font-bold text-sm bg-red-600 text-white rounded-none">
                            {svc.serviceNumber}
                          </span>
                          <div>
                            <p className="font-bold text-sm sm:text-base text-zinc-900 group-hover:text-red-600 transition-colors">
                              Bus Service {svc.serviceNumber}
                            </p>
                            <p className="text-xs text-zinc-500 font-mono">
                              {svc.stopCount} stops on route
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-zinc-400 group-hover:text-red-600 flex items-center gap-0.5">
                          View Route &rarr;
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION B: Matching Bus Stops */}
              <div id="matching-stops-section">
                {filteredStops.length === 0 ? (
                  matchingServices.length === 0 ? (
                    <div id="no-stops-found" className="py-16 text-center">
                      <p className="text-zinc-900 text-base font-semibold">
                        No stops or services match &ldquo;{searchQuery}&rdquo;
                      </p>
                      <p className="text-zinc-500 text-sm mt-1">
                        Try searching by bus number (e.g. &ldquo;65&rdquo;), road (e.g. &ldquo;Orchard&rdquo;), or stop code (&ldquo;54261&rdquo;).
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs font-mono text-zinc-400 py-3">
                      No additional bus stop codes or roads directly match &ldquo;{searchQuery}&rdquo;.
                    </p>
                  )
                ) : (
                  <div>
                    <div className="pb-2 mb-1 flex items-baseline justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                        Bus Stops ({filteredStops.length})
                      </h3>
                      <span className="text-[11px] font-mono text-zinc-400">
                        Tap any service chip to view route
                      </span>
                    </div>
                    <div className="divide-y divide-zinc-200">
                      {filteredStops.map((stop) => renderStopRow(stop))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : gpsStatus === 'success' ? (
            /* ==============================================================
             * 2. GPS "NEAR ME" MODE: Active location with nearest stops
             * ============================================================== */
            <div id="near-me-stops-container">
              {/* Header with location status & refresh/clear controls */}
              <div className="pb-3 mb-4 border-b border-zinc-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h2 className="text-base sm:text-lg font-bold text-zinc-900">
                      Bus Stops Near You
                    </h2>
                  </div>
                  <p className="text-xs font-mono text-zinc-500 mt-0.5">
                    {nearbyStops.length} stops sorted by walking distance
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="refresh-gps-btn"
                    onClick={handleRequestLocation}
                    className="px-3 py-1.5 text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors flex items-center gap-1.5"
                    title="Refresh current GPS position"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Refresh</span>
                  </button>
                  <button
                    type="button"
                    id="clear-gps-btn"
                    onClick={() => setGpsStatus('idle')}
                    className="px-3 py-1.5 text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    Exit GPS
                  </button>
                </div>
              </div>

              {nearbyStops.length === 0 ? (
                <div className="py-12 text-center text-zinc-500">
                  <p className="text-sm font-semibold text-zinc-800">No bus stops detected within range.</p>
                  <p className="text-xs mt-1">You may be outside Singapore or away from public bus routes.</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-200">
                  {nearbyStops.map(({ stop, distanceKm }) => renderStopRow(stop, distanceKm))}
                </div>
              )}
            </div>
          ) : (
            /* ==============================================================
             * 3. DEFAULT DISCOVERY MODE: "Near Me" GPS Button replaces Area List
             * ============================================================== */
            <div id="default-discovery-container">
              {/* Prominent "Near Me" GPS Action Card */}
              {gpsStatus === 'locating' ? (
                <div id="near-me-card" className="p-6 bg-zinc-50 border border-zinc-200 text-center mb-6">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-600 mb-3 animate-spin">
                    <RotateCw className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-zinc-900">Accessing device location...</p>
                  <p className="text-xs text-zinc-500 mt-1">Acquiring GPS coordinates to find your closest bus stops.</p>
                </div>
              ) : gpsStatus === 'error' ? (
                <div id="near-me-card" className="p-5 bg-zinc-50 border border-zinc-200 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-zinc-200 text-zinc-700 flex items-center justify-center shrink-0">
                      <Navigation className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-zinc-900">Location Access Unavailable</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {gpsErrorMessage || 'Please enable location permissions in your browser, or search by road or stop code above.'}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          id="retry-gps-btn"
                          onClick={handleRequestLocation}
                          className="px-3.5 py-1.5 bg-zinc-900 hover:bg-red-600 text-white text-xs font-bold transition-colors"
                        >
                          Try Again
                        </button>
                        <button
                          type="button"
                          onClick={() => setGpsStatus('idle')}
                          className="px-3.5 py-1.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-xs font-bold transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div id="near-me-card" className="p-6 bg-zinc-50 border border-zinc-200 rounded-none mb-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 bg-red-600 text-white flex items-center justify-center shrink-0">
                        <Navigation className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-zinc-900">
                          Find Bus Stops Near Me
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                          Use your device&rsquo;s GPS to detect bus stops and arrival timings within walking distance.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      id="near-me-btn"
                      onClick={handleRequestLocation}
                      className="w-full sm:w-auto px-5 py-3 bg-zinc-900 hover:bg-red-600 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shrink-0"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>Use Current Location</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Popular Transit Hubs Quick Search */}
              <div className="mb-6">
                <div className="pb-2 mb-3 border-b border-zinc-100 flex items-baseline justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Quick Search Hubs
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">Tap to search</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Orchard',
                    'Bugis',
                    'Marina Bay',
                    'Tampines',
                    'Jurong East',
                    'Bishan',
                    'Dhoby Ghaut',
                    'Clementi',
                    'Woodlands',
                  ].map((hub) => (
                    <button
                      key={hub}
                      type="button"
                      onClick={() => onSearchChange(hub)}
                      className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-900 hover:text-white text-zinc-800 text-xs font-medium border border-zinc-200 transition-colors"
                    >
                      {hub}
                    </button>
                  ))}
                </div>
              </div>

              {/* Omnibox Search Tips */}
              <div className="p-4 bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 mb-6">
                <p className="font-bold text-zinc-800 uppercase tracking-wider text-[11px] mb-2.5">
                  Single Omnibox Search
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-zinc-600">
                  <div className="flex items-start gap-2">
                    <Bus className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-zinc-900 block">Bus Service</span>
                      <span>Type &ldquo;65&rdquo;, &ldquo;190&rdquo;, or &ldquo;14&rdquo; to view route and all stops.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-mono font-bold text-xs bg-zinc-200 text-zinc-800 px-1 py-0.5 shrink-0">12345</span>
                    <div>
                      <span className="font-bold text-zinc-900 block">Bus Stop Code</span>
                      <span>Type 5-digit code e.g. &ldquo;01012&rdquo; or &ldquo;54261&rdquo;.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-zinc-900 block">Road Name</span>
                      <span>Type road names like &ldquo;Victoria St&rdquo; or &ldquo;Orchard Rd&rdquo;.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Search className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-zinc-900 block">Landmarks</span>
                      <span>Search landmarks like &ldquo;SMU&rdquo;, &ldquo;Grand Pacific&rdquo;, or &ldquo;Plaza Singapura&rdquo;.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Disqus Comments */}
          <DisqusComments />
        </div>
      </div>

      {/* Attribution Footer */}
      <footer
        id="licence-footer"
        className="shrink-0 border-t border-zinc-200 px-4 sm:px-8 py-3 bg-zinc-50 text-[11px] sm:text-xs text-zinc-500 text-center leading-normal"
      >
        <p>
          Contains information from Bus Arrival API accessed via LTA DataMall which is made available under the terms of the Singapore Open Data Licence version 1.0
        </p>
        <p className="mt-1 text-zinc-400">
          This page uses Microsoft Clarity and Disqus, which use cookies to record how visitors use the site and to host comments. By using this page you agree that we and Microsoft may collect and use this data. See the{' '}
          <a
            href="https://www.microsoft.com/privacy/privacystatement"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-zinc-600 transition-colors"
          >
            Microsoft Privacy Statement
          </a>
          , the{' '}
          <a
            href="https://disqus.com/privacy-policy/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-zinc-600 transition-colors"
          >
            Disqus privacy policy
          </a>{' '}
          and the{' '}
          <a
            href="https://disqus.com/data-sharing-settings/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-zinc-600 transition-colors"
          >
            Disqus data sharing settings
          </a>
          .
        </p>
      </footer>
    </div>
  );
};
