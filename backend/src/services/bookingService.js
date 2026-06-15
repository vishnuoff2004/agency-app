const { Booking, BookingStatusHistory, Route, Driver, Agency, Sequelize } = require('../models');
const { Op } = Sequelize;
const { getAlgoliaClient, INDEX_BOOKINGS } = require('../config/algolia');

function getValidTransitions() {
  return {
    Pending: ['Confirmed', 'Cancelled'],
    Confirmed: ['On Trip', 'Cancelled'],
    'On Trip': ['Completed'],
    Completed: [],
    Cancelled: [],
  };
}

function isValidTransition(from, to) {
  const transitions = getValidTransitions();
  return transitions[from] && transitions[from].includes(to);
}

async function createBooking(userId, data) {
  const route = await Route.findByPk(data.routeId);
  if (!route) {
    const err = new Error('Route not found');
    err.status = 404;
    throw err;
  }
  if (!route.available) {
    const err = new Error('This route is currently unavailable');
    err.status = 400;
    throw err;
  }
  if (route.status !== 'active') {
    const err = new Error('This route is no longer available for booking');
    err.status = 400;
    throw err;
  }
  if (new Date(route.departureTime) <= new Date()) {
    const err = new Error('Cannot book a route with past departure time');
    err.status = 400;
    throw err;
  }

  // Validate travelDate matches route's departure date
  const departureDateObj = new Date(route.departureTime);
  if (isNaN(departureDateObj.getTime())) {
    const err = new Error('Invalid route departure time configuration');
    err.status = 400;
    throw err;
  }
  const routeDateLocal = `${departureDateObj.getFullYear()}-${String(departureDateObj.getMonth() + 1).padStart(2, '0')}-${String(departureDateObj.getDate()).padStart(2, '0')}`;
  const routeDateUTC = departureDateObj.toISOString().split('T')[0];

  if (data.travelDate !== routeDateLocal && data.travelDate !== routeDateUTC) {
    const err = new Error('Booking date must match the route departure date');
    err.status = 400;
    throw err;
  }

  const driver = await Driver.findByPk(data.driverId);
  if (!driver) {
    const err = new Error('Driver not found');
    err.status = 404;
    throw err;
  }

  const additionalSeats = Number(data.seatCount);

  // ── EXCLUSIVE VEHICLE RULE ──────────────────────────────────────────────────
  // Only ACTIVE bookings (Pending/Confirmed/On Trip) by another user block this.
  // Completed trips mean the journey is done — driver is free again.
  const otherUserBooking = await Booking.findOne({
    where: {
      driverId: data.driverId,
      travelDate: data.travelDate,
      userId: { [Op.ne]: userId },
      status: { [Op.in]: ['Pending', 'Confirmed', 'On Trip'] },
    },
  });

  if (otherUserBooking) {
    const err = new Error(
      'This vehicle is already exclusively booked by another traveler for this date. ' +
      'Please choose a different route or date.'
    );
    err.status = 409;
    throw err;
  }
  // ───────────────────────────────────────────────────────────────────────────


  // Check if the SAME user already has an active booking for this driver+route+date
  // If so, merge (add more seats) — same person can expand their own booking.
  const existing = await Booking.findOne({
    where: {
      userId,
      routeId: data.routeId,
      driverId: data.driverId,
      travelDate: data.travelDate,
      status: { [Op.notIn]: ['Cancelled'] },
    },
  });

  if (existing) {
    // Same user — merge: check capacity before adding seats
    const newTotal = existing.seatCount + additionalSeats;
    if (newTotal > route.capacity) {
      const err = new Error(`Total seats (${newTotal}) exceed vehicle capacity of ${route.capacity}`);
      err.status = 400;
      throw err;
    }
    const prevSeatCount = existing.seatCount;
    existing.seatCount = newTotal;
    await existing.save();
    await BookingStatusHistory.create({
      bookingId: existing.id,
      fromStatus: existing.status,
      toStatus: existing.status,
      changedBy: userId,
      reason: `Added ${additionalSeats} more seats (previous: ${prevSeatCount}, new: ${existing.seatCount})`,
    });
    return existing;
  }

  // New booking — validate seat count does not exceed vehicle capacity
  if (additionalSeats > route.capacity) {
    const err = new Error(`Seat count (${additionalSeats}) exceeds vehicle capacity of ${route.capacity}`);
    err.status = 400;
    throw err;
  }

  const booking = await Booking.create({
    userId,
    routeId: data.routeId,
    driverId: data.driverId,
    seatCount: additionalSeats,
    travelDate: data.travelDate,
    status: 'Pending',
  });

  await BookingStatusHistory.create({
    bookingId: booking.id,
    fromStatus: 'Pending',
    toStatus: 'Pending',
    changedBy: userId,
  });

  return booking;
}

async function getUserBookingsDatabase(userId, page, limit, search) {
  const offset = (page - 1) * limit;
  const where = { userId };
  if (search) {
    where[Op.or] = [
      { id: { [Op.like]: `%${search}%` } },
      { status: { [Op.like]: `%${search}%` } },
      { '$Route.source$': { [Op.like]: `%${search}%` } },
      { '$Route.destination$': { [Op.like]: `%${search}%` } },
      { '$Driver.name$': { [Op.like]: `%${search}%` } },
    ];
  }
  const { count, rows } = await Booking.findAndCountAll({
    where,
    include: [
      { model: Route, attributes: ['source', 'destination', 'departureTime', 'arrivalTime', 'fare'] },
      { model: Driver, attributes: ['name', 'phone', 'vehicleType', 'vehicleReg'] },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    subQuery: false,
  });

  return {
    data: rows.map(b => ({
      id: b.id,
      status: b.status,
      seatCount: b.seatCount,
      travelDate: b.travelDate,
      createdAt: b.createdAt,
      cancelReason: b.cancelReason,
      routeSource: b.Route?.source || null,
      routeDestination: b.Route?.destination || null,
      routeDeparture: b.Route?.departureTime || null,
      routeArrival: b.Route?.arrivalTime || null,
      fare: b.Route?.fare || null,
      totalAmount: b.Route?.fare ? (Number(b.Route.fare) * b.seatCount).toFixed(2) : null,
      driverName: b.Driver?.name || null,
      driverPhone: b.Driver?.phone || null,
      vehicleType: b.Driver?.vehicleType || null,
      vehicleReg: b.Driver?.vehicleReg || null,
    })),
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    totalItems: count,
  };
}

async function getUserBookings(userId, page = 1, limit = 10, search = '') {
  const client = getAlgoliaClient();
  if (!client || !search) {
    return getUserBookingsDatabase(userId, page, limit, search);
  }

  try {
    const searchResult = await client.searchSingleIndex({
      indexName: INDEX_BOOKINGS,
      searchParams: {
        query: search,
        filters: `userId = ${userId}`,
        page: page - 1,
        hitsPerPage: limit,
      },
    });

    const bookingIds = searchResult.hits.map(hit => parseInt(hit.id, 10)).filter(Boolean);
    if (bookingIds.length === 0) {
      return {
        data: [],
        page,
        limit,
        totalPages: 0,
        totalItems: 0,
      };
    }

    const rows = await Booking.findAll({
      where: { id: { [Op.in]: bookingIds } },
      include: [
        { model: Route, attributes: ['source', 'destination', 'departureTime', 'arrivalTime', 'fare'] },
        { model: Driver, attributes: ['name', 'phone', 'vehicleType', 'vehicleReg'] },
      ],
    });

    const rowsMap = new Map(rows.map(b => [b.id, b]));
    const orderedRows = bookingIds.map(id => rowsMap.get(id)).filter(Boolean);

    return {
      data: orderedRows.map(b => ({
        id: b.id,
        status: b.status,
        seatCount: b.seatCount,
        travelDate: b.travelDate,
        createdAt: b.createdAt,
        cancelReason: b.cancelReason,
        routeSource: b.Route?.source || null,
        routeDestination: b.Route?.destination || null,
        routeDeparture: b.Route?.departureTime || null,
        routeArrival: b.Route?.arrivalTime || null,
        fare: b.Route?.fare || null,
        totalAmount: b.Route?.fare ? (Number(b.Route.fare) * b.seatCount).toFixed(2) : null,
        driverName: b.Driver?.name || null,
        driverPhone: b.Driver?.phone || null,
        vehicleType: b.Driver?.vehicleType || null,
        vehicleReg: b.Driver?.vehicleReg || null,
      })),
      page,
      limit,
      totalPages: searchResult.nbPages,
      totalItems: searchResult.nbHits,
    };
  } catch (err) {
    console.error('Algolia booking search failed, falling back to database search:', err.message);
    return getUserBookingsDatabase(userId, page, limit, search);
  }
}

async function getBookingById(userId, bookingId) {
  const booking = await Booking.findOne({
    where: { id: bookingId, userId },
    include: [
      {
        model: BookingStatusHistory,
      },
      {
        model: Route,
      },
      {
        model: Driver,
        include: [{ model: Agency }],
      },
    ],
  });
  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }
  return booking;
}

async function cancelBooking(userId, bookingId, isAdmin = false) {
  const where = isAdmin ? { id: bookingId } : { id: bookingId, userId };
  const booking = await Booking.findOne({ where });
  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }
  if (booking.status === 'Cancelled') {
    const err = new Error('Booking is already cancelled');
    err.status = 400;
    throw err;
  }
  if (!isValidTransition(booking.status, 'Cancelled')) {
    const err = new Error(`Cannot cancel a booking with status ${booking.status}`);
    err.status = 400;
    throw err;
  }

  const prevStatus = booking.status;
  booking.status = 'Cancelled';
  await booking.save();

  await BookingStatusHistory.create({
    bookingId: booking.id,
    fromStatus: prevStatus,
    toStatus: 'Cancelled',
    changedBy: userId,
  });

  return booking;
}

async function getBookingStatus(bookingId) {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }
  return { id: booking.id, status: booking.status };
}

async function getStatusHistory(bookingId) {
  const history = await BookingStatusHistory.findAll({
    where: { bookingId },
    order: [['createdAt', 'ASC']],
  });
  return history.map(h => ({
    fromStatus: h.fromStatus,
    toStatus: h.toStatus,
    changedAt: h.createdAt,
  }));
}

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  getBookingStatus,
  getStatusHistory,
  isValidTransition,
  getValidTransitions,
};
