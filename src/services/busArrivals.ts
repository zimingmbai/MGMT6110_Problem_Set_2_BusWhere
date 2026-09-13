/**
 * Client service to fetch real-time bus arrivals from /api/arrivals.
 * Follows strict single-call-per-bus-stop caching and handles:
 * 1) loading
 * 2) empty (upstream answered 200 with no buses running)
 * 3) refused (upstream 401/403 or non-2xx status)
 * 4) unreachable (502/503 or network failure)
 */

export interface LiveBus {
  estimatedArrival: string; // ISO datetime
  latitude: string | null;
  longitude: string | null;
}

export interface LiveServiceArrival {
  serviceNumber: string;
  nextBuses: LiveBus[];
}

export type ArrivalStatus = 'idle' | 'loading' | 'empty' | 'refused' | 'unreachable' | 'success';

export interface StopArrivalData {
  stopCode: string;
  status: ArrivalStatus;
  sentence?: string;
  services: LiveServiceArrival[];
  timestamp: number;
}

// In-memory cache per bus stop code
const stopCache: Map<string, StopArrivalData> = new Map();
const CACHE_TTL_MS = 20000; // 20 seconds, matching s-maxage=20

/**
 * Fetches bus arrival data for a single bus stop code.
 * Reuses cached data if fetched within the last 20 seconds.
 */
export async function getStopArrivals(busStopCode: string, forceRefresh = false): Promise<StopArrivalData> {
  const cleanCode = String(busStopCode).trim();
  const cached = stopCache.get(cleanCode);
  const now = Date.now();

  if (!forceRefresh && cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached;
  }

  try {
    const res = await fetch(`/api/arrivals?busStopCode=${encodeURIComponent(cleanCode)}`);

    if (res.ok) {
      const data = await res.json();
      const services: LiveServiceArrival[] = Array.isArray(data.services) ? data.services : [];

      const result: StopArrivalData = {
        stopCode: cleanCode,
        status: services.length > 0 ? 'success' : 'empty',
        sentence:
          services.length === 0 ? 'No buses are running on this service right now.' : undefined,
        services,
        timestamp: now,
      };

      stopCache.set(cleanCode, result);
      return result;
    }

    // Upstream refusal (401, 403, 400, etc.)
    if (res.status === 401 || res.status === 403 || res.status === 400) {
      const result: StopArrivalData = {
        stopCode: cleanCode,
        status: 'refused',
        sentence: 'The arrival service refused the request; showing distance-based estimate.',
        services: [],
        timestamp: now,
      };
      stopCache.set(cleanCode, result);
      return result;
    }

    // Upstream unreachable / 502 / 503 missing credentials
    const result: StopArrivalData = {
      stopCode: cleanCode,
      status: 'unreachable',
      sentence: 'The arrival service is currently unreachable; showing distance-based estimate.',
      services: [],
      timestamp: now,
    };
    stopCache.set(cleanCode, result);
    return result;
  } catch (_err) {
    // Network error / fetch failed
    const result: StopArrivalData = {
      stopCode: cleanCode,
      status: 'unreachable',
      sentence: 'The arrival service is currently unreachable; showing distance-based estimate.',
      services: [],
      timestamp: now,
    };
    stopCache.set(cleanCode, result);
    return result;
  }
}

/**
 * Helper to get the arrival minutes for a specific service at a stop.
 */
export function getMinutesForService(
  stopData: StopArrivalData | null | undefined,
  serviceNumber: string
): {
  status: ArrivalStatus;
  sentence: string;
  arrivalMinutes: number[];
  firstBusArrivalIso: string | null;
} {
  if (!stopData || stopData.status === 'loading') {
    return {
      status: 'loading',
      sentence: 'Fetching live bus arrival times...',
      arrivalMinutes: [],
      firstBusArrivalIso: null,
    };
  }

  if (stopData.status === 'refused') {
    return {
      status: 'refused',
      sentence: 'The arrival service refused the request; showing distance-based estimate.',
      arrivalMinutes: [],
      firstBusArrivalIso: null,
    };
  }

  if (stopData.status === 'unreachable') {
    return {
      status: 'unreachable',
      sentence: 'The arrival service is currently unreachable; showing distance-based estimate.',
      arrivalMinutes: [],
      firstBusArrivalIso: null,
    };
  }

  const service = stopData.services.find((s) => s.serviceNumber === serviceNumber);
  if (!service || !service.nextBuses || service.nextBuses.length === 0) {
    return {
      status: 'empty',
      sentence: 'No buses are running on this service right now.',
      arrivalMinutes: [],
      firstBusArrivalIso: null,
    };
  }

  const now = Date.now();
  const arrivalMinutes: number[] = [];
  let firstBusArrivalIso: string | null = null;

  for (const bus of service.nextBuses) {
    if (bus.estimatedArrival) {
      if (!firstBusArrivalIso) {
        firstBusArrivalIso = bus.estimatedArrival;
      }
      const busTime = new Date(bus.estimatedArrival).getTime();
      const diffMin = Math.max(0, Math.round((busTime - now) / 60000));
      arrivalMinutes.push(diffMin);
    }
  }

  if (arrivalMinutes.length === 0) {
    return {
      status: 'empty',
      sentence: 'No buses are running on this service right now.',
      arrivalMinutes: [],
      firstBusArrivalIso: null,
    };
  }

  return {
    status: 'success',
    sentence: `Next: ${arrivalMinutes.map((m) => `${m} min`).join(', ')}`,
    arrivalMinutes,
    firstBusArrivalIso,
  };
}
