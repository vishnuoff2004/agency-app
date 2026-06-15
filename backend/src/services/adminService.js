const { User, Agency, Driver, Booking, Route, BookingStatusHistory, Sequelize } = require('../models');
const { Op } = Sequelize;
const { getAlgoliaClient, INDEX_USERS, INDEX_AGENCIES, INDEX_BOOKINGS } = require('../config/algolia');

async function getUsers(page, limit, search) {
  if (page === undefined && limit === undefined && !search) {
    return User.findAll({ attributes: { exclude: ['password'] } });
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const client = getAlgoliaClient();

  if (search && client) {
    try {
      const searchResult = await client.searchSingleIndex({
        indexName: INDEX_USERS,
        searchParams: {
          query: search,
          hitsPerPage: limitNum,
          page: pageNum - 1,
        },
      });

      const userIds = searchResult.hits.map(h => h.id);
      const totalItems = searchResult.nbHits;
      const totalPages = searchResult.nbPages;

      if (userIds.length === 0) {
        return { data: [], totalPages: 0, currentPage: pageNum, totalItems: 0 };
      }

      const users = await User.findAll({
        where: { id: { [Op.in]: userIds } },
        attributes: { exclude: ['password'] },
      });

      // Preserve ranking order
      const usersMap = new Map(users.map(u => [u.id, u]));
      const orderedUsers = userIds.map(id => usersMap.get(id)).filter(Boolean);

      return {
        data: orderedUsers,
        totalPages,
        currentPage: pageNum,
        totalItems,
      };
    } catch (err) {
      console.error('Algolia user search failed, falling back to DB:', err.message);
    }
  }

  // Fallback DB Query
  const offset = (pageNum - 1) * limitNum;
  const where = {};
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
      { role: { [Op.like]: `%${search}%` } },
    ];
  }

  const { rows, count } = await User.findAndCountAll({
    where,
    attributes: { exclude: ['password'] },
    limit: limitNum,
    offset,
  });

  return {
    data: rows,
    totalPages: Math.ceil(count / limitNum),
    currentPage: pageNum,
    totalItems: count,
  };
}

async function toggleUserStatus(adminId, userId) {
  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  user.active = !user.active;
  await user.save();
  return user;
}

async function getAgencies(page, limit, search) {
  if (page === undefined && limit === undefined && !search) {
    return Agency.findAll({ order: [['createdAt', 'DESC']] });
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const client = getAlgoliaClient();

  if (search && client) {
    try {
      const searchResult = await client.searchSingleIndex({
        indexName: INDEX_AGENCIES,
        searchParams: {
          query: search,
          hitsPerPage: limitNum,
          page: pageNum - 1,
        },
      });

      const agencyIds = searchResult.hits.map(h => h.id);
      const totalItems = searchResult.nbHits;
      const totalPages = searchResult.nbPages;

      if (agencyIds.length === 0) {
        return { data: [], totalPages: 0, currentPage: pageNum, totalItems: 0 };
      }

      const agencies = await Agency.findAll({
        where: { id: { [Op.in]: agencyIds } },
      });

      // Preserve ranking order
      const agenciesMap = new Map(agencies.map(a => [a.id, a]));
      const orderedAgencies = agencyIds.map(id => agenciesMap.get(id)).filter(Boolean);

      return {
        data: orderedAgencies,
        totalPages,
        currentPage: pageNum,
        totalItems,
      };
    } catch (err) {
      console.error('Algolia agency search failed, falling back to DB:', err.message);
    }
  }

  // Fallback DB Query
  const offset = (pageNum - 1) * limitNum;
  const where = {};
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
    ];
  }

  const { rows, count } = await Agency.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: limitNum,
    offset,
  });

  return {
    data: rows,
    totalPages: Math.ceil(count / limitNum),
    currentPage: pageNum,
    totalItems: count,
  };
}

async function createAgency(adminId, data) {
  const agency = await Agency.create({
    name: data.name,
    email: data.email,
    phone: data.phone,
    createdBy: adminId,
    adminId: data.adminId || null,
  });
  return agency;
}

async function updateAgency(adminId, agencyId, data) {
  const agency = await Agency.findByPk(agencyId);
  if (!agency) {
    const err = new Error('Agency not found');
    err.status = 404;
    throw err;
  }
  const allowedFields = ['name', 'email', 'phone'];
  const updates = {};
  allowedFields.forEach(f => {
    if (data[f] !== undefined) updates[f] = data[f];
  });
  await agency.update(updates);
  return agency;
}

async function deactivateAgency(adminId, agencyId) {
  const agency = await Agency.findByPk(agencyId);
  if (!agency) {
    const err = new Error('Agency not found');
    err.status = 404;
    throw err;
  }
  agency.active = !agency.active;
  await agency.save();

  if (!agency.active) {
    const driverIds = await Driver.findAll({ where: { agencyId }, attributes: ['id'] });
    const ids = driverIds.map(d => d.id);

    const pendingBookings = await Booking.findAll({
      where: { driverId: { [Op.in]: ids }, status: 'Pending' },
    });
    for (const booking of pendingBookings) {
      const prevStatus = booking.status;
      booking.status = 'Cancelled';
      booking.cancelReason = 'Agency deactivated';
      await booking.save();
      await BookingStatusHistory.create({
        bookingId: booking.id,
        fromStatus: prevStatus,
        toStatus: 'Cancelled',
        changedBy: adminId,
      });
    }
  }

  return agency;
}

function formatBookingList(bookings) {
  return bookings.map(b => ({
    id: b.id,
    status: b.status,
    seatCount: b.seatCount,
    travelDate: b.travelDate,
    cancelReason: b.cancelReason,
    createdAt: b.createdAt,
    // Traveler
    travelerName: b.User?.name || null,
    travelerEmail: b.User?.email || null,
    travelerPhone: b.User?.phone || null,
    // Route
    routeSource: b.Route?.source || null,
    routeDestination: b.Route?.destination || null,
    routeDeparture: b.Route?.departureTime || null,
    routeArrival: b.Route?.arrivalTime || null,
    fare: b.Route?.fare || null,
    totalAmount: b.Route?.fare ? (Number(b.Route.fare) * b.seatCount).toFixed(2) : null,
    // Driver
    driverName: b.Driver?.name || null,
    driverPhone: b.Driver?.phone || null,
    vehicleType: b.Driver?.vehicleType || null,
    vehicleReg: b.Driver?.vehicleReg || null,
    licenseNo: b.Driver?.licenseNo || null,
    // Agency
    agencyName: b.Driver?.Agency?.name || null,
    agencyPhone: b.Driver?.Agency?.phone || null,
    agencyEmail: b.Driver?.Agency?.email || null,
  }));
}

async function getAllBookings(page, limit, search) {
  const includeOptions = [
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
  ];

  if (page === undefined && limit === undefined && !search) {
    const bookings = await Booking.findAll({
      include: includeOptions,
      order: [['createdAt', 'DESC']],
    });
    return formatBookingList(bookings);
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const client = getAlgoliaClient();

  if (search && client) {
    try {
      const searchResult = await client.searchSingleIndex({
        indexName: INDEX_BOOKINGS,
        searchParams: {
          query: search,
          hitsPerPage: limitNum,
          page: pageNum - 1,
        },
      });

      const bookingIds = searchResult.hits.map(h => h.id);
      const totalItems = searchResult.nbHits;
      const totalPages = searchResult.nbPages;

      if (bookingIds.length === 0) {
        return { data: [], totalPages: 0, currentPage: pageNum, totalItems: 0 };
      }

      const bookings = await Booking.findAll({
        where: { id: { [Op.in]: bookingIds } },
        include: includeOptions,
      });

      // Preserve ranking order
      const bookingsMap = new Map(bookings.map(b => [b.id, b]));
      const orderedBookings = bookingIds.map(id => bookingsMap.get(id)).filter(Boolean);

      return {
        data: formatBookingList(orderedBookings),
        totalPages,
        currentPage: pageNum,
        totalItems,
      };
    } catch (err) {
      console.error('Algolia booking search failed, falling back to DB:', err.message);
    }
  }

  // Fallback DB Query
  const offset = (pageNum - 1) * limitNum;
  const where = {};
  if (search) {
    where[Op.or] = [
      { id: { [Op.like]: `%${search}%` } },
      { status: { [Op.like]: `%${search}%` } },
      { '$User.name$': { [Op.like]: `%${search}%` } },
      { '$User.email$': { [Op.like]: `%${search}%` } },
      { '$User.phone$': { [Op.like]: `%${search}%` } },
      { '$Route.source$': { [Op.like]: `%${search}%` } },
      { '$Route.destination$': { [Op.like]: `%${search}%` } },
      { '$Driver.name$': { [Op.like]: `%${search}%` } },
      { '$Driver.Agency.name$': { [Op.like]: `%${search}%` } },
    ];
  }

  const { rows, count } = await Booking.findAndCountAll({
    where,
    include: includeOptions,
    order: [['createdAt', 'DESC']],
    limit: limitNum,
    offset,
    subQuery: false,
  });

  return {
    data: formatBookingList(rows),
    totalPages: Math.ceil(count / limitNum),
    currentPage: pageNum,
    totalItems: count,
  };
}

async function adminCancelBooking(adminId, bookingId, reason) {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }
  const prevStatus = booking.status;
  booking.status = 'Cancelled';
  booking.cancelReason = reason || 'Cancelled by admin';
  booking.cancelledBy = adminId;
  await booking.save();
  await BookingStatusHistory.create({
    bookingId: booking.id,
    fromStatus: prevStatus,
    toStatus: 'Cancelled',
    changedBy: adminId,
  });
  return booking;
}

async function getDashboardData() {
  const totalUsers = await User.count();
  const totalAgencies = await Agency.count();
  const totalActiveBookings = await Booking.count({
    where: { status: { [Op.notIn]: ['Cancelled', 'Completed'] } },
  });
  const statuses = ['Pending', 'Confirmed', 'On Trip', 'Completed', 'Cancelled'];
  const counts = await Promise.all(
    statuses.map(status => Booking.count({ where: { status } }))
  );
  const bookingsByStatus = {};
  statuses.forEach((s, i) => { bookingsByStatus[s] = counts[i]; });
  return { totalUsers, totalAgencies, totalActiveBookings, bookingsByStatus };
}

module.exports = {
  getUsers,
  toggleUserStatus,
  getAgencies,
  createAgency,
  updateAgency,
  deactivateAgency,
  getAllBookings,
  adminCancelBooking,
  getDashboardData,
};
