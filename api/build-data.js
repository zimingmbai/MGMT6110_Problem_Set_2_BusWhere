/**
 * Temporary utility endpoint to fetch and compile full datasets from LTA DataMall:
 * 1. ?set=stops  -> Pages sequentially through BusStops & BusRoutes to compile every stop and its services.
 *                   Sends Content-Disposition: attachment; filename="stops.json"
 * 2. ?set=routes -> Pages sequentially through BusRoutes and formats each service's directions with sequenced stops and distances.
 *                   Sends Content-Disposition: attachment; filename="routes.json"
 *                   (Accepts ?part=1 and ?part=2 to split work in halves if Vercel timeout is exceeded)
 *
 * Delete this file after downloading stops.json and routes.json and placing them into public/.
 */

export const maxDuration = 60; // Allow up to 60s for Vercel Serverless Functions

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch a single page from LTA OData service sequentially with authentication and full error diagnostic.
 */
async function fetchLtaPage(endpoint, apiKey, skip) {
  // Build $skip parameter strictly by string concatenation to prevent dollar-sign percent-encoding
  const url = 'https://datamall2.mytransport.sg/ltaodataservice/' + endpoint + '?$skip=' + skip;

  let response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        'AccountKey': apiKey,
        'accept': 'application/json'
      }
    });
  } catch (networkErr) {
    const err = new Error(`Network fetch failed for ${url}: ${networkErr.message}`);
    err.upstreamStatus = 502;
    err.url = url;
    err.responseBody = networkErr.message || 'Network fetch error';
    throw err;
  }

  if (!response.ok) {
    let body = '';
    try {
      body = await response.text();
    } catch (readErr) {
      body = `(Could not read response body: ${readErr.message})`;
    }
    const err = new Error(`LTA upstream returned HTTP ${response.status}`);
    err.upstreamStatus = response.status;
    err.url = url;
    err.responseBody = body;
    throw err;
  }

  try {
    const data = await response.json();
    return Array.isArray(data?.value) ? data.value : [];
  } catch (parseErr) {
    const err = new Error(`Failed to parse JSON response from LTA: ${parseErr.message}`);
    err.upstreamStatus = 502;
    err.url = url;
    err.responseBody = `JSON Parse Error: ${parseErr.message}`;
    throw err;
  }
}

/**
 * Fetch pages from an LTA endpoint strictly sequentially (never in parallel)
 * with a 200ms pause between requests to prevent upstream 500 errors under concurrent load.
 */
async function fetchAllPages(endpoint, apiKey, options = {}) {
  const startPage = options.startPage || 0;
  const maxPages = options.maxPages != null ? options.maxPages : Infinity;
  const pauseMs = options.pauseMs != null ? options.pauseMs : 200;

  const allRecords = [];
  let pageIndex = 0;

  while (pageIndex < maxPages) {
    // 200ms pause between requests (applied on subsequent iterations)
    if (pageIndex > 0 && pauseMs > 0) {
      await sleep(pauseMs);
    }

    const skip = (startPage + pageIndex) * 500;
    const records = await fetchLtaPage(endpoint, apiKey, skip);

    if (records.length > 0) {
      allRecords.push(...records);
    }

    // Stop if page returned fewer than 500 records
    if (records.length < 500) {
      break;
    }

    pageIndex++;
  }

  return allRecords;
}

export default async function handler(req, res) {
  // Ensure response helpers exist for dev middleware & serverless
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
  if (!res.send) {
    res.send = function (data) {
      res.end(data);
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
      // 1. Fetch BusRoutes sequentially to map full services per stop
      const routeRecords = await fetchAllPages('BusRoutes', apiKey, { pauseMs: 200 });
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

      // Short pause before moving to BusStops
      await sleep(200);

      // 2. Fetch BusStops sequentially
      const stopRecords = await fetchAllPages('BusStops', apiKey, { pauseMs: 200 });

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
          pauseMs: 200,
          startPage: 0,
          maxPages: 28
        });
      } else if (partParam === '2') {
        filename = 'routes-part2.json';
        routeRecords = await fetchAllPages('BusRoutes', apiKey, {
          pauseMs: 200,
          startPage: 28,
          maxPages: 40
        });
      } else {
        routeRecords = await fetchAllPages('BusRoutes', apiKey, { pauseMs: 200 });
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
    const status = err.upstreamStatus || err.status || 502;
    return res.status(status).json({
      error: 'Upstream LTA DataMall Error',
      upstreamStatus: status,
      url: err.url || null,
      responseBody: err.responseBody || err.message || null
    });
  }
}
