/**
 * Serverless health check for LTA DataMall API integration.
 * Reports:
 * - keyConfigured: boolean
 * - upstreamAnswered: boolean
 * - upstreamStatus: number | null
 *
 * Never outputs the credential or any portion of it.
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

  const apiKey = process.env.LTA_ACCOUNT_KEY;
  const keyConfigured = Boolean(apiKey && apiKey.trim() !== '' && apiKey !== 'undefined');

  if (!keyConfigured) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      keyConfigured: false,
      upstreamAnswered: false,
      upstreamStatus: null
    });
  }

  // Attempt lightweight upstream call to verify connectivity
  try {
    const upstreamRes = await fetch(
      'https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=54261',
      {
        method: 'GET',
        headers: {
          'AccountKey': apiKey,
          'accept': 'application/json'
        }
      }
    );

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      keyConfigured: true,
      upstreamAnswered: true,
      upstreamStatus: upstreamRes.status
    });
  } catch (err) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      keyConfigured: true,
      upstreamAnswered: false,
      upstreamStatus: null
    });
  }
}
