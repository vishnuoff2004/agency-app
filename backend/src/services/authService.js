const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { User, Driver, Agency } = require('../models');
const { generateToken } = require('../utils/jwt');
const { sendOtpEmail } = require('./emailService');

/* ── helpers ── */
function generateOtp() {
  return String(crypto.randomInt(100000, 999999)); // secure 6-digit OTP
}

function otpExpiry() {
  return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
}

/* ──────────────────────────────────────────────
   REGISTER  – creates an unverified user and
   sends an OTP to the provided email address.
─────────────────────────────────────────────── */
async function register(data) {
  const existing = await User.findOne({ where: { email: data.email } });
  if (existing) {
    const err = new Error('Email already exists');
    err.status = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const otp = generateOtp();

  const user = await User.create({
    name: data.name,
    email: data.email,
    password: hashedPassword,
    phone: data.phone,
    role: data.role || 'traveler',
    isVerified: false,
    active: false, // account is inactive until OTP is verified
    otpCode: otp,
    otpExpiry: otpExpiry(),
  });

  // Create role-specific records now (they remain inactive until verified)
  if (user.role === 'driver') {
    await Driver.create({
      userId: user.id,
      name: data.name,
      phone: data.phone,
      vehicleType: data.vehicleType || null,
      vehicleReg: data.vehicleReg || null,
      licenseNo: data.licenseNo || null,
      licenseDocUrl: data.licenseDocUrl || null,
      vehicleRcUrl: data.vehicleRcUrl || null,
      agencyId: null,
    });

    if (data.agencyId) {
      const agencyRequestService = require('./agencyRequestService');
      try {
        await agencyRequestService.sendJoinRequest(user.id, data.agencyId);
      } catch (err) {
        console.error('Failed to auto-send join request during registration:', err.message);
      }
    }
  }

  if (user.role === 'agency_admin') {
    await Agency.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      createdBy: user.id,
      adminId: user.id,
    });
  }

  // Send OTP email (throws if SMTP is misconfigured so user knows)
  await sendOtpEmail({ name: user.name, email: user.email, otp });

  return { message: 'OTP sent to your email. Please verify to activate your account.', email: user.email };
}

/* ──────────────────────────────────────────────
   VERIFY OTP  – activates account on success.
─────────────────────────────────────────────── */
async function verifyOtp(email, otp) {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  if (user.isVerified) {
    const err = new Error('Account is already verified');
    err.status = 400;
    throw err;
  }

  if (!user.otpCode || !user.otpExpiry) {
    const err = new Error('No OTP found. Please request a new one.');
    err.status = 400;
    throw err;
  }

  if (new Date() > new Date(user.otpExpiry)) {
    const err = new Error('OTP has expired. Please request a new one.');
    err.status = 410;
    throw err;
  }

  if (user.otpCode !== String(otp)) {
    const err = new Error('Invalid OTP. Please try again.');
    err.status = 401;
    throw err;
  }

  // Activate the account
  user.isVerified = true;
  user.active = true;
  user.otpCode = null;
  user.otpExpiry = null;
  await user.save();

  const token = generateToken(user);
  const { password, otpCode: _otp, otpExpiry: _exp, ...userWithoutSensitive } = user.toJSON();
  return { token, user: userWithoutSensitive };
}

/* ──────────────────────────────────────────────
   RESEND OTP  – regenerates and resends the OTP.
─────────────────────────────────────────────── */
async function resendOtp(email) {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  if (user.isVerified) {
    const err = new Error('Account is already verified');
    err.status = 400;
    throw err;
  }

  const otp = generateOtp();
  user.otpCode = otp;
  user.otpExpiry = otpExpiry();
  await user.save();

  await sendOtpEmail({ name: user.name, email: user.email, otp });
  return { message: 'A new OTP has been sent to your email.' };
}

/* ──────────────────────────────────────────────
   LOGIN  – only allows verified accounts.
   Demo accounts bypass the OTP requirement.
─────────────────────────────────────────────── */
const DEMO_EMAILS = new Set([
  'admin123@gmail.com',
  'agency@example.com',
  'driver@example.com',
  'traveler@example.com',
]);

async function login(email, password) {
  const user = await User.findOne({ where: { email } });
  if (!user) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  // Demo accounts skip OTP verification
  const isDemo = DEMO_EMAILS.has(email.toLowerCase());

  if (!isDemo && !user.isVerified) {
    const err = new Error('Please verify your email before logging in.');
    err.status = 403;
    throw err;
  }

  if (!user.active) {
    const err = new Error('Account deactivated. Contact administrator');
    err.status = 403;
    throw err;
  }

  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    const err = new Error('Account locked. Try again after 15 seconds');
    err.status = 429;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    if (user.loginAttempts >= 5) {
      user.lockedUntil = new Date(Date.now() + 15 * 1000);
    }
    await user.save();
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  user.loginAttempts = 0;
  user.lockedUntil = null;
  await user.save();

  const token = generateToken(user);
  const { password: _, otpCode: _otp, otpExpiry: _exp, ...userWithoutSensitive } = user.toJSON();
  return { token, user: userWithoutSensitive };
}

module.exports = { register, verifyOtp, resendOtp, login };
