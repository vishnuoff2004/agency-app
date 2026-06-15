const authService = require('../services/authService');
const { validateRegister, validateLogin } = require('../validations/authValidation');

async function register(req, res, next) {
  try {
    const validation = validateRegister(req.body);
    if (validation.error) {
      return res.status(400).json({
        message: validation.error.details[0].message,
        errors: validation.error.details.map(d => d.message),
      });
    }
    const result = await authService.register({
      ...req.body,
      licenseDocUrl: req.licenseDocUrl,
      vehicleRcUrl: req.vehicleRcUrl,
    });
    res.status(201).json(result);
  } catch (err) {
    if (err.status === 409) return res.status(409).json({ message: err.message });
    if (err.status === 400) return res.status(400).json({ message: err.message });
    next(err);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required.' });
    }
    const result = await authService.verifyOtp(email, otp);
    res.status(200).json(result);
  } catch (err) {
    const status = err.status || 400;
    if ([400, 401, 404, 410].includes(status)) {
      return res.status(status).json({ message: err.message });
    }
    next(err);
  }
}

async function resendOtp(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });
    const result = await authService.resendOtp(email);
    res.status(200).json(result);
  } catch (err) {
    const status = err.status || 400;
    if ([400, 404].includes(status)) {
      return res.status(status).json({ message: err.message });
    }
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const validation = validateLogin(req.body);
    if (validation.error) {
      return res.status(400).json({
        message: validation.error.details[0].message,
        errors: validation.error.details.map(d => d.message),
      });
    }
    const result = await authService.login(req.body.email, req.body.password);
    res.status(200).json(result);
  } catch (err) {
    if (err.status === 401 || err.status === 403 || err.status === 429) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
  }
}

module.exports = { register, verifyOtp, resendOtp, login };
