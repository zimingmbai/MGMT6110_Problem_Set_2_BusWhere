import React, { useState, useEffect } from 'react';
import { Info, ArrowRight } from 'lucide-react';
import { RideCalculation } from '../types';

interface ResultBarProps {
  calculation: RideCalculation | null;
  destinationName?: string;
  hasDestination: boolean;
}

export const ResultBar: React.FC<ResultBarProps> = ({
  calculation,
  destinationName,
  hasDestination,
}) => {
  const [showInfo, setShowInfo] = useState(false);

  // Close info tooltip when user taps anywhere else
  useEffect(() => {
    if (!showInfo) return;

    const handleDocumentClick = () => {
      setShowInfo(false);
    };

    // Small delay so the trigger click itself doesn't immediately dismiss
    const timer = setTimeout(() => {
      window.addEventListener('click', handleDocumentClick);
      window.addEventListener('touchstart', handleDocumentClick);
    }, 10);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleDocumentClick);
      window.removeEventListener('touchstart', handleDocumentClick);
    };
  }, [showInfo]);

  if (!hasDestination || !calculation) {
    return (
      <div
        id="result-bar-prompt"
        className="w-full bg-white border-t border-zinc-200 px-5 py-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-2.5 text-zinc-600">
          <ArrowRight className="w-5 h-5 text-red-600 shrink-0 animate-pulse" />
          <span className="text-sm sm:text-base font-medium text-zinc-800">
            Tap a stop along the route to set your destination
          </span>
        </div>
      </div>
    );
  }

  const { hasLiveTiming, minutesToBoarding, rideDurationMinutes, arrivalClockTime } = calculation;

  // Format representations strictly per spec:
  // Live: "26 min ride", "arrive 9:14am"
  // Worked-out: "~25 min ride", "arrive around 9:13am" in muted text colour
  const boardingArrivalText = hasLiveTiming
    ? `bus in ${minutesToBoarding} min`
    : `bus in ~${minutesToBoarding} min`;

  const rideLengthText = hasLiveTiming
    ? `${rideDurationMinutes} min ride`
    : `~${rideDurationMinutes} min ride`;

  const destinationArrivalText = hasLiveTiming
    ? `arrive ${arrivalClockTime}`
    : `arrive around ${arrivalClockTime}`;

  const infoMessage = hasLiveTiming
    ? 'Comes from current bus arrival times. Traffic conditions may vary.'
    : 'No live times available for this service right now; duration is estimated from distance.';

  return (
    <div
      id="result-bar-summary"
      className="relative w-full bg-white border-t-2 border-zinc-900 px-4 sm:px-5 py-4 z-20"
    >
      {/* Floating Info Balloon */}
      {showInfo && (
        <div
          id="ride-info-popover"
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-full left-4 right-4 mb-3 p-3.5 bg-zinc-900 text-zinc-100 text-xs sm:text-sm leading-relaxed rounded-none border border-zinc-800"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="font-normal">{infoMessage}</p>
            <button
              type="button"
              id="close-info-btn"
              onClick={() => setShowInfo(false)}
              className="text-zinc-400 hover:text-white p-1 text-xs shrink-0"
              aria-label="Dismiss info"
            >
              ✕
            </button>
          </div>
          <div className="absolute left-1/2 -bottom-1.5 w-3 h-3 bg-zinc-900 rotate-45 -translate-x-1/2 border-r border-b border-zinc-800" />
        </div>
      )}

      {/* Destination confirmation sub-header */}
      {destinationName && (
        <div className="text-[11px] sm:text-xs text-zinc-500 uppercase tracking-wider mb-2 font-medium truncate">
          To {destinationName} · {calculation.distanceKm} km
        </div>
      )}

      {/* Three Loudest Numbers Side-by-Side */}
      <div className="grid grid-cols-3 items-baseline gap-2 sm:gap-3 divide-x divide-zinc-200">
        {/* Number 1: Minutes until bus reaches boarding stop */}
        <div className="pr-1 sm:pr-2">
          <div className="text-base sm:text-xl md:text-2xl font-bold tracking-tight text-zinc-900 leading-tight">
            {boardingArrivalText}
          </div>
          <div className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wider mt-1 font-medium">
            At Boarding
          </div>
        </div>

        {/* Number 2: Ride length in minutes + Info control */}
        <div className="px-2 sm:px-3">
          <div className="flex items-center gap-1">
            <span
              className={`text-base sm:text-xl md:text-2xl font-bold tracking-tight leading-tight ${
                hasLiveTiming ? 'text-zinc-900' : 'text-zinc-400 font-medium'
              }`}
            >
              {rideLengthText}
            </span>

            {/* Info control (tap, not hover) */}
            <button
              type="button"
              id="ride-info-control-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowInfo((prev) => !prev);
              }}
              className="p-1 -mr-1 text-zinc-400 hover:text-zinc-900 active:text-red-600 rounded focus:outline-none"
              aria-label="How is this duration calculated?"
              title="Duration calculation info"
            >
              <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            </button>
          </div>
          <div className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wider mt-1 font-medium">
            Ride Length
          </div>
        </div>

        {/* Number 3: Clock time arrived at destination */}
        <div className="pl-2 sm:pl-3">
          <div
            className={`text-base sm:text-xl md:text-2xl font-bold tracking-tight leading-tight ${
              hasLiveTiming ? 'text-zinc-900' : 'text-zinc-400 font-medium'
            }`}
          >
            {destinationArrivalText}
          </div>
          <div className="text-[10px] sm:text-xs text-zinc-400 uppercase tracking-wider mt-1 font-medium">
            Destination
          </div>
        </div>
      </div>
    </div>
  );
};
