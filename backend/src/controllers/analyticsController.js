const analyticsService = require('../services/analyticsService');

async function getBookingsByDate(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const data = await analyticsService.getBookingsByDate(startDate, endDate, req.user);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { getBookingsByDate };