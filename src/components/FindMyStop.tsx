import React, { useMemo, useState, useEffect } from 'react';
import { Search, X, ArrowLeft, ChevronRight } from 'lucide-react';
import { BusStop } from '../types';
import { getAreaLabel } from '../data/areas';
import { DisqusComments } from './DisqusComments';

interface FindMyStopProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectService: (stopCode: string, serviceNumber: string) => void;
  activeBoardingCode: string | null;
  activeServiceNumber: string | null;
  onStopsLoaded?: (stops: BusStop[]) => void;
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
  const [selectedPrefix, setSelectedPrefix] = useState<string | null>(null);

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

  const trimmedQuery = searchQuery.trim().toLowerCase();

  // Global search matching all stops when search query is typed
  const filteredStops = useMemo(() => {
    if (!trimmedQuery) {
      return [];
    }
    return stops.filter((stop) => {
      const codeMatch = stop.code.includes(trimmedQuery);
      const nameMatch = stop.name.toLowerCase().includes(trimmedQuery);
      const roadMatch = stop.road.toLowerCase().includes(trimmedQuery);
      return codeMatch || nameMatch || roadMatch;
    });
  }, [stops, trimmedQuery]);

  // Group stops into unique 2-digit code prefixes and sort areas alphabetically by label
  const sortedAreas = useMemo(() => {
    const areaMap = new Map<string, { prefix: string; label: string; count: number }>();

    for (const stop of stops) {
      const prefix = String(stop.code).padStart(5, '0').slice(0, 2);
      const existing = areaMap.get(prefix);
      if (existing) {
        existing.count++;
      } else {
        areaMap.set(prefix, {
          prefix,
          label: getAreaLabel(prefix),
          count: 1,
        });
      }
    }

    return Array.from(areaMap.values()).sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
    );
  }, [stops]);

  // Stops within the currently selected area, sorted by stop code
  const stopsInSelectedArea = useMemo(() => {
    if (!selectedPrefix) return [];
    return stops
      .filter((s) => String(s.code).padStart(5, '0').slice(0, 2) === selectedPrefix)
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  }, [stops, selectedPrefix]);

  const selectedAreaLabel = selectedPrefix ? getAreaLabel(selectedPrefix) : '';

  /**
   * Helper to render a stop row as three stacked lines:
   * Line 1: Stop code and full untruncated name
   * Line 2: Road name
   * Line 3: Service chips wrapping onto multiple lines as needed
   */
  const renderStopRow = (stop: BusStop) => {
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
          {/* Line 1: Stop Code + Full Name (never truncated) */}
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <span className="font-mono font-bold text-sm sm:text-base text-zinc-900 tracking-wider shrink-0">
              {stop.code}
            </span>
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

              return (
                <button
                  key={svcNum}
                  type="button"
                  id={`chip-${stop.code}-${svcNum}`}
                  onClick={() => onSelectService(stop.code, svcNum)}
                  className={`min-w-[40px] h-8 px-2.5 inline-flex items-center justify-center font-bold text-xs sm:text-sm transition-all focus:outline-none ${
                    isSelected
                      ? 'bg-red-600 text-white ring-2 ring-red-600 ring-offset-2'
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

          {/* Search Field */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
            <input
              id="stop-search-input"
              type="text"
              inputMode="search"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
              }}
              placeholder="Search by code, road, or landmark..."
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

          {/* One-line search hint or state message */}
          {fetchStatus !== 'success' ? (
            <p id="fetch-status-hint" className="mt-2.5 text-xs sm:text-sm text-zinc-600 font-medium">
              {fetchSentence}
            </p>
          ) : trimmedQuery ? (
            <p id="search-count" className="mt-2.5 text-xs sm:text-sm text-zinc-500 font-mono">
              {filteredStops.length} {filteredStops.length === 1 ? 'stop' : 'stops'} found
            </p>
          ) : selectedPrefix ? (
            <p id="area-header-hint" className="mt-2.5 text-xs sm:text-sm text-zinc-500 font-normal">
              Showing stops in {selectedAreaLabel}
            </p>
          ) : (
            <p id="search-hint" className="mt-2.5 text-xs sm:text-sm text-zinc-500 font-normal">
              Select an area below or type above to search all stops across Singapore.
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
            /* Search Mode: results for current query */
            filteredStops.length === 0 ? (
              <div id="no-stops-found" className="py-16 text-center">
                <p className="text-zinc-900 text-base font-semibold">
                  No stops match "{searchQuery}"
                </p>
                <p className="text-zinc-500 text-sm mt-1">
                  Try searching for a road name like &ldquo;Orchard&rdquo; or a code like &ldquo;54261&rdquo;.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-200">
                {filteredStops.map(renderStopRow)}
              </div>
            )
          ) : selectedPrefix ? (
            /* Area Selected Mode: shows stops in selected area with back button */
            <div>
              {/* Way back to area list */}
              <div className="mb-4">
                <button
                  type="button"
                  id="back-to-areas-btn"
                  onClick={() => setSelectedPrefix(null)}
                  className="inline-flex items-center gap-1.5 py-1.5 px-2 -ml-2 text-sm font-semibold text-zinc-700 hover:text-red-600 active:text-red-700 rounded transition-colors focus:outline-none"
                  aria-label="Back to all areas"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>All Areas</span>
                </button>
              </div>

              {/* Area Title & Count */}
              <div className="pb-3 mb-2 border-b border-zinc-200">
                <h2 className="text-lg sm:text-xl font-bold text-zinc-900">
                  {selectedAreaLabel}
                </h2>
                <p className="text-xs sm:text-sm font-mono text-zinc-500 mt-0.5">
                  {stopsInSelectedArea.length} {stopsInSelectedArea.length === 1 ? 'stop' : 'stops'} • Prefix {selectedPrefix}
                </p>
              </div>

              {/* Stops in this area */}
              <div className="divide-y divide-zinc-200">
                {stopsInSelectedArea.map(renderStopRow)}
              </div>
            </div>
          ) : (
            /* Default Empty Search Mode: Area List */
            <div id="area-list-container">
              <div className="pb-3 mb-1 border-b border-zinc-200 flex items-baseline justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
                  Singapore Areas
                </h2>
                <span className="text-xs font-mono text-zinc-400">
                  {sortedAreas.length} areas
                </span>
              </div>

              <div className="divide-y divide-zinc-100">
                {sortedAreas.map((area) => (
                  <button
                    key={area.prefix}
                    type="button"
                    id={`area-row-${area.prefix}`}
                    onClick={() => setSelectedPrefix(area.prefix)}
                    className="w-full text-left py-3.5 px-2 -mx-2 rounded hover:bg-zinc-50 active:bg-zinc-100 flex items-center justify-between gap-3 transition-colors focus:outline-none focus:bg-zinc-50"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <h3 className="text-base sm:text-lg font-semibold text-zinc-900 leading-snug">
                        {area.label}
                      </h3>
                      <span className="text-xs font-mono text-zinc-400 mt-0.5 block">
                        Code prefix {area.prefix}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs sm:text-sm font-mono font-medium text-zinc-500 bg-zinc-100 px-2 py-1 rounded">
                        {area.count} {area.count === 1 ? 'stop' : 'stops'}
                      </span>
                      <ChevronRight className="w-4 h-4 text-zinc-400" />
                    </div>
                  </button>
                ))}
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
        Contains information from Bus Arrival API accessed via LTA DataMall which is made available under the terms of the Singapore Open Data Licence version 1.0
      </footer>
    </div>
  );
};
