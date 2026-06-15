const adminService = require('../services/adminService');

async function getUsers(req, res, next) {
  try {
    const { page, limit, search } = req.query;
    const users = await adminService.getUsers(page, limit, search);
    res.json(users);
  } catch (err) {
    next(err);
  }
}

async function toggleUserStatus(req, res, next) {
  try {
    const user = await adminService.toggleUserStatus(req.user.id, req.params.id);
    res.json(user);
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ message: err.message });
    next(err);
  }
}

async function getAgencies(req, res, next) {
  try {
    const { page, limit, search } = req.query;
    const agencies = await adminService.getAgencies(page, limit, search);
    res.json(agencies);
  } catch (err) {
    next(err);
  }
}

async function createAgency(req, res, next) {
  try {
    const agency = await adminService.createAgency(req.user.id, req.body);
    res.status(201).json(agency);
  } catch (err) {
    next(err);
  }
}

async function updateAgency(req, res, next) {
  try {
    const agency = await adminService.updateAgency(req.user.id, req.params.id, req.body);
    res.json(agency);
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ message: err.message });
    next(err);
  }
}

async function deactivateAgency(req, res, next) {
  try {
    const agency = await adminService.deactivateAgency(req.user.id, req.params.id);
    res.json(agency);
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ message: err.message });
    next(err);
  }
}

async function getAllBookings(req, res, next) {
  try {
    const { page, limit, search } = req.query;
    const bookings = await adminService.getAllBookings(page, limit, search);
    res.json(bookings);
  } catch (err) {
    next(err);
  }
}

async function cancelBooking(req, res, next) {
  try {
    const booking = await adminService.adminCancelBooking(req.user.id, req.params.id, req.body.reason);
    res.json(booking);
  } catch (err) {
    if (err.status === 404) return res.status(404).json({ message: err.message });
    next(err);
  }
}

module.exports = {
  getUsers,
  toggleUserStatus,
  getAgencies,
  createAgency,
  updateAgency,
  deactivateAgency,
  getAllBookings,
  cancelBooking,
};
