const { Router } = require('express');
const authController = require('../controllers/authController');
const { handleUploads } = require('../middleware/upload');

const router = Router();

router.post('/register', handleUploads, authController.register);
router.post('/verify-otp', authController.verifyOtp);
router.post('/resend-otp', authController.resendOtp);
router.post('/login', authController.login);

module.exports = router;
