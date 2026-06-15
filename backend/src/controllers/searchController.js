const { Agency } = require('../models');
const searchService = require('../services/searchService');

async function search(req, res, next) {
  try {
    const { source, destination, seats, priceMin, priceMax, vehicleTypes } = req.query;
    const userId = req.user?.id ?? null;
    const result = await searchService.searchRoutes(source, destination, userId, { seats, priceMin, priceMax, vehicleTypes });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function listAgencies(req, res, next) {
  try {
    const agencies = await Agency.findAll({ where: { active: true }, attributes: ['id', 'name', 'email'] });
    res.json(agencies);
  } catch (err) {
    next(err);
  }
}

module.exports = { search, listAgencies };
