const { Route, Driver, Agency, User, Booking } = require('../models');
const { getAlgoliaClient, INDEX_NAME, INDEX_USERS, INDEX_AGENCIES, INDEX_BOOKINGS } = require('../config/algolia');

// Formatters for indexing
async function getRouteIndexObject(routeId) {
  const route = await Route.findByPk(routeId, {
    include: [
      {
        model: Driver,
        include: [Agency],
      },
    ],
  });

  if (!route) return null;

  return {
    objectID: route.id.toString(),
    id: route.id,
    source: route.source,
    destination: route.destination,
    departureTime: route.departureTime,
    departureTimeTimestamp: Math.floor(new Date(route.departureTime).getTime() / 1000),
    arrivalTime: route.arrivalTime,
    fare: parseFloat(route.fare),
    capacity: route.capacity,
    available: route.available ? 1 : 0, // store as 0/1 to match Algolia numeric filter
    status: (route.status || '').toLowerCase(), // lowercase for consistent filtering
    driverName: route.Driver?.name || '',
    vehicleType: route.Driver?.vehicleType || '',
    agencyName: route.Driver?.Agency?.name || '',
  };
}

async function getUserIndexObject(userId) {
  const user = await User.findByPk(userId);
  if (!user) return null;
  return {
    objectID: user.id.toString(),
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt,
    createdAtTimestamp: Math.floor(new Date(user.createdAt).getTime() / 1000),
  };
}

async function getAgencyIndexObject(agencyId) {
  const agency = await Agency.findByPk(agencyId);
  if (!agency) return null;
  return {
    objectID: agency.id.toString(),
    id: agency.id,
    name: agency.name,
    email: agency.email,
    phone: agency.phone,
    active: agency.active,
    createdBy: agency.createdBy,
    adminId: agency.adminId,
    createdAt: agency.createdAt,
    createdAtTimestamp: Math.floor(new Date(agency.createdAt).getTime() / 1000),
  };
}

async function getBookingIndexObject(bookingId) {
  const booking = await Booking.findByPk(bookingId, {
    include: [
      {
        model: Route,
        attributes: ['source', 'destination', 'departureTime', 'arrivalTime', 'fare', 'capacity'],
      },
      {
        model: Driver,
        attributes: ['name', 'phone', 'vehicleType', 'vehicleReg', 'licenseNo'],
        include: [{ model: Agency, attributes: ['name', 'phone', 'email'] }],
      },
      { model: User, attributes: ['name', 'email', 'phone'] },
    ],
  });

  if (!booking) return null;

  return {
    objectID: booking.id.toString(),
    id: booking.id,
    userId: booking.userId,
    status: booking.status,
    seatCount: booking.seatCount,
    travelDate: booking.travelDate,
    travelDateTimestamp: Math.floor(new Date(booking.travelDate).getTime() / 1000),
    cancelReason: booking.cancelReason,
    createdAt: booking.createdAt,
    createdAtTimestamp: Math.floor(new Date(booking.createdAt).getTime() / 1000),
    // Traveler
    travelerName: booking.User?.name || '',
    travelerEmail: booking.User?.email || '',
    travelerPhone: booking.User?.phone || '',
    // Route
    routeSource: booking.Route?.source || '',
    routeDestination: booking.Route?.destination || '',
    // Driver
    driverName: booking.Driver?.name || '',
    // Agency
    agencyName: booking.Driver?.Agency?.name || '',
    // Amount
    totalAmount: booking.Route?.fare ? (Number(booking.Route.fare) * booking.seatCount).toFixed(2) : null,
  };
}

// Sync Routes
async function syncRouteToAlgolia(routeId) {
  const client = getAlgoliaClient();
  if (!client) return;

  try {
    const obj = await getRouteIndexObject(routeId);
    if (obj) {
      await client.saveObject({ indexName: INDEX_NAME, body: obj });
      console.log(`Synced route ${routeId} to Algolia.`);
    }
  } catch (err) {
    console.error(`Error syncing route ${routeId} to Algolia:`, err.message);
  }
}

async function deleteRouteFromAlgolia(routeId) {
  const client = getAlgoliaClient();
  if (!client) return;

  try {
    await client.deleteObject({ indexName: INDEX_NAME, objectID: routeId.toString() });
    console.log(`Deleted route ${routeId} from Algolia.`);
  } catch (err) {
    console.error(`Error deleting route ${routeId} from Algolia:`, err.message);
  }
}

async function syncAllRoutesToAlgolia() {
  const client = getAlgoliaClient();
  if (!client) {
    console.log('Algolia is not configured. Rebuild skipped.');
    return;
  }

  try {
    const routes = await Route.findAll({ attributes: ['id'] });
    console.log(`Syncing all ${routes.length} routes to Algolia...`);

    const objects = [];
    for (const r of routes) {
      const obj = await getRouteIndexObject(r.id);
      if (obj) objects.push(obj);
    }

    if (objects.length > 0) {
      await client.saveObjects({ indexName: INDEX_NAME, objects });
      console.log(`Successfully synced all ${objects.length} routes to Algolia.`);
    }
  } catch (err) {
    console.error('Error in bulk sync to Algolia:', err.message);
  }
}

// Sync Users
async function syncUserToAlgolia(userId) {
  const client = getAlgoliaClient();
  if (!client) return;

  try {
    const obj = await getUserIndexObject(userId);
    if (obj) {
      await client.saveObject({ indexName: INDEX_USERS, body: obj });
      console.log(`Synced user ${userId} to Algolia.`);
    }
  } catch (err) {
    console.error(`Error syncing user ${userId} to Algolia:`, err.message);
  }
}

async function deleteUserFromAlgolia(userId) {
  const client = getAlgoliaClient();
  if (!client) return;

  try {
    await client.deleteObject({ indexName: INDEX_USERS, objectID: userId.toString() });
    console.log(`Deleted user ${userId} from Algolia.`);
  } catch (err) {
    console.error(`Error deleting user ${userId} from Algolia:`, err.message);
  }
}

async function syncAllUsersToAlgolia() {
  const client = getAlgoliaClient();
  if (!client) return;

  try {
    const users = await User.findAll({ attributes: ['id'] });
    console.log(`Syncing all ${users.length} users to Algolia...`);

    const objects = [];
    for (const u of users) {
      const obj = await getUserIndexObject(u.id);
      if (obj) objects.push(obj);
    }

    if (objects.length > 0) {
      await client.saveObjects({ indexName: INDEX_USERS, objects });
      console.log(`Successfully synced all ${objects.length} users to Algolia.`);
    }
  } catch (err) {
    console.error('Error in bulk sync users to Algolia:', err.message);
  }
}

// Sync Agencies
async function syncAgencyToAlgolia(agencyId) {
  const client = getAlgoliaClient();
  if (!client) return;

  try {
    const obj = await getAgencyIndexObject(agencyId);
    if (obj) {
      await client.saveObject({ indexName: INDEX_AGENCIES, body: obj });
      console.log(`Synced agency ${agencyId} to Algolia.`);
    }
  } catch (err) {
    console.error(`Error syncing agency ${agencyId} to Algolia:`, err.message);
  }
}

async function deleteAgencyFromAlgolia(agencyId) {
  const client = getAlgoliaClient();
  if (!client) return;

  try {
    await client.deleteObject({ indexName: INDEX_AGENCIES, objectID: agencyId.toString() });
    console.log(`Deleted agency ${agencyId} from Algolia.`);
  } catch (err) {
    console.error(`Error deleting agency ${agencyId} from Algolia:`, err.message);
  }
}

async function syncAllAgenciesToAlgolia() {
  const client = getAlgoliaClient();
  if (!client) return;

  try {
    const agencies = await Agency.findAll({ attributes: ['id'] });
    console.log(`Syncing all ${agencies.length} agencies to Algolia...`);

    const objects = [];
    for (const a of agencies) {
      const obj = await getAgencyIndexObject(a.id);
      if (obj) objects.push(obj);
    }

    if (objects.length > 0) {
      await client.saveObjects({ indexName: INDEX_AGENCIES, objects });
      console.log(`Successfully synced all ${objects.length} agencies to Algolia.`);
    }
  } catch (err) {
    console.error('Error in bulk sync agencies to Algolia:', err.message);
  }
}

// Sync Bookings
async function syncBookingToAlgolia(bookingId) {
  const client = getAlgoliaClient();
  if (!client) return;

  try {
    const obj = await getBookingIndexObject(bookingId);
    if (obj) {
      await client.saveObject({ indexName: INDEX_BOOKINGS, body: obj });
      console.log(`Synced booking ${bookingId} to Algolia.`);
    }
  } catch (err) {
    console.error(`Error syncing booking ${bookingId} to Algolia:`, err.message);
  }
}

async function deleteBookingFromAlgolia(bookingId) {
  const client = getAlgoliaClient();
  if (!client) return;

  try {
    await client.deleteObject({ indexName: INDEX_BOOKINGS, objectID: bookingId.toString() });
    console.log(`Deleted booking ${bookingId} from Algolia.`);
  } catch (err) {
    console.error(`Error deleting booking ${bookingId} from Algolia:`, err.message);
  }
}

async function syncAllBookingsToAlgolia() {
  const client = getAlgoliaClient();
  if (!client) return;

  try {
    const bookings = await Booking.findAll({ attributes: ['id'] });
    console.log(`Syncing all ${bookings.length} bookings to Algolia...`);

    const objects = [];
    for (const b of bookings) {
      const obj = await getBookingIndexObject(b.id);
      if (obj) objects.push(obj);
    }

    if (objects.length > 0) {
      await client.saveObjects({ indexName: INDEX_BOOKINGS, objects });
      console.log(`Successfully synced all ${objects.length} bookings to Algolia.`);
    }
  } catch (err) {
    console.error('Error in bulk sync bookings to Algolia:', err.message);
  }
}

module.exports = {
  syncRouteToAlgolia,
  deleteRouteFromAlgolia,
  syncAllRoutesToAlgolia,
  syncUserToAlgolia,
  deleteUserFromAlgolia,
  syncAllUsersToAlgolia,
  syncAgencyToAlgolia,
  deleteAgencyFromAlgolia,
  syncAllAgenciesToAlgolia,
  syncBookingToAlgolia,
  deleteBookingFromAlgolia,
  syncAllBookingsToAlgolia,
};

