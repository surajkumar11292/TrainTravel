const logger = require('../config/logger');
const { config } = require('.');
const https = require('https');
const http = require('http');

// ─── Elasticsearch (optional) ────────────────────────────────────────────────

const ES_ENABLED = !!config.ELASTICSEARCH_URL;
let esClient;

if (ES_ENABLED) {
     try {
          const { Client } = require('@elastic/elasticsearch');
          esClient = new Client({ node: config.ELASTICSEARCH_URL });
          logger.info('Elasticsearch enabled');
     } catch (e) {
          logger.warn('Elasticsearch client init failed, using DB fallback');
     }
}

// ─── Admin Service HTTP Client (fallback) ────────────────────────────────────

const ADMIN_URL = config.ADMIN_SERVICE_URL || '';
const INTERNAL_KEY = config.INTERNAL_SERVICE_KEY || '';

function httpGet(url) {
     return new Promise((resolve, reject) => {
          const mod = url.startsWith('https') ? https : http;
          const req = mod.get(url, { headers: { 'x-internal-service-key': INTERNAL_KEY } }, (res) => {
               let data = '';
               res.on('data', chunk => data += chunk);
               res.on('end', () => {
                    try {
                         resolve(JSON.parse(data));
                    } catch (e) {
                         reject(new Error('Invalid JSON from admin service'));
                    }
               });
          });
          req.on('error', reject);
          req.setTimeout(10000, () => { req.destroy(); reject(new Error('Admin service timeout')); });
     });
}

// ─── DB Fallback: Fetch stations from admin service ──────────────────────────

let stationsCache = null;
let stationsCacheAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

async function getStationsFromDB() {
     if (stationsCache && Date.now() - stationsCacheAt < CACHE_TTL_MS) {
          return stationsCache;
     }
     try {
          const res = await httpGet(`${ADMIN_URL}/station?limit=200`);
          const stations = (res.data || []).map(s => ({
               stationId: s.id,
               name: s.name,
               code: s.code,
               city: s.city,
               state: s.state,
          }));
          stationsCache = stations;
          stationsCacheAt = Date.now();
          return stations;
     } catch (err) {
          logger.error('Failed to fetch stations from admin service', { error: err.message });
          return stationsCache || [];
     }
}

// ─── DB Fallback: Fetch trains+routes+schedules from admin ───────────────────

let trainsCache = null;
let trainsCacheAt = 0;

async function getTrainsFromDB() {
     if (trainsCache && Date.now() - trainsCacheAt < CACHE_TTL_MS) {
          return trainsCache;
     }
     try {
          const [trainsRes, schedulesRes] = await Promise.all([
               httpGet(`${ADMIN_URL}/train`),
               httpGet(`${ADMIN_URL}/schedule`),
          ]);
          const trains = trainsRes.data || [];
          const schedules = schedulesRes.data || [];

          // Group schedules by trainId
          const scheduleMap = {};
          for (const s of schedules) {
               if (!scheduleMap[s.trainId]) scheduleMap[s.trainId] = [];
               scheduleMap[s.trainId].push(s);
          }

          const result = trains.map(t => ({
               trainId: t.id,
               trainNumber: t.trainNumber,
               trainName: t.trainName,
               seats: t.seats || [],
               route: t.route
                    ? (t.route.routeStations || []).map(rs => ({
                         stationId: rs.station.id,
                         stationName: rs.station.name,
                         stationCode: rs.station.code,
                         sequenceNumber: rs.sequenceNumber,
                         arrivalTime: rs.arrivalTime,
                         departureTime: rs.departureTime,
                         distanceFromOrigin: rs.distanceFromOrigin,
                    }))
                    : [],
               schedules: (scheduleMap[t.id] || []).map(s => ({
                    scheduleId: s.id,
                    departureDate: s.departureDate,
                    status: s.status,
               })),
          }));

          trainsCache = result;
          trainsCacheAt = Date.now();
          return result;
     } catch (err) {
          logger.error('Failed to fetch trains from admin service', { error: err.message });
          return trainsCache || [];
     }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalize(d) {
     return new Date(d).toISOString().slice(0, 10);
}

function matchesQuery(text, query) {
     if (!text) return false;
     return text.toLowerCase().includes(query.toLowerCase());
}

function resolveStationFromList(input, stations) {
     const q = input.toLowerCase().trim();
     // Exact code match
     const byCode = stations.find(s => s.code && s.code.toLowerCase() === q);
     if (byCode) return byCode;
     // Exact name match
     const byName = stations.find(s => s.name && s.name.toLowerCase() === q);
     if (byName) return byName;
     // Partial match on name or city
     const partial = stations.find(s =>
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.city && s.city.toLowerCase().includes(q))
     );
     return partial || null;
}

// ─── Autocomplete Station (DB fallback) ──────────────────────────────────────

const autocompleteStationDB = async (prefix) => {
     const stations = await getStationsFromDB();
     const q = prefix.toLowerCase().trim();
     return stations
          .filter(s =>
               (s.name && s.name.toLowerCase().includes(q)) ||
               (s.code && s.code.toLowerCase().startsWith(q)) ||
               (s.city && s.city.toLowerCase().includes(q))
          )
          .slice(0, 10)
          .map(s => ({ name: s.name, code: s.code, stationId: s.stationId, city: s.city }));
};

// ─── Search Trains (DB fallback) ─────────────────────────────────────────────

const searchTrainsDB = async (from, to, date) => {
     const [stations, trains] = await Promise.all([getStationsFromDB(), getTrainsFromDB()]);

     const fromStation = resolveStationFromList(from, stations);
     const toStation = resolveStationFromList(to, stations);

     if (!fromStation) return { trains: [], message: `Station "${from}" not found` };
     if (!toStation) return { trains: [], message: `Station "${to}" not found` };

     const results = [];

     for (const train of trains) {
          if (!train.route || train.route.length === 0) continue;

          const fromStop = train.route.find(r => r.stationId === fromStation.stationId);
          const toStop = train.route.find(r => r.stationId === toStation.stationId);

          if (!fromStop || !toStop) continue;
          if (fromStop.sequenceNumber >= toStop.sequenceNumber) continue;

          // Build seat summary
          const seatSummary = { total: 0, LOWER: 0, MIDDLE: 0, UPPER: 0, SIDE_LOWER: 0, SIDE_UPPER: 0 };
          for (const seat of train.seats) {
               seatSummary.total++;
               if (seatSummary[seat.seatType] !== undefined) seatSummary[seat.seatType]++;
          }

          // Find matching schedule
          let schedule = null;
          if (date && train.schedules.length > 0) {
               schedule = train.schedules.find(
                    s => s.status === 'ACTIVE' && normalize(s.departureDate) === date
               ) || null;
          }

          results.push({
               trainId: train.trainId,
               trainNumber: train.trainNumber,
               trainName: train.trainName,
               from: {
                    name: fromStop.stationName,
                    code: fromStop.stationCode,
                    departure: fromStop.departureTime,
                    stationId: fromStop.stationId,
                    sequenceNumber: fromStop.sequenceNumber,
               },
               to: {
                    name: toStop.stationName,
                    code: toStop.stationCode,
                    arrival: toStop.arrivalTime,
                    stationId: toStop.stationId,
                    sequenceNumber: toStop.sequenceNumber,
               },
               seatSummary,
               schedule,
          });
     }

     return {
          from: { resolved: fromStation.name, code: fromStation.code },
          to: { resolved: toStation.name, code: toStation.code },
          date: date || 'any',
          count: results.length,
          trains: results,
     };
};

// ═══════════════════════════════════════════════════
//  INDEX OPERATIONS (called by Kafka consumer — ES only)
// ═══════════════════════════════════════════════════

const indexStation = async (event) => {
     if (!ES_ENABLED || !esClient) return;
     const { esClient: es, STATION_INDEX } = require('./elasticsearch_client');
     const station = event.data;
     if (!station) return;
     try {
          await esClient.index({
               index: 'stations',
               id: station.id,
               document: {
                    stationId: station.id,
                    name: station.name,
                    code: station.code,
                    city: station.city,
                    suggest: { input: [station.name, station.code, station.city].filter(Boolean), weight: 10 },
               },
               refresh: true,
          });
          // Invalidate cache
          stationsCache = null;
          logger.info(`Indexed station ${station.name}`);
     } catch (err) {
          logger.error(`Failed to index station: ${err.message}`);
     }
};

const indexTrainRoute = async () => { trainsCache = null; };
const indexSchedule = async () => { trainsCache = null; };
const cancelSchedule = async () => { trainsCache = null; };
const updateSeatAvailability = async () => { trainsCache = null; };

// ═══════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════

const autocompleteStation = async (prefix) => {
     if (ES_ENABLED && esClient) {
          try {
               const { STATION_INDEX } = require('../config/elasticsearch');
               const result = await esClient.search({
                    index: STATION_INDEX,
                    suggest: {
                         station_suggest: {
                              prefix,
                              completion: { field: 'suggest', fuzzy: { fuzziness: 'AUTO' }, size: 10 },
                         },
                    },
               });
               const options = result.suggest.station_suggest[0]?.options || [];
               if (options.length > 0) {
                    return options.map(o => ({ name: o._source.name, code: o._source.code, stationId: o._source.stationId }));
               }
          } catch (err) {
               logger.warn('ES autocomplete failed, falling back to DB', { error: err.message });
          }
     }
     return autocompleteStationDB(prefix);
};

const searchTrains = async (from, to, date) => {
     if (ES_ENABLED && esClient) {
          try {
               const { searchTrainsES } = require('./search.service.es');
               return await searchTrainsES(from, to, date);
          } catch (err) {
               logger.warn('ES search failed, falling back to DB', { error: err.message });
          }
     }
     return searchTrainsDB(from, to, date);
};

const getAllStations = async () => {
     return getStationsFromDB();
};

const getAllTrains = async () => {
     return getTrainsFromDB();
};

module.exports = {
     indexStation,
     indexTrainRoute,
     indexSchedule,
     cancelSchedule,
     updateSeatAvailability,
     searchTrains,
     autocompleteStation,
     getAllStations,
     getAllTrains,
};
