const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true', // true for port 465, false for others
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Verify the SMTP connection on startup (non-blocking).
 */
transporter.verify((err) => {
  if (err) {
    console.warn('[Mailer] SMTP connection failed:', err.message);
  } else {
    console.log('[Mailer] SMTP connection established successfully');
  }
});

module.exports = transporter;
