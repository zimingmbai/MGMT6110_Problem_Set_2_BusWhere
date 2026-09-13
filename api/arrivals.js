/**
 * Serverless function for LTA DataMall Bus Arrival API v3.
 * Fetches real-time bus arrivals for a given bus stop code.
 *
 * Requirements:
 * - Reads LTA_ACCOUNT_KEY from environment variables.
 * - Returns 503 if LTA_ACCOUNT_KEY is missing or empty, without calling upstream.
 * - Checks response.ok before reading body to handle non-2xx refusals without throwing.
 * - Sets Cache-Control: s-maxage=20, stale-while-revalidate=40.
 * - Returns only the fields needed by the screen (serviceNumber, nextBuses with estimatedArrival, latitude, longitude).
 */

export default async function handler(req, res) {
  // Ensure helper methods exist when running in Connect/Vite dev middleware
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

  // 2. Parse query parameters
  const reqUrl = new URL(req.url || '', `http://${req.headers?.host || 'localhost'}`);
  const busStopCode =
    req.query?.busStopCode ||
    req.query?.BusStopCode ||
    reqUrl.searchParams.get('busStopCode') ||
    reqUrl.searchParams.get('BusStopCode');

  if (!busStopCode) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(400).json({
      error: 'Bad Request',
      message: 'busStopCode query parameter is required'
    });
  }

  const upstreamUrl = new URL('https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival');
  upstreamUrl.searchParams.set('BusStopCode', String(busStopCode).trim());

  const serviceNo =
    req.query?.serviceNo ||
    req.query?.ServiceNo ||
    reqUrl.searchParams.get('serviceNo') ||
    reqUrl.searchParams.get('ServiceNo');

  if (serviceNo) {
    upstreamUrl.searchParams.set('ServiceNo', String(serviceNo).trim());
  }

  // 3. Fetch from LTA DataMall
  let response;
  try {
    response = await fetch(upstreamUrl.toString(), {
      method: 'GET',
      headers: {
        'AccountKey': apiKey,
        'accept': 'application/json'
      }
    });
  } catch (fetchErr) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(502).json({
      error: 'Bad Gateway',
      reason: 'Upstream LTA DataMall service is unreachable'
    });
  }

  // 4. AFTER fetch: Check response.ok before reading JSON
  if (!response.ok) {
    const upstreamStatus = response.status;
    let reason = `Upstream refused with HTTP ${upstreamStatus}`;
    try {
      const errorText = await response.text();
      if (errorText && errorText.trim().length > 0 && errorText.length < 200) {
        reason = `${reason}: ${errorText.trim()}`;
      }
    } catch (_) {
      // Ignore body read error on refusal
    }
    res.setHeader('Content-Type', 'application/json');
    return res.status(upstreamStatus).json({
      upstreamStatus,
      reason
    });
  }

  // 5. Parse response body
  let data;
  try {
    data = await response.json();
  } catch (parseErr) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(502).json({
      upstreamStatus: response.status,
      reason: 'Upstream returned invalid JSON'
    });
  }

  // 6. Return only the fields needed by the screen
  const rawServices = Array.isArray(data?.Services) ? data.Services : [];

  const parseBus = (bus) => {
    if (!bus || !bus.EstimatedArrival) return null;
    return {
      estimatedArrival: bus.EstimatedArrival,
      latitude: bus.Latitude || null,
      longitude: bus.Longitude || null
    };
  };

  const services = rawServices.map((svc) => {
    const nextBuses = [
      parseBus(svc.NextBus),
      parseBus(svc.NextBus2),
      parseBus(svc.NextBus3)
    ].filter((b) => b !== null && Boolean(b.estimatedArrival));

    return {
      serviceNumber: svc.ServiceNo,
      nextBuses
    };
  });

  // 7. Cache headers and response
  res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=40');
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({
    busStopCode: String(busStopCode).trim(),
    services
  });
}
