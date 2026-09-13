/**
 * Temporary utility endpoint to fetch and compile full datasets from LTA DataMall:
 * 1. ?set=stops  -> Paginates BusStops & cross-references BusRoutes to get full service lists per stop.
 *                   Sends Content-Disposition: attachment; filename="stops.json"
 * 2. ?set=routes -> Paginates BusRoutes and formats each service's directions with sequenced stops and distances.
 *                   Sends Content-Disposition: attachment; filename="routes.json"
 *                   (Also supports ?part=1 and ?part=2 if needed to avoid timeouts)
 *
 * Delete this file after downloading stops.json and routes.json and placing them into public/.
 */

export const maxDuration = 60; // Allow up to 60s for Vercel Serverless Functions

/**
 * Fetch a single page from LTA OData service with authentication and refusal check.
 */
async function fetchLtaPage(endpoint, apiKey, skip) {
  const url = `https://datamall2.mytransport.sg/ltaodataservice/${endpoint}?$skip=${skip}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'AccountKey': apiKey,
      'accept': 'application/json'
    }
  });

  if (!response.ok) {
    const upstreamStatus = response.status;
    let reason = `Upstream refused with HTTP ${upstreamStatus}`;
    try {
      const errorText = await response.text();
      if (errorText && errorText.trim().length > 0 && errorText.length < 200) {
        reason = `${reason}: ${errorText.trim()}`;
      }
    } catch (_) {}
    const err = new Error(reason);
    err.status = upstreamStatus;
    throw err;
  }

  const data = await response.json();
  return Array.isArray(data?.value) ? data.value : [];
}

/**
 * Fetch pages from an LTA endpoint in parallel batches of about ten.
 */
async function fetchAllPages(endpoint, apiKey, options = {}) {
  const batchSize = options.batchSize || 10;
  const startPage = options.startPage || 0;
  const maxPages = options.maxPages || 150;

  const allRecords = [];
  let currentPage = startPage;
  let hasMore = true;

  while (hasMore && (currentPage - startPage) < maxPages) {
    const batchSkips = [];
    for (let i = 0; i < batchSize; i++) {
      batchSkips.push((currentPage + i) * 500);
    }

    const batchResults = await Promise.all(
      batchSkips.map((skip) => fetchLtaPage(endpoint, apiKey, skip))
    );

    for (let i = 0; i < batchResults.length; i++) {
      const pageRecords = batchResults[i];
      if (pageRecords.length > 0) {
        allRecords.push(...pageRecords);
      }
      if (pageRecords.length < 500) {
        hasMore = false;
        break;
      }
    }

    currentPage += batchSize;
  }

  return allRecords;
}

export default async function handler(req, res) {
  // Ensure response helpers exist for dev middleware
  if (!res.status) {
    res.status = function (code) {
      res.statusCode = code;
      return this;
    };
  }
  if (!res.json) {
    res.json = function (data) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
      return this;
    };
  }

  // 1. BEFORE fetch: Check credential
  const apiKey = process.env.LTA_ACCOUNT_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'undefined') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'LTA_ACCOUNT_KEY environment variable is missing or empty'
    });
  }

  // 2. Parse query params
  const reqUrl = new URL(req.url || '', `http://${req.headers?.host || 'localhost'}`);
  const setParam = (req.query?.set || reqUrl.searchParams.get('set') || '').toLowerCase().trim();
  const partParam = (req.query?.part || reqUrl.searchParams.get('part') || '').toLowerCase().trim();

  if (setParam !== 'stops' && setParam !== 'routes') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Query parameter "set" is required. Use ?set=stops or ?set=routes'
    });
  }

  try {
    // -------------------------------------------------------------
    // SET = STOPS
    // -------------------------------------------------------------
    if (setParam === 'stops') {
      // 1. Fetch BusRoutes to cross-reference full services per stop
      const routeRecords = await fetchAllPages('BusRoutes', apiKey, { batchSize: 10 });
      const stopServicesMap = new Map();

      for (const r of routeRecords) {
        const stopCode = String(r.BusStopCode || '').trim();
        const svcNo = String(r.ServiceNo || '').trim();
        if (stopCode && svcNo) {
          if (!stopServicesMap.has(stopCode)) {
            stopServicesMap.set(stopCode, new Set());
          }
          stopServicesMap.get(stopCode).add(svcNo);
        }
      }

      // 2. Fetch BusStops
      const stopRecords = await fetchAllPages('BusStops', apiKey, { batchSize: 10 });

      const stops = stopRecords.map((s) => {
        const stopCode = String(s.BusStopCode || '').trim();
        const svcs = Array.from(stopServicesMap.get(stopCode) || []);
        svcs.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

        return {
          code: stopCode,
          name: String(s.Description || '').trim(),
          road: String(s.RoadName || '').trim(),
          latitude: typeof s.Latitude === 'number' ? s.Latitude : parseFloat(s.Latitude) || 0,
          longitude: typeof s.Longitude === 'number' ? s.Longitude : parseFloat(s.Longitude) || 0,
          services: svcs
        };
      });

      // Sort stops by stop code
      stops.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="stops.json"');
      res.setHeader('Cache-Control', 'no-cache, no-store');
      return res.status(200).send(JSON.stringify(stops, null, 2));
    }

    // -------------------------------------------------------------
    // SET = ROUTES
    // -------------------------------------------------------------
    if (setParam === 'routes') {
      let routeRecords;
      let filename = 'routes.json';

      if (partParam === '1') {
        filename = 'routes-part1.json';
        routeRecords = await fetchAllPages('BusRoutes', apiKey, {
          batchSize: 10,
          startPage: 0,
          maxPages: 28
        });
      } else if (partParam === '2') {
        filename = 'routes-part2.json';
        routeRecords = await fetchAllPages('BusRoutes', apiKey, {
          batchSize: 10,
          startPage: 28,
          maxPages: 40
        });
      } else {
        routeRecords = await fetchAllPages('BusRoutes', apiKey, { batchSize: 10 });
      }

      // Group by ServiceNo -> Direction -> Stops
      const servicesMap = new Map();

      for (const r of routeRecords) {
        const serviceNo = String(r.ServiceNo || '').trim();
        const directionId = Number(r.Direction) || 1;
        const stopSequence = Number(r.StopSequence) || 0;
        const stopCode = String(r.BusStopCode || '').trim();
        const distanceKm = r.Distance != null ? Math.round(Number(r.Distance) * 10) / 10 : 0;

        if (!serviceNo || !stopCode) continue;

        if (!servicesMap.has(serviceNo)) {
          servicesMap.set(serviceNo, new Map());
        }
        const dirMap = servicesMap.get(serviceNo);
        if (!dirMap.has(directionId)) {
          dirMap.set(directionId, []);
        }
        dirMap.get(directionId).push({
          sequence: stopSequence,
          stopCode,
          distanceKm
        });
      }

      // Format clean dictionary: Record<serviceNumber, BusService>
      const routes = {};
      const sortedServiceNumbers = Array.from(servicesMap.keys()).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
      );

      for (const svcNo of sortedServiceNumbers) {
        const dirMap = servicesMap.get(svcNo);
        const directions = [];
        const dirIds = Array.from(dirMap.keys()).sort((a, b) => a - b);

        for (const dirId of dirIds) {
          const stopList = dirMap.get(dirId);
          stopList.sort((a, b) => a.sequence - b.sequence);

          directions.push({
            directionId: dirId,
            stops: stopList.map((s) => ({
              stopCode: s.stopCode,
              distanceKm: s.distanceKm
            }))
          });
        }

        routes[svcNo] = {
          serviceNumber: svcNo,
          directions
        };
      }

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache, no-store');
      return res.status(200).send(JSON.stringify(routes, null, 2));
    }
  } catch (err) {
    res.setHeader('Content-Type', 'application/json');
    const status = err.status || 502;
    return res.status(status).json({
      upstreamStatus: status,
      reason: err.message || 'Upstream LTA DataMall service error'
    });
  }
}
