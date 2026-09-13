import React, { useMemo, useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { BusStop } from '../types';

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

  const filteredStops = useMemo(() => {
    if (!trimmedQuery) {
      return stops;
    }
    return stops.filter((stop) => {
      const codeMatch = stop.code.includes(trimmedQuery);
      const nameMatch = stop.name.toLowerCase().includes(trimmedQuery);
      const roadMatch = stop.road.toLowerCase().includes(trimmedQuery);
      return codeMatch || nameMatch || roadMatch;
    });
  }, [stops, trimmedQuery]);

  return (
    <div id="find-my-stop-screen" className="w-full flex-1 flex flex-col bg-white">
      {/* Search Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-zinc-200 px-4 sm:px-8 py-5">
        <div className="max-w-3xl mx-auto">
          {/* App title bar */}
          <div className="flex items-baseline justify-between mb-4">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900">
              BusWhere
            </h1>
            <span className="text-xs font-mono text-zinc-400">Singapore Commute</span>
          </div>

          {/* Search Field */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
            <input
              id="stop-search-input"
              type="text"
              inputMode="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
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
          ) : !trimmedQuery ? (
            <p id="search-hint" className="mt-2.5 text-xs sm:text-sm text-zinc-500 font-normal">
              Search by 5-digit bus stop code, road name, or landmark to find your stop.
            </p>
          ) : (
            <p id="search-count" className="mt-2.5 text-xs text-zinc-500 font-mono">
              {filteredStops.length} {filteredStops.length === 1 ? 'stop' : 'stops'} found
            </p>
          )}
        </div>
      </div>

      {/* Matching Bus Stops List */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4">
        <div className="max-w-3xl mx-auto divide-y divide-zinc-200">
          {fetchStatus !== 'success' ? (
            <div id="stops-state-message" className="py-16 text-center">
              <p className="text-zinc-800 text-sm font-medium">{fetchSentence}</p>
            </div>
          ) : filteredStops.length === 0 ? (
            <div id="no-stops-found" className="py-16 text-center">
              <p className="text-zinc-900 text-base font-semibold">
                No stops match "{searchQuery}"
              </p>
              <p className="text-zinc-500 text-sm mt-1">
                Try searching for a road name like &ldquo;Orchard&rdquo; or a code like &ldquo;54261&rdquo;.
              </p>
            </div>
          ) : (
            filteredStops.map((stop) => {
              const isSelectedStop = stop.code === activeBoardingCode;

              return (
                <div
                  key={stop.code}
                  id={`bus-stop-row-${stop.code}`}
                  className={`py-4 transition-colors ${
                    isSelectedStop ? 'bg-red-50/70 -mx-3 px-3 rounded' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2.5 flex-wrap">
                        <span className="font-mono font-bold text-sm text-zinc-900 tracking-wider">
                          {stop.code}
                        </span>
                        <h2 className="text-base sm:text-lg font-bold text-zinc-900 truncate">
                          {stop.name}
                        </h2>
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-500 mt-0.5 truncate">
                        {stop.road}
                      </p>
                    </div>

                    {/* Service Chips */}
                    <div
                      id={`services-${stop.code}`}
                      aria-label={`Services at ${stop.name}`}
                      className="flex items-center gap-1.5 flex-wrap pt-1 sm:pt-0 shrink-0"
                    >
                      {stop.services.map((svcNum) => {
                        const isSelected =
                          isSelectedStop && svcNum === activeServiceNumber;

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
            })
          )}
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
