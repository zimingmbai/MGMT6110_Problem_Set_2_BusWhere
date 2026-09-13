import React, { useEffect, useRef, useState } from 'react';
import { X, ArrowLeft, Bus, CheckCircle2 } from 'lucide-react';
import { STOP_MAP, computeRideMetrics, getServiceDirectionForBoarding } from '../data/busData';
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
}

export const RidePanel: React.FC<RidePanelProps> = ({
  serviceNumber,
  boardingStopCode,
  destinationStopCode,
  onSelectDestination,
  onClose,
}) => {
  const boardingRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Live arrival state for boarding stop and destination stop
  const [boardingData, setBoardingData] = useState<StopArrivalData | null>(null);
  const [boardingLoading, setBoardingLoading] = useState(true);

  const [destinationData, setDestinationData] = useState<StopArrivalData | null>(null);
  const [destinationLoading, setDestinationLoading] = useState(false);

  const direction = getServiceDirectionForBoarding(serviceNumber, boardingStopCode);
  const boardingStopDetails = STOP_MAP.get(boardingStopCode);

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
  }, [serviceNumber, boardingStopCode]);

  // Call 1: Fetch live arrivals for boarding stop
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

  // Call 2: Fetch live arrivals for destination stop when selected
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

  if (!direction) {
    return null;
  }

  const boardingIndex = direction.stops.findIndex((s) => s.stopCode === boardingStopCode);
  const destinationIndex = destinationStopCode
    ? direction.stops.findIndex((s) => s.stopCode === destinationStopCode)
    : -1;

  // Compute live service arrival details
  const boardingInfo = getMinutesForService(
    boardingLoading ? null : boardingData,
    serviceNumber
  );

  const destinationInfo = destinationStopCode
    ? getMinutesForService(destinationLoading ? null : destinationData, serviceNumber)
    : null;

  // Determine active status sentence for non-live or fallback scenarios
  let statusSentence: string | undefined;
  if (boardingInfo.status !== 'success') {
    statusSentence = boardingInfo.sentence;
  } else if (destinationInfo && destinationInfo.status !== 'success') {
    statusSentence = destinationInfo.sentence;
  }

  // Live minutes if available
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
  const calculationResult = destinationStopCode
    ? computeRideMetrics(
        serviceNumber,
        boardingStopCode,
        destinationStopCode,
        Date.now(),
        liveBoardingMinutes,
        liveDestMinutes
      )
    : null;

  const destinationDetails = destinationStopCode ? STOP_MAP.get(destinationStopCode) : null;

  return (
    <aside
      id="ride-panel"
      aria-label={`Route and ride details for service ${serviceNumber}`}
      className="fixed inset-y-0 right-0 z-30 w-full md:w-[460px] lg:w-[490px] bg-white border-l border-zinc-200 flex flex-col transition-transform duration-200 ease-out"
    >
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="close-panel-btn"
            onClick={onClose}
            className="p-2 -ml-2 text-zinc-600 hover:text-zinc-900 active:text-red-600 transition-colors focus:outline-none"
            aria-label="Back to stop search"
          >
            <ArrowLeft className="w-5 h-5 sm:hidden" />
            <X className="w-5 h-5 hidden sm:block" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center px-2 py-0.5 bg-red-600 text-white font-bold text-sm tracking-wide">
                {serviceNumber}
              </span>
              <h2 className="text-sm font-semibold text-zinc-900">
                To {direction.destinationName}
              </h2>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5 truncate">
              Origin: {direction.originName}
            </p>
          </div>
        </div>

        <button
          type="button"
          id="text-close-btn"
          onClick={onClose}
          className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 uppercase tracking-wider px-2 py-1"
        >
          Close
        </button>
      </div>

      {/* Boarding Notice Bar with 4 explicit sentences */}
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

        {/* Four distinct non-spinner sentences */}
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
            const stopInfo = STOP_MAP.get(routeStop.stopCode);
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
                key={routeStop.stopCode}
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
                        {stopInfo?.name || 'Bus Stop'}
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

                  <p className="text-xs text-zinc-500 mt-0.5">{stopInfo?.road}</p>

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
    </aside>
  );
};
