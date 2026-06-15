const { Op } = require('sequelize');
const { Route, Driver, Agency, Booking } = require('../models');
const { getAlgoliaClient, INDEX_NAME } = require('../config/algolia');

// Original database-based search implementation (fallback)
async function searchRoutesDatabase(source, destination, userId = null, filters = {}) {
  const where = {
    available: true,
    status: 'active',
    departureTime: { [Op.gte]: new Date() },
  };
  if (source) {
    where.source = { [Op.like]: `%${source}%` };
  }
  if (destination) {
    where.destination = { [Op.like]: `%${destination}%` };
  }
  const parsedPriceMin = filters.priceMin !== undefined && filters.priceMin !== '' ? parseFloat(filters.priceMin) : NaN;
  const parsedPriceMax = filters.priceMax !== undefined && filters.priceMax !== '' ? parseFloat(filters.priceMax) : NaN;

  if (!isNaN(parsedPriceMin)) {
    where.fare = { ...(where.fare || {}), [Op.gte]: parsedPriceMin };
  }
  if (!isNaN(parsedPriceMax)) {
    where.fare = { ...(where.fare || {}), [Op.lte]: parsedPriceMax };
  }

  if (filters.seats) {
    where.capacity = { [Op.gte]: parseInt(filters.seats, 10) };
  }

  const driverWhere = {};
  if (filters.vehicleTypes) {
    const types = filters.vehicleTypes.split(',').map(t => t.trim()).filter(Boolean);
    if (types.length > 0) {
      driverWhere.vehicleType = { [Op.in]: types };
    }
  }

  const routes = await Route.findAll({
    where,
    include: [
      {
        model: Driver,
        required: true,
        where: Object.keys(driverWhere).length > 0 ? driverWhere : undefined,
        include: [{ model: Agency, where: { active: true }, required: true }],
      },
    ],
  });

  return processRouteAvailability(routes, userId);
}

// Helper to run booking and exclusive lock checks on returned route objects
async function processRouteAvailability(routes, userId) {
  const data = await Promise.all(
    routes.map(async (route) => {
      const driverId = route.Driver?.id;
      const departureDate = route.departureTime
        ? new Date(route.departureTime).toISOString().split('T')[0]
        : null;

      let exclusivelyBooked = false;
      let bookedByMe = false;

      if (driverId && departureDate) {
        // Check if any OTHER user has an ACTIVE booking for this driver
        const otherBooking = await Booking.findOne({
          where: {
            driverId,
            travelDate: departureDate,
            status: { [Op.in]: ['Pending', 'Confirmed', 'On Trip'] },
            ...(userId ? { userId: { [Op.ne]: userId } } : {}),
          },
        });
        exclusivelyBooked = !!otherBooking;

        // Check if the current user has an ACTIVE booking for this route
        if (userId) {
          const myBooking = await Booking.findOne({
            where: {
              driverId,
              routeId: route.id,
              travelDate: departureDate,
              userId,
              status: { [Op.in]: ['Pending', 'Confirmed', 'On Trip'] },
            },
          });
          bookedByMe = !!myBooking;
        }
      }

      return {
        id: route.id,
        source: route.source,
        destination: route.destination,
        departureTime: route.departureTime,
        arrivalTime: route.arrivalTime,
        fare: route.fare,
        capacity: route.capacity,
        available: route.available,
        driverId: route.Driver?.id ?? null,
        driverName: route.Driver?.name ?? null,
        vehicleType: route.Driver?.vehicleType ?? null,
        agencyId: route.Driver?.Agency?.id ?? null,
        agencyName: route.Driver?.Agency?.name ?? null,
        exclusivelyBooked,
        bookedByMe,
      };
    })
  );

  if (data.length === 0) {
    return { data, message: 'No routes found for this destination' };
  }

  return { data };
}

// Primary search logic (Algolia query + fallback)
async function searchRoutes(source, destination, userId = null, filters = {}) {
  const client = getAlgoliaClient();
  if (!client) {
    // If Algolia is not initialized, use database search
    const result = await searchRoutesDatabase(source, destination, userId, filters);
    result.facetCounts = null;
    return result;
  }

  try {
    // 1. Build Algolia search query
    const query = [source, destination].filter(Boolean).join(' ');

    // 2. Build Algolia filters (available, active, future time)
    const algoliaFilters = [
      'available = 1',
      'status:active',
      `departureTimeTimestamp >= ${Math.floor(Date.now() / 1000)}`,
    ];

    const parsedPriceMin = filters.priceMin !== undefined && filters.priceMin !== '' ? parseFloat(filters.priceMin) : NaN;
    const parsedPriceMax = filters.priceMax !== undefined && filters.priceMax !== '' ? parseFloat(filters.priceMax) : NaN;

    if (!isNaN(parsedPriceMin)) {
      algoliaFilters.push(`fare >= ${parsedPriceMin}`);
    }
    if (!isNaN(parsedPriceMax)) {
      algoliaFilters.push(`fare <= ${parsedPriceMax}`);
    }

    if (filters.seats) {
      algoliaFilters.push(`capacity >= ${parseInt(filters.seats, 10)}`);
    }

    if (filters.vehicleTypes) {
      const types = filters.vehicleTypes.split(',').map(t => t.trim()).filter(Boolean);
      if (types.length > 0) {
        algoliaFilters.push(`(${types.map(t => `vehicleType:"${t}"`).join(' OR ')})`);
      }
    }

    console.log(`Querying Algolia with query "${query}" and filters "${algoliaFilters.join(' AND ')}"...`);

    // 3. Search single index (v5 SDK syntax)
    const searchResult = await client.searchSingleIndex({
      indexName: INDEX_NAME,
      searchParams: {
        query,
        filters: algoliaFilters.join(' AND '),
        facets: ['vehicleType'],
        hitsPerPage: 100,
      },
    });

    const routeIds = searchResult.hits.map((hit) => hit.id);
    if (routeIds.length === 0) {
      return { data: [], message: 'No routes found for this destination', facetCounts: searchResult.facets || null };
    }

    // 4. Retrieve database entities for availability checking
    const routes = await Route.findAll({
      where: { id: { [Op.in]: routeIds } },
      include: [
        {
          model: Driver,
          required: true,
          include: [{ model: Agency, where: { active: true }, required: true }],
        },
      ],
    });

    // Preserve the ranking order returned by Algolia hits
    const routesMap = new Map(routes.map((r) => [r.id, r]));
    const orderedRoutes = routeIds.map((id) => routesMap.get(id)).filter(Boolean);

    const result = await processRouteAvailability(orderedRoutes, userId);
    result.facetCounts = searchResult.facets || null;
    return result;
  } catch (err) {
    console.error('Algolia search failed, falling back to database search:', err.message);
    const result = await searchRoutesDatabase(source, destination, userId, filters);
    result.facetCounts = null;
    return result;
  }
}

module.exports = { searchRoutes };
