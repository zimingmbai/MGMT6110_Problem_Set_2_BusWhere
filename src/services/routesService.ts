import { BusService } from '../types';

let cachedRoutes: Record<string, BusService> | null = null;
let fetchPromise: Promise<Record<string, BusService> | null> | null = null;

export async function fetchRoutesData(): Promise<Record<string, BusService> | null> {
  if (cachedRoutes) return cachedRoutes;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const res = await fetch('/routes.json');
      if (!res.ok) return null;
      const data = await res.json();
      cachedRoutes = data;
      return data;
    } catch {
      return null;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

export function getCachedRoutes(): Record<string, BusService> | null {
  return cachedRoutes;
}
