import { BusStop, BusService, RouteStop, RideCalculation, ServiceDirection } from '../types';

export type { BusStop, BusService, RouteStop, RideCalculation, ServiceDirection };

/**
 * Assumed average bus speed in km/h for Singapore urban roads with bus stops & traffic.
 * Used for estimating ride durations when live arrival timings are not available.
 */
export const AVERAGE_BUS_SPEED_KMH = 18;

/**
 * Assumed scheduled wait headway in minutes when no live bus arrival time is available.
 */
export const ASSUMED_SCHEDULED_HEADWAY_MIN = 7;

/**
 * Format a Date object as 12-hour clock string, e.g. "9:14am" or "10:05pm".
 */
export function formatClockTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const minuteString = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours}:${minuteString}${ampm}`;
}

/**
 * Helper to extract ServiceDirection array from a BusService object or direct array.
 */
function extractDirections(serviceOrDirections: BusService | ServiceDirection[] | null | undefined): ServiceDirection[] {
  if (!serviceOrDirections) return [];
  if (Array.isArray(serviceOrDirections)) return serviceOrDirections;
  if (Array.isArray(serviceOrDirections.directions)) return serviceOrDirections.directions;
  return [];
}

/**
 * Helper to get the correct direction of a service that serves a boarding stop.
 */
export function getServiceDirectionForBoarding(
  serviceOrDirections: BusService | ServiceDirection[] | null | undefined,
  boardingStopCode: string
): ServiceDirection | null {
  const directions = extractDirections(serviceOrDirections);
  if (!directions || directions.length === 0) return null;

  for (const dir of directions) {
    const idx = dir.stops.findIndex((s) => s.stopCode === boardingStopCode);
    // Boarding stop must exist and not be the very last stop (so user can travel downstream)
    if (idx !== -1 && idx < dir.stops.length - 1) {
      return dir;
    }
  }

  // Fallback if it's the last stop of dir 1, check other directions
  for (const dir of directions) {
    const idx = dir.stops.findIndex((s) => s.stopCode === boardingStopCode);
    if (idx !== -1) {
      return dir;
    }
  }

  return directions[0] || null;
}

/**
 * Computes ride duration, wait time, and clock arrival time between two stops on a route.
 * Strictly adheres to:
 * - "Do NOT store ride durations anywhere. Compute them:"
 * - "subtract one stop's arrival time from another's when both have times"
 * - "when they don't, subtract the two distances and divide by an assumed average bus speed"
 */
export function computeRideMetrics(
  serviceOrDirections: BusService | ServiceDirection[] | null | undefined,
  boardingStopCode: string,
  destinationStopCode: string,
  currentTimestamp: number = Date.now(),
  liveBoardingMinutes?: number | null,
  liveDestinationMinutes?: number | null
): { calculation: RideCalculation; direction: ServiceDirection } | null {
  const directions = extractDirections(serviceOrDirections);
  if (!directions || directions.length === 0) return null;

  // Find which direction contains boardingStopCode followed by destinationStopCode
  let matchedDirection: ServiceDirection | null = null;
  let bIndex = -1;
  let dIndex = -1;

  for (const dir of directions) {
    const b = dir.stops.findIndex((s) => s.stopCode === boardingStopCode);
    const d = dir.stops.findIndex((s) => s.stopCode === destinationStopCode);
    if (b !== -1 && d !== -1 && d > b) {
      matchedDirection = dir;
      bIndex = b;
      dIndex = d;
      break;
    }
  }

  // If destination is not downstream or not picked yet, return null
  if (!matchedDirection || bIndex === -1 || dIndex === -1 || dIndex <= bIndex) {
    return null;
  }

  const boardStop = matchedDirection.stops[bIndex];
  const destStop = matchedDirection.stops[dIndex];

  const distanceKm = Math.round((destStop.distanceKm - boardStop.distanceKm) * 10) / 10;

  // Check if live arrival times are provided and valid for both boarding and destination
  const hasLiveTimes =
    liveBoardingMinutes !== undefined &&
    liveBoardingMinutes !== null &&
    liveDestinationMinutes !== undefined &&
    liveDestinationMinutes !== null &&
    liveDestinationMinutes >= liveBoardingMinutes;

  if (hasLiveTimes) {
    const minutesToBoarding = liveBoardingMinutes;
    const destMinutes = liveDestinationMinutes;

    // Subtract one stop's arrival time from another's
    const rideDurationMinutes = Math.max(1, destMinutes - minutesToBoarding);

    // Destination arrival clock time = currentTime + dest arrival
    const arrivalDate = new Date(currentTimestamp + destMinutes * 60 * 1000);
    const arrivalClockTime = formatClockTime(arrivalDate);

    return {
      direction: matchedDirection,
      calculation: {
        hasLiveTiming: true,
        minutesToBoarding,
        rideDurationMinutes,
        arrivalClockTime,
        distanceKm,
        destinationStopCode,
        boardingStopCode,
      },
    };
  } else {
    // Distance based estimation:
    // Subtract two distances and divide by AVERAGE_BUS_SPEED_KMH
    const estimatedHours = distanceKm / AVERAGE_BUS_SPEED_KMH;
    const rideDurationMinutes = Math.max(1, Math.round(estimatedHours * 60));

    // Wait until boarding: if live boarding time is known use it, else fallback to schedule
    const minutesToBoarding =
      liveBoardingMinutes !== undefined && liveBoardingMinutes !== null
        ? liveBoardingMinutes
        : ASSUMED_SCHEDULED_HEADWAY_MIN;

    const totalMinutesToDestination = minutesToBoarding + rideDurationMinutes;
    const arrivalDate = new Date(currentTimestamp + totalMinutesToDestination * 60 * 1000);
    const arrivalClockTime = formatClockTime(arrivalDate);

    return {
      direction: matchedDirection,
      calculation: {
        hasLiveTiming: false,
        minutesToBoarding,
        rideDurationMinutes,
        arrivalClockTime,
        distanceKm,
        destinationStopCode,
        boardingStopCode,
      },
    };
  }
}
