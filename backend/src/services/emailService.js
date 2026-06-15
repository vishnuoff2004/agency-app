const transporter = require('../config/mailer');

const APP_NAME = process.env.APP_NAME || 'TravelAgency';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER;

/* ─────────────── Shared HTML shell ─────────────── */
function htmlShell(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${APP_NAME}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', Arial, sans-serif; background: #f0f4f8; color: #1a202c; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 36px 48px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 26px; font-weight: 700; letter-spacing: -0.5px; }
    .header p  { color: rgba(255,255,255,0.85); margin-top: 6px; font-size: 14px; }
    .logo-icon { font-size: 44px; margin-bottom: 10px; display: block; }
    .body { padding: 40px 48px; }
    .greeting { font-size: 20px; font-weight: 700; color: #2d3748; margin-bottom: 10px; }
    .text { font-size: 15px; line-height: 1.7; color: #4a5568; margin-bottom: 20px; }
    .otp-box { background: linear-gradient(135deg, #667eea10, #764ba210); border: 2px dashed #667eea; border-radius: 12px; padding: 28px; margin: 28px 0; text-align: center; }
    .otp-label { font-size: 12px; font-weight: 600; color: #667eea; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; }
    .otp-code { font-size: 48px; font-weight: 700; letter-spacing: 12px; color: #2d3748; font-family: 'Courier New', monospace; line-height: 1; }
    .otp-expire { font-size: 13px; color: #718096; margin-top: 12px; }
    .otp-expire strong { color: #e53e3e; }
    .warning-box { background: #fff7ed; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 14px 18px; margin: 20px 0; }
    .warning-box p { font-size: 13px; color: #92400e; line-height: 1.6; }
    .divider { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
    .footer { background: #f7fafc; padding: 22px 48px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { font-size: 12px; color: #a0aec0; line-height: 1.6; }
    .footer a { color: #667eea; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    ${content}
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.<br/>
      <a href="${APP_URL}">${APP_URL}</a></p>
    </div>
  </div>
</body>
</html>`;
}

/* ─────────────── OTP Email ─────────────── */
function otpEmailHtml(name, otp) {
  return htmlShell(`
    <div class="header">
      <span class="logo-icon">✈️</span>
      <h1>${APP_NAME}</h1>
      <p>Email Verification</p>
    </div>
    <div class="body">
      <p class="greeting">Hey ${name}! 👋</p>
      <p class="text">
        Thanks for signing up with <strong>${APP_NAME}</strong>. To complete your registration,
        please verify your email address using the OTP code below.
      </p>

      <div class="otp-box">
        <div class="otp-label">Your Verification Code</div>
        <div class="otp-code">${otp}</div>
        <div class="otp-expire">This code expires in <strong>10 minutes</strong></div>
      </div>

      <div class="warning-box">
        <p>🔒 <strong>Never share this code.</strong> ${APP_NAME} will never ask for your OTP via phone or chat. If you didn't request this, please ignore this email.</p>
      </div>

      <hr class="divider"/>
      <p class="text" style="font-size:13px; color:#718096;">
        Enter this code on the verification screen to activate your account and start your journey.
      </p>
    </div>
  `);
}

/* ─────────────── Public API ─────────────── */

/**
 * Send a 6-digit OTP to the user's email for verification.
 * @param {Object} param0 - { name, email, otp }
 */
async function sendOtpEmail({ name, email, otp }) {
  try {
    await transporter.sendMail({
      from: `"${APP_NAME}" <${FROM_EMAIL}>`,
      to: email,
      subject: `${otp} is your ${APP_NAME} verification code`,
      html: otpEmailHtml(name, otp),
    });
    console.log(`[Mailer] OTP email sent to ${email}`);
  } catch (err) {
    console.error(`[Mailer] Failed to send OTP email to ${email}:`, err.message);
    throw err; // OTP send failure should be surfaced (unlike welcome email)
  }
}

module.exports = { sendOtpEmail };
