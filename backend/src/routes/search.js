const { Router } = require('express');
const { optionalAuthenticate } = require('../middleware/auth');
const searchController = require('../controllers/searchController');

const router = Router();

router.get('/search', optionalAuthenticate, searchController.search);
router.get('/agencies', searchController.listAgencies);

module.exports = router;

