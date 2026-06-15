const bookingService = require('../services/bookingService');
const { validateCreateBooking } = require('../validations/bookingValidation');
const { registerBookingHandlers } = require('../socket/handlers/bookingHandlers');

function getBookingHandlers(req) {
  const io = req.app.get('io');
  if (!io) return null;
  return registerBookingHandlers(io);
}

async function create(req, res, next) {
  try {
    const validation = validateCreateBooking(req.body);
    if (validation.error) {
      return res.status(400).json({
        message: validation.error.details[0].message,
        errors: validation.error.details.map(d => d.message),
      });
    }
    const booking = await bookingService.createBooking(req.user.id, req.body);
    const handlers = getBookingHandlers(req);
    if (handlers) handlers.emitBookingCreated(booking, req.user.id);
    res.status(201).json(booking);
  } catch (err) {
    if (err.status === 409 || err.status === 404 || err.status === 400) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const result = await bookingService.getUserBookings(req.user.id, page, limit, search);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const booking = await bookingService.getBookingById(req.user.id, req.params.id);
    res.json(booking);
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({ message: err.message });
    }
    next(err);
  }
}

async function cancel(req, res, next) {
  try {
    const booking = await bookingService.cancelBooking(req.user.id, req.params.id);
    const handlers = getBookingHandlers(req);
    if (handlers) handlers.emitBookingCancelled(booking, req.user.id);
    res.json(booking);
  } catch (err) {
    if (err.status === 400 || err.status === 404) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}

async function getStatus(req, res, next) {
  try {
    const status = await bookingService.getBookingStatus(req.params.id);
    res.json(status);
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({ message: err.message });
    }
    next(err);
  }
}

async function getStatusHistory(req, res, next) {
  try {
    const history = await bookingService.getStatusHistory(req.params.id);
    res.json(history);
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getById, cancel, getStatus, getStatusHistory };
