const { Driver, User, Route, Booking, BookingStatusHistory, Sequelize, sequelize } = require('../models');
const { Op } = Sequelize;

async function createProfile(userId, data) {
  const existing = await Driver.findOne({ where: { userId } });
  if (existing) {
    const err = new Error('Driver profile already exists');
    err.status = 409;
    throw err;
  }
  const existingReg = await Driver.findOne({ where: { vehicleReg: data.vehicleReg } });
  if (existingReg) {
    const err = new Error('Vehicle registration number already exists');
    err.status = 409;
    throw err;
  }
  const driver = await Driver.create({ ...data, userId });
  return driver;
}

async function updateProfile(userId, data) {
  const driver = await Driver.findOne({ where: { userId } });
  if (!driver) {
    const err = new Error('Driver profile not found');
    err.status = 404;
    throw err;
  }
  const allowedFields = ['name', 'phone', 'vehicleType', 'vehicleReg', 'licenseNo'];
  const updates = {};
  allowedFields.forEach(field => {
    if (data[field] !== undefined) updates[field] = data[field];
  });
  await driver.update(updates);
  return driver;
}

async function createRoute(userId, data) {
  let driver = await Driver.findOne({ where: { userId } });
  if (!driver) {
    const user = await User.findByPk(userId);
    if (!user) {
      const err = new Error('Driver profile not found');
      err.status = 404;
      throw err;
    }
    driver = await Driver.create({
      userId,
      name: user.name,
      phone: user.phone,
      agencyId: null,
    });
  }

  if (data.source === data.destination) {
    const err = new Error('Source and destination cannot be the same');
    err.status = 400;
    throw err;
  }

  const departureTime = new Date(data.departureTime);
  const arrivalTime = new Date(data.arrivalTime);

  if (departureTime <= new Date()) {
    const err = new Error('Departure time cannot be in the past');
    err.status = 400;
    throw err;
  }

  if (arrivalTime <= departureTime) {
    const err = new Error('Arrival time must be after departure time');
    err.status = 400;
    throw err;
  }

  if (data.capacity < 1 || data.capacity > 60) {
    const err = new Error('Capacity must be between 1 and 60');
    err.status = 400;
    throw err;
  }

  if (data.fare <= 0) {
    const err = new Error('Fare must be greater than 0');
    err.status = 400;
    throw err;
  }

  const route = await Route.create({
    driverId: driver.id,
    source: data.source,
    destination: data.destination,
    departureTime: data.departureTime,
    arrivalTime: data.arrivalTime,
    fare: data.fare,
    capacity: data.capacity,
    available: data.available !== undefined ? data.available : true,
    status: 'active',
  });

  return route;
}

async function setRouteAvailability(driverId, routeId, available) {
  const route = await Route.findOne({ where: { id: routeId, driverId } });
  if (!route) {
    const err = new Error('Route not found');
    err.status = 404;
    throw err;
  }
  if (available && route.status !== 'active') {
    const err = new Error('Cannot make a completed or cancelled route available');
    err.status = 400;
    throw err;
  }
  route.available = available;
  await route.save();
  return route;
}

async function acceptBooking(driverUserId, bookingId) {
  const driver = await Driver.findOne({ where: { userId: driverUserId } });
  if (!driver) {
    const err = new Error('Driver profile not found');
    err.status = 404;
    throw err;
  }
  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }
  if (booking.driverId !== driver.id) {
    const err = new Error('This booking is not assigned to you');
    err.status = 403;
    throw err;
  }
  if (booking.status === 'Confirmed') {
    const err = new Error('Booking is already confirmed');
    err.status = 400;
    throw err;
  }
  if (booking.status !== 'Pending') {
    const err = new Error(`Cannot accept booking with status ${booking.status}`);
    err.status = 400;
    throw err;
  }
  const prevStatus = booking.status;
  booking.status = 'Confirmed';
  await booking.save();

  await BookingStatusHistory.create({
    bookingId: booking.id,
    fromStatus: prevStatus,
    toStatus: 'Confirmed',
    changedBy: driverUserId,
  });

  return booking;
}

async function rejectBooking(driverUserId, bookingId, reason) {
  const driver = await Driver.findOne({ where: { userId: driverUserId } });
  if (!driver) {
    const err = new Error('Driver profile not found');
    err.status = 404;
    throw err;
  }
  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }
  if (booking.driverId !== driver.id) {
    const err = new Error('This booking is not assigned to you');
    err.status = 403;
    throw err;
  }
  if (booking.status !== 'Pending') {
    const err = new Error(`Cannot reject booking with status ${booking.status}`);
    err.status = 400;
    throw err;
  }
  const prevStatus = booking.status;
  booking.status = 'Cancelled';
  booking.cancelReason = reason || 'Rejected by driver';
  await booking.save();

  await BookingStatusHistory.create({
    bookingId: booking.id,
    fromStatus: prevStatus,
    toStatus: 'Cancelled',
    changedBy: driverUserId,
  });

  return booking;
}

async function updateTripStatus(driverUserId, bookingId, newStatus) {
  const driver = await Driver.findOne({ where: { userId: driverUserId } });
  if (!driver) {
    const err = new Error('Driver profile not found');
    err.status = 404;
    throw err;
  }
  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    const err = new Error('Booking not found');
    err.status = 404;
    throw err;
  }
  if (booking.driverId !== driver.id) {
    const err = new Error('This booking is not assigned to you');
    err.status = 403;
    throw err;
  }

  const validTransitions = {
    Confirmed: ['On Trip'],
    'On Trip': ['Completed'],
  };

  const allowed = validTransitions[booking.status];
  if (!allowed || !allowed.includes(newStatus)) {
    const err = new Error(`Cannot transition to ${newStatus} from ${booking.status}`);
    err.status = 400;
    throw err;
  }

  // Rule: Driver cannot start a new trip while already on an active trip
  if (newStatus === 'On Trip') {
    const activeTrip = await Booking.findOne({
      where: {
        driverId: driver.id,
        status: 'On Trip',
        id: { [Op.ne]: booking.id },
      },
    });
    if (activeTrip) {
      const err = new Error(
        'You already have an active trip in progress (Booking #' + activeTrip.id + '). ' +
        'Please complete it before starting another trip.'
      );
      err.status = 409;
      throw err;
    }
  }

  const prevStatus = booking.status;

  const t = await sequelize.transaction();

  try {
    booking.status = newStatus;
    await booking.save({ transaction: t });

    if (newStatus === 'On Trip') {
      driver.available = false;
      await driver.save({ transaction: t });
    } else if (newStatus === 'Completed') {
      driver.available = true;
      await driver.save({ transaction: t });
      const route = await Route.findByPk(booking.routeId, { transaction: t });
      if (route && route.status === 'active') {
        route.status = 'completed';
        await route.save({ transaction: t });
      }
    }

    await BookingStatusHistory.create({
      bookingId: booking.id,
      fromStatus: prevStatus,
      toStatus: newStatus,
      changedBy: driverUserId,
    }, { transaction: t });

    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }

  return booking;
}

async function setOverallAvailability(userId, available) {
  const driver = await Driver.findOne({ where: { userId } });
  if (!driver) {
    const err = new Error('Driver profile not found');
    err.status = 404;
    throw err;
  }
  driver.available = available;
  await driver.save();
  return driver;
}

async function getDashboardData(userId) {
  const driver = await Driver.findOne({ where: { userId } });
  if (!driver) {
    const err = new Error('Driver profile not found');
    err.status = 404;
    throw err;
  }
  const pendingRequests = await Booking.count({
    where: { driverId: driver.id, status: 'Pending' },
  });
  const activeTrips = await Booking.count({
    where: { driverId: driver.id, status: { [Op.in]: ['Confirmed', 'On Trip'] } },
  });
  const todayTrips = await Booking.findAll({
    where: { driverId: driver.id, travelDate: new Date().toISOString().split('T')[0] },
  });
  return { pendingRequests, activeTrips, todayTrips };
}

module.exports = {
  createProfile,
  updateProfile,
  createRoute,
  setRouteAvailability,
  acceptBooking,
  rejectBooking,
  updateTripStatus,
  setOverallAvailability,
  getDashboardData,
};
