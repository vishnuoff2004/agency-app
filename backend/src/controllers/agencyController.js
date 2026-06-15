const agencyService = require('../services/agencyService');
const agencyRequestService = require('../services/agencyRequestService');

async function addDriver(req, res, next) {
  try {
    const driver = await agencyService.addDriver(req.user.id, req.body.driverId);
    res.status(201).json(driver);
  } catch (err) {
    if (err.status === 404 || err.status === 409) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}

async function removeDriver(req, res, next) {
  try {
    const result = await agencyService.removeDriver(req.user.id, req.params.id);
    res.json(result);
  } catch (err) {
    if (err.status === 404 || err.status === 409) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}

async function getDrivers(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const result = await agencyService.getDrivers(req.user.id, page, limit, search);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getBookings(req, res, next) {
  try {
    const result = await agencyService.getBookings(req.user.id, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getDriverRequests(req, res, next) {
  try {
    const requests = await agencyRequestService.getAgencyRequests(req.user.id);
    res.json(requests);
  } catch (err) { next(err); }
}

async function respondToDriverRequest(req, res, next) {
  try {
    const { action } = req.body; // 'accept' or 'deny'
    if (!['accept', 'deny'].includes(action)) {
      return res.status(400).json({ message: 'Action must be accept or deny' });
    }
    const result = await agencyRequestService.respondToRequest(req.user.id, req.params.id, action);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
}

module.exports = { addDriver, removeDriver, getDrivers, getBookings, getDriverRequests, respondToDriverRequest };
