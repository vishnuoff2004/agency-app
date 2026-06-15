const { Driver, Agency, DriverAgencyRequest, Sequelize } = require('../models');
const { Op } = Sequelize;

// Driver gets their own agency status + their latest request status
async function getMyAgencyStatus(userId) {
  const driver = await Driver.findOne({
    where: { userId },
    include: [{ model: Agency, attributes: ['id', 'name', 'email', 'phone'] }],
  });

  if (!driver) {
    return { hasProfile: false, agency: null, request: null };
  }

  const latestRequest = await DriverAgencyRequest.findOne({
    where: { driverId: driver.id },
    include: [{ model: Agency, attributes: ['id', 'name', 'email', 'phone'] }],
    order: [['createdAt', 'DESC']],
  });

  return {
    hasProfile: true,
    driverId: driver.id,
    agency: driver.Agency || null,
    request: latestRequest
      ? {
          id: latestRequest.id,
          agencyId: latestRequest.agencyId,
          agencyName: latestRequest.Agency?.name,
          status: latestRequest.status,
          createdAt: latestRequest.createdAt,
        }
      : null,
  };
}

// List all active agencies for driver to browse
async function listAgencies(driverUserId) {
  const driver = await Driver.findOne({ where: { userId: driverUserId } });

  // Get agencies driver has already requested (pending)
  const pendingIds = driver
    ? (await DriverAgencyRequest.findAll({
        where: { driverId: driver.id, status: 'Pending' },
        attributes: ['agencyId'],
      })).map(r => r.agencyId)
    : [];

  const agencies = await Agency.findAll({
    where: { active: true },
    attributes: ['id', 'name', 'email', 'phone'],
    order: [['name', 'ASC']],
  });

  return agencies.map(a => ({
    id: a.id,
    name: a.name,
    email: a.email,
    phone: a.phone,
    requestPending: pendingIds.includes(a.id),
    // Is this the driver's current agency?
    isCurrentAgency: driver?.agencyId === a.id,
  }));
}

// Driver sends a join request to an agency
async function sendJoinRequest(userId, agencyId) {
  const driver = await Driver.findOne({ where: { userId } });
  if (!driver) {
    const err = new Error('Driver profile not found');
    err.status = 404;
    throw err;
  }

  if (driver.agencyId) {
    const err = new Error('You are already part of an agency. Leave first before requesting another.');
    err.status = 409;
    throw err;
  }

  const agency = await Agency.findOne({ where: { id: agencyId, active: true } });
  if (!agency) {
    const err = new Error('Agency not found or inactive');
    err.status = 404;
    throw err;
  }

  // Check for existing pending request to this agency
  const existing = await DriverAgencyRequest.findOne({
    where: { driverId: driver.id, agencyId, status: 'Pending' },
  });
  if (existing) {
    const err = new Error('You already have a pending request to this agency');
    err.status = 409;
    throw err;
  }

  // Cancel any other pending requests first (driver can only have one active request)
  await DriverAgencyRequest.update(
    { status: 'Denied' },
    { where: { driverId: driver.id, status: 'Pending' } }
  );

  const request = await DriverAgencyRequest.create({
    driverId: driver.id,
    agencyId,
    status: 'Pending',
  });

  return { id: request.id, agencyId, agencyName: agency.name, status: 'Pending' };
}

// Driver cancels their pending request
async function cancelJoinRequest(userId) {
  const driver = await Driver.findOne({ where: { userId } });
  if (!driver) {
    const err = new Error('Driver profile not found');
    err.status = 404;
    throw err;
  }

  const request = await DriverAgencyRequest.findOne({
    where: { driverId: driver.id, status: 'Pending' },
  });
  if (!request) {
    const err = new Error('No pending request found');
    err.status = 404;
    throw err;
  }

  request.status = 'Denied';
  await request.save();
  return { message: 'Request cancelled' };
}

// Agency admin: get all join requests for their agency
async function getAgencyRequests(adminUserId) {
  const agency = await Agency.findOne({ where: { adminId: adminUserId } });
  if (!agency) return [];

  const requests = await DriverAgencyRequest.findAll({
    where: { agencyId: agency.id },
    include: [
      {
        model: Driver,
        attributes: ['id', 'name', 'phone', 'vehicleType', 'vehicleReg', 'licenseNo', 'licenseDocUrl', 'vehicleRcUrl', 'available'],
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  return requests.map(r => ({
    id: r.id,
    driverId: r.driverId,
    driverName: r.Driver?.name,
    driverPhone: r.Driver?.phone,
    vehicleType: r.Driver?.vehicleType,
    vehicleReg: r.Driver?.vehicleReg,
    licenseNo: r.Driver?.licenseNo,
    licenseDocUrl: r.Driver?.licenseDocUrl,
    vehicleRcUrl: r.Driver?.vehicleRcUrl,
    available: r.Driver?.available,
    status: r.status,
    requestedAt: r.createdAt,
  }));
}

// Agency admin: accept or deny a request
async function respondToRequest(adminUserId, requestId, action) {
  const agency = await Agency.findOne({ where: { adminId: adminUserId } });
  if (!agency) {
    const err = new Error('Agency not found');
    err.status = 404;
    throw err;
  }

  const request = await DriverAgencyRequest.findOne({
    where: { id: requestId, agencyId: agency.id, status: 'Pending' },
    include: [{ model: Driver }],
  });
  if (!request) {
    const err = new Error('Request not found or already processed');
    err.status = 404;
    throw err;
  }

  if (action === 'accept') {
    request.status = 'Accepted';
    await request.save();
    // Link driver to this agency
    request.Driver.agencyId = agency.id;
    await request.Driver.save();
    // Deny all other pending requests from this driver
    await DriverAgencyRequest.update(
      { status: 'Denied' },
      { where: { driverId: request.driverId, status: 'Pending', id: { [Op.ne]: request.id } } }
    );
    return { message: `${request.Driver.name} has been added to your agency` };
  } else {
    request.status = 'Denied';
    await request.save();
    return { message: 'Request denied' };
  }
}

module.exports = {
  getMyAgencyStatus,
  listAgencies,
  sendJoinRequest,
  cancelJoinRequest,
  getAgencyRequests,
  respondToRequest,
};
