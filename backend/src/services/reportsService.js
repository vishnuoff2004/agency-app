const { Agency, Driver, Booking } = require('../models');

async function getAgencyPerformance(page = 1, pageSize = 10, user = {}) {
  const offset = (page - 1) * pageSize;

  const where = {};
  if (user.role === 'agency_admin') {
    where.adminId = user.id;
  }

  const { count, rows: agencies } = await Agency.findAndCountAll({
    where,
    include: [
      {
        model: Driver,
        include: [
          {
            model: Booking,
            attributes: ['status'],
          },
        ],
      },
    ],
    limit: pageSize,
    offset,
    order: [['name', 'ASC']],
  });

  const data = agencies.map(agency => {
    const allBookings = agency.Drivers.flatMap(d => d.Bookings || []);
    const completed = allBookings.filter(b => b.status === 'Completed').length;
    const cancelled = allBookings.filter(b => b.status === 'Cancelled').length;

    return {
      agencyId: agency.id,
      agencyName: agency.name,
      active: agency.active,
      driverCount: agency.Drivers.length,
      totalBookings: allBookings.length,
      totalCompletedBookings: completed,
      totalCancelledBookings: cancelled,
    };
  });

  return {
    data,
    pagination: {
      page,
      pageSize,
      total: count,
      totalPages: Math.ceil(count / pageSize),
    },
  };
}

module.exports = { getAgencyPerformance };