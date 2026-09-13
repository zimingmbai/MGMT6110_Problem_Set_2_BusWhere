import React, { useEffect, useRef, useState } from 'react';
import { X, ArrowLeft, Bus, CheckCircle2 } from 'lucide-react';
import {
  computeRideMetrics,
  getServiceDirectionForBoarding,
  BusService,
  BusStop,
  ServiceDirection,
} from '../data/busData';
import { ResultBar } from './ResultBar';
import {
  getStopArrivals,
  getMinutesForService,
  StopArrivalData,
} from '../services/busArrivals';

interface RidePanelProps {
  serviceNumber: string;
  boardingStopCode: string;
  destinationStopCode: string | null;
  onSelectDestination: (stopCode: string) => void;
  onClose: () => void;
  stopsMap?: Map<string, BusStop>;
}

// In-memory cache for /routes.json so it is only fetched once across panel openings
let cachedRoutesData: Record<string, BusService> | Array<BusService> | null = null;

export const RidePanel: React.FC<RidePanelProps> = ({
  serviceNumber,
  boardingStopCode,
  destinationStopCode,
  onSelectDestination,
  onClose,
  stopsMap,
}) => {
  const boardingRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Route data state (with 4 states: loading, empty, refused, unreachable)
  const [serviceRoute, setServiceRoute] = useState<BusService | null>(null);
  const [routeStatus, setRouteStatus] = useState<
    'loading' | 'empty' | 'refused' | 'unreachable' | 'success'
  >('loading');
  const [routeSentence, setRouteSentence] = useState('Loading route...');

  // Live arrivals state
  const [boardingData, setBoardingData] = useState<StopArrivalData | null>(null);
  const [boardingLoading, setBoardingLoading] = useState(true);

  const [destinationData, setDestinationData] = useState<StopArrivalData | null>(null);
  const [destinationLoading, setDestinationLoading] = useState(false);

  // 1. Load /routes.json and read the one service needed
  useEffect(() => {
    let isMounted = true;

    const findService = (data: Record<string, BusService> | Array<BusService>) => {
      if (Array.isArray(data)) {
        return data.find((s) => s.serviceNumber === serviceNumber) || null;
      }
      return data[serviceNumber] || null;
    };

    if (cachedRoutesData) {
      const svc = findService(cachedRoutesData);
      if (!svc || !svc.directions || svc.directions.length === 0) {
        setRouteStatus('empty');
        setRouteSentence(`No route data found for service ${serviceNumber}.`);
      } else {
        setServiceRoute(svc);
        setRouteStatus('success');
      }
      return;
    }

    setRouteStatus('loading');
    setRouteSentence(`Loading route for service ${serviceNumber}...`);

    fetch('/routes.json')
      .then(async (res) => {
        if (!isMounted) return;

        if (res.status === 401 || res.status === 403) {
          setRouteStatus('refused');
          setRouteSentence('The route service refused the request; showing distance-based estimate.');
          return;
        }

        if (!res.ok) {
          setRouteStatus('unreachable');
          setRouteSentence('Route data is currently unreachable.');
          return;
        }

        try {
          const data = await res.json();
          if (!isMounted) return;
          cachedRoutesData = data;

          const svc = findService(data);
          if (!svc || !svc.directions || svc.directions.length === 0) {
            setRouteStatus('empty');
            setRouteSentence(`No route data found for service ${serviceNumber}.`);
          } else {
            setServiceRoute(svc);
            setRouteStatus('success');
          }
        } catch (_) {
          if (isMounted) {
            setRouteStatus('unreachable');
            setRouteSentence('Route data is currently unreachable.');
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setRouteStatus('unreachable');
          setRouteSentence('Route data is currently unreachable.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [serviceNumber]);

  // Derive direction
  const direction: ServiceDirection | null = serviceRoute
    ? getServiceDirectionForBoarding(serviceRoute, boardingStopCode)
    : null;

  // Auto-scroll to the boarding stop when panel opens or service changes
  useEffect(() => {
    if (boardingRef.current && scrollContainerRef.current) {
      const timer = setTimeout(() => {
        boardingRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [serviceNumber, boardingStopCode, direction]);

  // Fetch live arrivals for boarding stop
  useEffect(() => {
    let isMounted = true;
    setBoardingLoading(true);

    getStopArrivals(boardingStopCode)
      .then((data) => {
        if (isMounted) {
          setBoardingData(data);
          setBoardingLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setBoardingData({
            stopCode: boardingStopCode,
            status: 'unreachable',
            sentence: 'The arrival service is currently unreachable; showing distance-based estimate.',
            services: [],
            timestamp: Date.now(),
          });
          setBoardingLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [boardingStopCode, serviceNumber]);

  // Fetch live arrivals for destination stop when selected
  useEffect(() => {
    if (!destinationStopCode) {
      setDestinationData(null);
      setDestinationLoading(false);
      return;
    }

    let isMounted = true;
    setDestinationLoading(true);

    getStopArrivals(destinationStopCode)
      .then((data) => {
        if (isMounted) {
          setDestinationData(data);
          setDestinationLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setDestinationData({
            stopCode: destinationStopCode,
            status: 'unreachable',
            sentence: 'The arrival service is currently unreachable; showing distance-based estimate.',
            services: [],
            timestamp: Date.now(),
          });
          setDestinationLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [destinationStopCode, serviceNumber]);

  const boardingStopDetails = stopsMap?.get(boardingStopCode);
  const destinationDetails = destinationStopCode ? stopsMap?.get(destinationStopCode) : null;

  // Header info derived dynamically from route stops
  const originStopCode = direction?.stops[0]?.stopCode;
  const lastStopCode = direction?.stops[direction?.stops.length - 1]?.stopCode;
  const originDisplayName = originStopCode ? (stopsMap?.get(originStopCode)?.name || originStopCode) : '';
  const destDisplayName = lastStopCode ? (stopsMap?.get(lastStopCode)?.name || lastStopCode) : '';

  // Boarding & destination live metrics
  const boardingInfo = getMinutesForService(
    boardingLoading ? null : boardingData,
    serviceNumber
  );

  const destinationInfo = destinationStopCode
    ? getMinutesForService(destinationLoading ? null : destinationData, serviceNumber)
    : null;

  let statusSentence: string | undefined;
  if (boardingInfo.status !== 'success') {
    statusSentence = boardingInfo.sentence;
  } else if (destinationInfo && destinationInfo.status !== 'success') {
    statusSentence = destinationInfo.sentence;
  }

  const liveBoardingMinutes =
    boardingInfo.status === 'success' && boardingInfo.arrivalMinutes.length > 0
      ? boardingInfo.arrivalMinutes[0]
      : null;

  const liveDestMinutes =
    destinationInfo &&
    destinationInfo.status === 'success' &&
    destinationInfo.arrivalMinutes.length > 0
      ? destinationInfo.arrivalMinutes[0]
      : null;

  // Compute metrics if destination selected
  const calculationResult =
    destinationStopCode && serviceRoute
      ? computeRideMetrics(
          serviceRoute,
          boardingStopCode,
          destinationStopCode,
          Date.now(),
          liveBoardingMinutes,
          liveDestMinutes
        )
      : null;

  const boardingIndex = direction ? direction.stops.findIndex((s) => s.stopCode === boardingStopCode) : -1;
  const destinationIndex = destinationStopCode && direction
    ? direction.stops.findIndex((s) => s.stopCode === destinationStopCode)
    : -1;

  return (
    <aside
      id="ride-panel"
      aria-label={`Route and ride details for service ${serviceNumber}`}
      className="fixed inset-y-0 right-0 z-30 w-full md:w-[460px] lg:w-[490px] bg-white border-l border-zinc-200 flex flex-col transition-transform duration-200 ease-out"
    >
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            id="close-panel-btn"
            onClick={onClose}
            className="p-2 -ml-2 text-zinc-600 hover:text-zinc-900 active:text-red-600 transition-colors focus:outline-none shrink-0"
            aria-label="Back to stop search"
          >
            <ArrowLeft className="w-5 h-5 sm:hidden" />
            <X className="w-5 h-5 hidden sm:block" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center px-2 py-0.5 bg-red-600 text-white font-bold text-sm tracking-wide shrink-0">
                {serviceNumber}
              </span>
              <h2 className="text-sm font-semibold text-zinc-900 truncate">
                {destDisplayName ? `To ${destDisplayName}` : `Service ${serviceNumber}`}
              </h2>
            </div>
            {originDisplayName && (
              <p className="text-xs text-zinc-500 mt-0.5 truncate">
                Origin: {originDisplayName}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          id="text-close-btn"
          onClick={onClose}
          className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 uppercase tracking-wider px-2 py-1 shrink-0"
        >
          Close
        </button>
      </div>

      {/* Route Level Four-State Status Bar when not success */}
      {routeStatus !== 'success' ? (
        <div id="route-state-container" className="flex-1 p-8 text-center flex flex-col items-center justify-center">
          <p className="text-zinc-800 text-sm font-medium">{routeSentence}</p>
        </div>
      ) : !direction ? (
        <div id="no-direction-container" className="flex-1 p-8 text-center flex flex-col items-center justify-center">
          <p className="text-zinc-800 text-sm font-medium">
            Service {serviceNumber} does not appear to serve stop {boardingStopCode}.
          </p>
        </div>
      ) : (
        <>
          {/* Boarding Notice Bar with 4 explicit sentences for arrivals */}
          <div className="px-5 py-3 bg-zinc-50 border-b border-zinc-200 shrink-0">
            <div className="flex items-center justify-between">
              <div className="text-xs text-zinc-600">
                Boarding at{' '}
                <span className="font-semibold text-zinc-900">
                  {boardingStopDetails?.name || boardingStopCode}
                </span>
                <span className="text-zinc-400 ml-1">({boardingStopCode})</span>
              </div>

              {boardingInfo.status === 'success' ? (
                <div className="text-xs font-bold text-red-600">
                  Next: {boardingInfo.arrivalMinutes.map((m) => `${m} min`).join(', ')}
                </div>
              ) : null}
            </div>

            {boardingInfo.status !== 'success' && (
              <p
                id="boarding-status-sentence"
                className="mt-1 text-xs text-zinc-600 leading-snug"
              >
                {boardingInfo.sentence}
              </p>
            )}
          </div>

          {/* Scrollable Route Stops Timeline */}
          <div
            ref={scrollContainerRef}
            id="route-stops-list"
            className="flex-1 overflow-y-auto px-5 py-6 space-y-0"
          >
            <div className="relative">
              {direction.stops.map((routeStop, index) => {
                const stopInfo = stopsMap?.get(routeStop.stopCode);
                const isBoarding = index === boardingIndex;
                const isDestination = index === destinationIndex;
                const isBeforeBoarding = index < boardingIndex;
                const isAfterBoarding = index > boardingIndex;
                const isBetween =
                  destinationIndex > boardingIndex &&
                  index >= boardingIndex &&
                  index <= destinationIndex;

                const isLast = index === direction.stops.length - 1;
                const connectorIsJoined =
                  destinationIndex > boardingIndex &&
                  index >= boardingIndex &&
                  index < destinationIndex;

                return (
                  <div
                    key={`${routeStop.stopCode}-${index}`}
                    ref={isBoarding ? boardingRef : undefined}
                    id={`stop-node-${routeStop.stopCode}`}
                    className={`relative flex items-start group transition-colors ${
                      isBeforeBoarding ? 'opacity-35 select-none' : ''
                    }`}
                  >
                    {/* Vertical Transit Track */}
                    <div className="relative flex flex-col items-center mr-4 shrink-0 w-6">
                      {!isLast && (
                        <div
                          className={`absolute top-3 bottom-0 w-0.5 ${
                            connectorIsJoined ? 'bg-red-600 w-1 -left-[1px]' : 'bg-zinc-200'
                          }`}
                          style={{ height: 'calc(100% + 14px)' }}
                        />
                      )}

                      {/* Stop Node Icon/Dot */}
                      <div
                        className={`relative z-10 flex items-center justify-center my-1 rounded-full transition-all ${
                          isBoarding
                            ? 'w-6 h-6 bg-white border-2 border-red-600 ring-4 ring-red-100'
                            : isDestination
                            ? 'w-6 h-6 bg-red-600 text-white'
                            : isBetween
                            ? 'w-3 h-3 bg-red-600 mt-2'
                            : isAfterBoarding
                            ? 'w-3 h-3 bg-white border-2 border-zinc-400 mt-2 group-hover:border-zinc-900'
                            : 'w-2.5 h-2.5 bg-zinc-300 mt-2'
                        }`}
                      >
                        {isBoarding && <Bus className="w-3 h-3 text-red-600" />}
                        {isDestination && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </div>

                    {/* Stop Content Details */}
                    <div
                      onClick={() => {
                        if (isAfterBoarding) {
                          onSelectDestination(routeStop.stopCode);
                        }
                      }}
                      className={`flex-1 pb-6 pt-0.5 text-left transition-colors ${
                        isAfterBoarding
                          ? 'cursor-pointer hover:bg-zinc-50 -ml-2 pl-2 rounded'
                          : isBoarding
                          ? 'cursor-default'
                          : 'cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-semibold text-zinc-500">
                            {routeStop.stopCode}
                          </span>
                          <span
                            className={`text-sm sm:text-base font-semibold ${
                              isBoarding || isDestination
                                ? 'text-zinc-900 font-bold'
                                : isBetween
                                ? 'text-zinc-900'
                                : 'text-zinc-700'
                            }`}
                          >
                            {stopInfo?.name || `Stop ${routeStop.stopCode}`}
                          </span>

                          {/* State Badges */}
                          {isBoarding && (
                            <span className="px-2 py-0.5 text-[11px] font-bold bg-red-600 text-white uppercase tracking-wider">
                              Boarding
                            </span>
                          )}
                          {isDestination && (
                            <span className="px-2 py-0.5 text-[11px] font-bold bg-zinc-900 text-white uppercase tracking-wider">
                              Destination
                            </span>
                          )}
                        </div>

                        {/* Live arrival or distance tag */}
                        <div className="text-right shrink-0 text-xs">
                          {isBoarding ? (
                            boardingInfo.status === 'loading' ? (
                              <span className="text-zinc-400 font-mono">...</span>
                            ) : boardingInfo.status === 'success' &&
                              boardingInfo.arrivalMinutes.length > 0 ? (
                              <span className="font-bold text-red-600">
                                {boardingInfo.arrivalMinutes[0]} min
                              </span>
                            ) : (
                              <span className="text-zinc-400">~7 min</span>
                            )
                          ) : isDestination ? (
                            destinationLoading ? (
                              <span className="text-zinc-400 font-mono">...</span>
                            ) : destinationInfo &&
                              destinationInfo.status === 'success' &&
                              destinationInfo.arrivalMinutes.length > 0 ? (
                              <span className="font-bold text-zinc-900 font-mono">
                                {destinationInfo.arrivalMinutes[0]} min
                              </span>
                            ) : (
                              <span className="text-zinc-400 font-mono">
                                {routeStop.distanceKm} km
                              </span>
                            )
                          ) : (
                            <span className="text-zinc-400 font-mono">
                              {routeStop.distanceKm} km
                            </span>
                          )}
                        </div>
                      </div>

                      {stopInfo?.road && (
                        <p className="text-xs text-zinc-500 mt-0.5">{stopInfo.road}</p>
                      )}

                      {/* Tap prompt helper for eligible stops */}
                      {isAfterBoarding && !isDestination && !destinationStopCode && (
                        <span className="inline-block text-[11px] text-zinc-400 mt-1 hover:text-red-600">
                          Tap to select as destination
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pinned Bottom Result Bar */}
          <div className="shrink-0">
            <ResultBar
              calculation={calculationResult ? calculationResult.calculation : null}
              destinationName={destinationDetails?.name}
              hasDestination={Boolean(destinationStopCode)}
              statusSentence={statusSentence}
            />
          </div>
        </>
      )}
    </aside>
  );
};
