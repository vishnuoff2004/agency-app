const { Op, fn, col, literal } = require('sequelize');
const { Booking } = require('../models');
const { CacheService } = require('../cache/CacheService');
const redis = require('../config/redis');

const cache = CacheService(redis);
const ANALYTICS_CACHE_TTL = 300;

function buildAnalyticsCacheKey(startDate, endDate, agencyId = 'global') {
  return `analytics:bookings-by-date:${agencyId}:${startDate || '*'}:${endDate || '*'}`;
}

async function getBookingsByDate(startDate, endDate, user = {}) {
  let agencyId = 'global';
  let driverIds = [];

  if (user.role === 'agency_admin') {
    const { Agency, Driver } = require('../models');
    const agency = await Agency.findOne({ where: { adminId: user.id } });
    if (!agency) {
      return [];
    }
    agencyId = agency.id;
    const drivers = await Driver.findAll({ where: { agencyId: agency.id }, attributes: ['id'] });
    driverIds = drivers.map(d => d.id);
    if (driverIds.length === 0) {
      return [];
    }
  }

  const cacheKey = buildAnalyticsCacheKey(startDate, endDate, agencyId);
  const cached = await cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const where = {};
  if (startDate) {
    where.travelDate = { ...(where.travelDate || {}), [Op.gte]: startDate };
  }
  if (endDate) {
    where.travelDate = { ...(where.travelDate || {}), [Op.lte]: endDate };
  }

  if (user.role === 'agency_admin') {
    where.driverId = { [Op.in]: driverIds };
  }

  const results = await Booking.findAll({
    attributes: [
      [fn('DATE', col('travelDate')), 'date'],
      [fn('COUNT', col('id')), 'count'],
    ],
    where: Object.keys(where).length > 0 ? where : undefined,
    group: [fn('DATE', col('travelDate'))],
    order: [[fn('DATE', col('travelDate')), 'ASC']],
    raw: true,
  });

  const data = results.map(r => ({
    date: r.date,
    count: Number(r.count),
  }));

  await cache.set(cacheKey, data, ANALYTICS_CACHE_TTL);
  return data;
}

module.exports = { getBookingsByDate };