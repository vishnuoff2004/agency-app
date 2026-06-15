const { Driver, Booking, User, Route, Agency, Sequelize } = require('../models');
const { Op } = Sequelize;

async function getOrCreateAgency(userId) {
  let agency = await Agency.findOne({ where: { adminId: userId } });
  if (!agency) {
    const user = await User.findByPk(userId);
    if (user && user.role === 'agency_admin') {
      try {
        agency = await Agency.create({
          name: `${user.name}'s Agency`,
          email: user.email,
          phone: user.phone,
          createdBy: user.id,
          adminId: user.id,
        });
      } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
          const uniqueEmail = `agency_${user.id}_${Date.now()}@example.com`;
          agency = await Agency.create({
            name: `${user.name}'s Agency`,
            email: uniqueEmail,
            phone: user.phone,
            createdBy: user.id,
            adminId: user.id,
          });
        } else {
          throw err;
        }
      }
    }
  }
  return agency;
}

async function addDriver(userId, driverId) {
  const agency = await getOrCreateAgency(userId);
  if (!agency) {
    const err = new Error('Agency not found');
    err.status = 404;
    throw err;
  }
  const driver = await Driver.findByPk(driverId);
  if (!driver) {
    const err = new Error('Driver not found');
    err.status = 404;
    throw err;
  }
  if (driver.agencyId && driver.agencyId !== agency.id) {
    const err = new Error('Driver already belongs to another agency');
    err.status = 409;
    throw err;
  }
  driver.agencyId = agency.id;
  await driver.save();
  return driver;
}

async function removeDriver(userId, driverId) {
  const agency = await getOrCreateAgency(userId);
  if (!agency) {
    const err = new Error('Agency not found');
    err.status = 404;
    throw err;
  }
  const driver = await Driver.findOne({ where: { id: driverId, agencyId: agency.id } });
  if (!driver) {
    const err = new Error('Driver not found in your agency');
    err.status = 404;
    throw err;
  }
  const activeBookings = await Booking.count({
    where: { driverId: driver.id, status: { [Op.in]: ['Confirmed', 'On Trip'] } },
  });
  if (activeBookings > 0) {
    const err = new Error('Cannot remove driver with active confirmed bookings');
    err.status = 409;
    throw err;
  }
  await Booking.update(
    { status: 'Cancelled', cancelReason: 'Driver removed from agency' },
    { where: { driverId: driver.id, status: 'Pending' } }
  );
  driver.agencyId = null;
  await driver.save();
  return { message: 'Driver removed from agency' };
}

async function getDrivers(userId, page = 1, limit = 20, search = '') {
  const agency = await getOrCreateAgency(userId);
  if (!agency) {
    return { agencyName: null, data: [], page, limit, totalPages: 0, totalItems: 0 };
  }
  const offset = (page - 1) * limit;
  const where = { agencyId: agency.id };
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
      { vehicleType: { [Op.like]: `%${search}%` } },
      { vehicleReg: { [Op.like]: `%${search}%` } },
      { licenseNo: { [Op.like]: `%${search}%` } },
    ];
  }
  const { count, rows } = await Driver.findAndCountAll({
    where,
    attributes: ['id', 'name', 'phone', 'vehicleType', 'vehicleReg', 'licenseNo', 'available'],
    limit,
    offset,
  });
  return {
    agencyName: agency.name,
    data: rows,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    totalItems: count,
  };
}

async function getBookings(userId, filters = {}) {
  const agency = await getOrCreateAgency(userId);
  if (!agency) {
    return { data: [], page: 1, limit: 10, totalPages: 0, totalItems: 0 };
  }
  const driverRecords = await Driver.findAll({ where: { agencyId: agency.id }, attributes: ['id'] });
  const ids = driverRecords.map(d => d.id);
  if (ids.length === 0) {
    return { data: [], page: 1, limit: 10, totalPages: 0, totalItems: 0 };
  }
  
  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 10;
  const offset = (page - 1) * limit;

  const where = { driverId: { [Op.in]: ids } };
  if (filters.status) where.status = filters.status;
  if (filters.fromDate && filters.toDate) {
    where.travelDate = { [Op.between]: [filters.fromDate, filters.toDate] };
  }

  const search = filters.search || '';
  if (search) {
    where[Op.or] = [
      { id: { [Op.like]: `%${search}%` } },
      { status: { [Op.like]: `%${search}%` } },
      { '$User.name$': { [Op.like]: `%${search}%` } },
      { '$User.email$': { [Op.like]: `%${search}%` } },
      { '$User.phone$': { [Op.like]: `%${search}%` } },
      { '$Driver.name$': { [Op.like]: `%${search}%` } },
      { '$Route.source$': { [Op.like]: `%${search}%` } },
      { '$Route.destination$': { [Op.like]: `%${search}%` } },
    ];
  }

  const { count, rows } = await Booking.findAndCountAll({
    where,
    include: [
      { model: User, attributes: ['name', 'email', 'phone'] },
      {
        model: Driver,
        attributes: ['name', 'phone', 'vehicleType', 'vehicleReg', 'licenseNo'],
        include: [{ model: Agency, attributes: ['name', 'phone', 'email'] }],
      },
      { model: Route, attributes: ['source', 'destination', 'departureTime', 'arrivalTime', 'fare'] },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    subQuery: false,
  });

  const data = rows.map(b => ({
    bookingId: b.id,
    status: b.status,
    seatCount: b.seatCount,
    travelDate: b.travelDate,
    createdAt: b.createdAt,
    cancelReason: b.cancelReason,
    // Traveler
    travelerName: b.User?.name || null,
    travelerEmail: b.User?.email || null,
    travelerPhone: b.User?.phone || null,
    // Route
    route: b.Route ? `${b.Route.source} → ${b.Route.destination}` : null,
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
    // Agency
    agencyName: b.Driver?.Agency?.name || null,
  }));

  return {
    data,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    totalItems: count,
  };
}

module.exports = { addDriver, removeDriver, getDrivers, getBookings };
