import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Button from '../../components/common/Button';

/* ── OTP Step Component ── */
function OtpStep({ email, onVerified, onBack }) {
  const { t } = useTranslation();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef([]);

  // Start resend cooldown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setInterval(() => setResendTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [resendTimer]);

  // Auto-focus first box
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const next = [...otp];
    next[index] = value.slice(-1); // keep only last char
    setOtp(next);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      setError(t('auth.otpIncomplete', 'Please enter all 6 digits.'));
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp: code });
      // Save token + user to localStorage (same pattern as login)
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      onVerified(data);
    } catch (err) {
      setError(err.response?.data?.message || t('auth.otpInvalid', 'Invalid or expired OTP.'));
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      await api.post('/auth/resend-otp', { email });
      setResendTimer(30);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || t('auth.resendFailed', 'Failed to resend OTP.'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Icon */}
      <div style={{ fontSize: 52, marginBottom: 8 }}>📧</div>
      <h2 className="auth-title" style={{ marginBottom: 6 }}>
        {t('auth.verifyEmail', 'Verify your email')}
      </h2>
      <p className="auth-subtitle" style={{ marginBottom: 28 }}>
        {t('auth.otpSentTo', 'We sent a 6-digit code to')}{' '}
        <strong style={{ color: '#667eea' }}>{email}</strong>
      </p>

      {error && <div className="auth-error" role="alert" style={{ marginBottom: 16 }}>{error}</div>}

      {/* OTP boxes */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={el => (inputRefs.current[i] = el)}
            id={`otp-digit-${i}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleOtpChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={handlePaste}
            style={{
              width: 48,
              height: 58,
              textAlign: 'center',
              fontSize: 24,
              fontWeight: 700,
              border: `2px solid ${digit ? '#667eea' : '#e2e8f0'}`,
              borderRadius: 10,
              outline: 'none',
              background: digit ? '#667eea10' : '#f8fafc',
              color: '#2d3748',
              transition: 'border-color 0.2s, background 0.2s',
              caretColor: 'transparent',
            }}
          />
        ))}
      </div>

      <Button
        id="otp-verify-btn"
        type="button"
        loading={loading}
        className="w-full"
        size="lg"
        onClick={handleVerify}
        style={{ marginBottom: 16 }}
      >
        {t('auth.verifyOtp', 'Verify & Continue')}
      </Button>

      {/* Resend */}
      <p style={{ fontSize: 14, color: '#718096', marginBottom: 8 }}>
        {t('auth.didntReceive', "Didn't receive it?")}{' '}
        {resendTimer > 0 ? (
          <span style={{ color: '#a0aec0' }}>
            {t('auth.resendIn', 'Resend in')} {resendTimer}s
          </span>
        ) : (
          <button
            id="otp-resend-btn"
            type="button"
            onClick={handleResend}
            disabled={resending}
            style={{ background: 'none', border: 'none', color: '#667eea', fontWeight: 600, cursor: 'pointer', fontSize: 14, padding: 0 }}
          >
            {resending ? t('auth.resending', 'Resending…') : t('auth.resendCode', 'Resend Code')}
          </button>
        )}
      </p>

      <button
        id="otp-back-btn"
        type="button"
        onClick={onBack}
        style={{ background: 'none', border: 'none', color: '#a0aec0', cursor: 'pointer', fontSize: 13, marginTop: 4 }}
      >
        ← {t('auth.changeEmail', 'Change email / go back')}
      </button>
    </div>
  );
}

/* ── Main Register Page ── */
function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [pendingEmail, setPendingEmail] = useState('');

  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    role: 'traveler', vehicleType: '', vehicleReg: '', licenseNo: '', agencyId: '',
  });
  const [agencies, setAgencies] = useState([]);
  const [licenseDoc, setLicenseDoc] = useState(null);
  const [vehicleRc, setVehicleRc] = useState(null);
  const [fileErrors, setFileErrors] = useState({ licenseDoc: '', vehicleRc: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/routes/agencies')
      .then(r => setAgencies(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
  }, []);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (!files || files.length === 0) return;
    const file = files[0];
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const maxSizeBytes = 4 * 1024 * 1024;
    let err = '';
    if (!allowedTypes.includes(file.type)) {
      err = t('auth.invalidFileType', 'Only JPG, JPEG, PNG, and PDF files are allowed.');
    } else if (file.size > maxSizeBytes) {
      err = t('auth.fileTooLarge', 'File size must be under 4 MB.');
    }
    setFileErrors(prev => ({ ...prev, [name]: err }));
    if (!err) {
      if (name === 'licenseDoc') setLicenseDoc(file);
      if (name === 'vehicleRc') setVehicleRc(file);
    } else {
      if (name === 'licenseDoc') setLicenseDoc(null);
      if (name === 'vehicleRc') setVehicleRc(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.role === 'driver' && (!licenseDoc || !vehicleRc)) {
      setError(t('auth.docsRequired', 'Both Driving License and Vehicle RC documents are required.'));
      return;
    }
    setLoading(true);
    try {
      if (form.role === 'driver') {
        const formData = new FormData();
        Object.keys(form).forEach(key => formData.append(key, form[key]));
        formData.append('licenseDoc', licenseDoc);
        formData.append('vehicleRc', vehicleRc);
        await api.post('/auth/register', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/auth/register', form);
      }
      setPendingEmail(form.email);
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || t('auth.registrationFailed', 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerified = (data) => {
    // Redirect based on role
    const role = data?.user?.role;
    if (role === 'driver') navigate('/driver');
    else if (role === 'agency_admin') navigate('/agency');
    else navigate('/traveler');
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-scale-in-on-load">

        {/* ── OTP step ── */}
        {step === 'otp' ? (
          <OtpStep
            email={pendingEmail}
            onVerified={handleVerified}
            onBack={() => { setStep('form'); setError(''); }}
          />
        ) : (
          /* ── Registration form step ── */
          <>
            <div className="auth-logo">
              <span className="auth-logo-icon">TP</span>
            </div>
            <h1 className="auth-title">{t('auth.createAccount', 'Create Account')}</h1>
            <p className="auth-subtitle">{t('auth.joinTravelPro', 'Join TravelPro today')}</p>

            {error && <div className="auth-error" role="alert">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-name">{t('auth.fullName', 'Full Name')}</label>
                <input id="reg-name" className="form-input" name="name"
                  placeholder={t('auth.fullNamePlaceholder', 'John Doe')}
                  value={form.name} onChange={handleChange} required autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">{t('auth.email', 'Email')}</label>
                <input id="reg-email" className="form-input" name="email" type="email"
                  placeholder={t('auth.emailPlaceholder', 'you@example.com')}
                  value={form.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-password">{t('auth.password', 'Password')}</label>
                <input id="reg-password" className="form-input" name="password" type="password"
                  placeholder={t('auth.passwordPlaceholder', 'Create a strong password')}
                  value={form.password} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-phone">{t('auth.phone', 'Phone')}</label>
                <input id="reg-phone" className="form-input" name="phone" type="tel"
                  placeholder={t('auth.phonePlaceholder', '+1 (555) 000-0000')}
                  value={form.phone} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-role">{t('auth.accountType', 'Account Type')}</label>
                <select id="reg-role" className="form-select" name="role"
                  value={form.role} onChange={handleChange} required>
                  <option value="traveler">{t('auth.traveler', 'Traveler')}</option>
                  <option value="driver">{t('auth.driver', 'Driver')}</option>
                  <option value="agency_admin">{t('auth.agencyAdmin', 'Agency Admin')}</option>
                </select>
              </div>

              {form.role === 'driver' && (
                <>
                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-vehicleType">{t('auth.vehicleType', 'Vehicle Type')}</label>
                    <select id="reg-vehicleType" className="form-select" name="vehicleType"
                      value={form.vehicleType} onChange={handleChange} required>
                      <option value="">{t('auth.selectVehicleType', 'Select Vehicle Type')}</option>
                      <option value="Sedan">{t('auth.sedan', 'Sedan')}</option>
                      <option value="SUV">{t('auth.suv', 'SUV')}</option>
                      <option value="Hatchback">{t('auth.hatchback', 'Hatchback')}</option>
                      <option value="Van">{t('auth.van', 'Van')}</option>
                      <option value="Bus">{t('auth.bus', 'Bus')}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-vehicleReg">{t('auth.vehicleRegistration', 'Vehicle Registration')}</label>
                    <input id="reg-vehicleReg" className="form-input" name="vehicleReg"
                      placeholder={t('auth.vehicleRegPlaceholder', 'KA-01-AB-1234')}
                      value={form.vehicleReg} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-licenseNo">{t('auth.licenseNumber', 'License Number')}</label>
                    <input id="reg-licenseNo" className="form-input" name="licenseNo"
                      placeholder={t('auth.licensePlaceholder', 'DL-123456789')}
                      value={form.licenseNo} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-licenseDoc">
                      {t('auth.licenseDoc', 'Driving License')} <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input id="reg-licenseDoc" type="file" name="licenseDoc"
                      accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange}
                      className="form-input" style={{ padding: '8px' }} required />
                    {fileErrors.licenseDoc && <span style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: 4, display: 'block' }}>{fileErrors.licenseDoc}</span>}
                    {licenseDoc && <span style={{ color: '#16a34a', fontSize: '0.8rem', marginTop: 4, display: 'block' }}>✓ {licenseDoc.name} ({Math.round(licenseDoc.size / 1024 / 1024 * 100) / 100} MB)</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-vehicleRc">
                      {t('auth.vehicleRc', 'Vehicle RC')} <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input id="reg-vehicleRc" type="file" name="vehicleRc"
                      accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange}
                      className="form-input" style={{ padding: '8px' }} required />
                    {fileErrors.vehicleRc && <span style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: 4, display: 'block' }}>{fileErrors.vehicleRc}</span>}
                    {vehicleRc && <span style={{ color: '#16a34a', fontSize: '0.8rem', marginTop: 4, display: 'block' }}>✓ {vehicleRc.name} ({Math.round(vehicleRc.size / 1024 / 1024 * 100) / 100} MB)</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-agencyId">
                      {t('auth.agency', 'Agency')} <span style={{ color: '#9ca3af', fontWeight: 'normal' }}>({t('common.optional', 'Optional')})</span>
                    </label>
                    <select id="reg-agencyId" className="form-select" name="agencyId"
                      value={form.agencyId} onChange={handleChange}>
                      <option value="">{t('auth.selectAgency', 'Select Agency')}</option>
                      {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    <span style={{ color: '#6b7280', fontSize: '0.78rem', marginTop: 4, display: 'block' }}>
                      {t('auth.agencyHelper', 'Select an agency to send a join request. You will be linked after approval.')}
                    </span>
                  </div>
                </>
              )}

              <Button type="submit" loading={loading} className="w-full" size="lg">
                {t('auth.createAccountButton', 'Create Account')}
              </Button>
            </form>

            <div className="auth-footer">
              {t('auth.alreadyHaveAccount', 'Already have an account?')}{' '}
              <Link to="/login">{t('auth.signInLink', 'Sign in')}</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default RegisterPage;
