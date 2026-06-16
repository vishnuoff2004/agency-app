import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Link, router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getAgencies, resendOtp } from '../services/authService';
import FormInput from '../components/FormInput';
import Button from '../components/Button';

const FormInputTyped = FormInput as any;

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { register, verifyOtp } = useAuth();
  const { language, changeLanguage } = useLanguage();

  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [pendingEmail, setPendingEmail] = useState('');

  // Step 1 states
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'traveler',
    vehicleType: '',
    vehicleReg: '',
    licenseNo: '',
    agencyId: '',
  });

  const [agencies, setAgencies] = useState<any[]>([]);
  const [licenseDoc, setLicenseDoc] = useState<any>(null);
  const [vehicleRc, setVehicleRc] = useState<any>(null);
  const [fileErrors, setFileErrors] = useState({ licenseDoc: '', vehicleRc: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Step 2 states (OTP)
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);

  const otpRefs = useRef<any[]>([]);

  // Timer cooldown
  useEffect(() => {
    if (step !== 'otp' || resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((timer) => timer - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer, step]);

  // Load agencies list
  useEffect(() => {
    getAgencies()
      .then((data) => {
        setAgencies(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.warn('Failed to fetch agencies list', err);
      });
  }, []);

  const handleInputChange = (field: string, val: string) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const handlePickDocument = async (field: 'licenseDoc' | 'vehicleRc') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/png', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const maxSizeBytes = 4 * 1024 * 1024;
      const allowedExts = ['jpg', 'jpeg', 'png', 'pdf'];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      let errorMsg = '';
      if (!allowedExts.includes(ext)) {
        errorMsg = t(
          'auth.invalidFileType',
          'Only JPG, JPEG, PNG, and PDF files are allowed.'
        );
      } else if (file.size && file.size > maxSizeBytes) {
        errorMsg = t('auth.fileTooLarge', 'File size must be under 4 MB.');
      }

      setFileErrors((prev) => ({ ...prev, [field]: errorMsg }));

      if (!errorMsg) {
        if (field === 'licenseDoc') setLicenseDoc(file);
        if (field === 'vehicleRc') setVehicleRc(file);
      } else {
        if (field === 'licenseDoc') setLicenseDoc(null);
        if (field === 'vehicleRc') setVehicleRc(null);
      }
    } catch (err) {
      console.error('File pick error', err);
    }
  };

  const validateForm = () => {
    if (!form.name || !form.email || !form.password || !form.phone) {
      setFormError(t('auth.fieldsRequired', 'All basic fields are required.'));
      return false;
    }
    if (form.role === 'driver') {
      if (!form.vehicleType || !form.vehicleReg || !form.licenseNo) {
        setFormError(t('auth.driverFieldsRequired', 'Driver details are required.'));
        return false;
      }
      if (!licenseDoc || !vehicleRc) {
        setFormError(t('auth.docsRequired', 'Both License and RC documents are required.'));
        return false;
      }
    }
    return true;
  };

  const handleRegisterSubmit = async () => {
    setFormError(null);
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (form.role === 'driver') {
        const formData = new FormData();
        Object.keys(form).forEach((key) => {
          formData.append(key, form[key as keyof typeof form]);
        });

        formData.append('licenseDoc', {
          uri: licenseDoc.uri,
          name: licenseDoc.name,
          type: licenseDoc.mimeType || 'image/jpeg',
        } as any);

        formData.append('vehicleRc', {
          uri: vehicleRc.uri,
          name: vehicleRc.name,
          type: vehicleRc.mimeType || 'image/jpeg',
        } as any);

        await register(formData);
      } else {
        await register(form);
      }
      setPendingEmail(form.email);
      setStep('otp');
      setResendTimer(30);
    } catch (err: any) {
      setFormError(err.response?.data?.message || t('auth.registrationFailed', 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  // OTP handlers
  const handleOtpChange = (text: string, index: number) => {
    const value = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setOtpError(null);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      setOtpError(t('auth.otpIncomplete', 'Please enter all 6 digits.'));
      return;
    }

    setOtpLoading(true);
    try {
      await verifyOtp(pendingEmail, code);
    } catch (err: any) {
      setOtpError(err.response?.data?.message || t('auth.otpInvalid', 'Invalid or expired OTP.'));
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    setOtpError(null);
    try {
      await resendOtp(pendingEmail);
      setResendTimer(30);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (err: any) {
      setOtpError(err.response?.data?.message || t('auth.resendFailed', 'Failed to resend OTP.'));
    } finally {
      setResending(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Language Toggle Header */}
      <View style={styles.langHeader}>
        <TouchableOpacity
          onPress={() => changeLanguage(language === 'en' ? 'ta' : 'en')}
          style={styles.langBtn}
        >
          <Text style={styles.langBtnText}>
            {language === 'en' ? 'தமிழ்' : 'English'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        {step === 'form' ? (
          <>
            <View style={styles.logoContainer}>
              <View style={styles.logoIcon}>
                <Text style={styles.logoText}>TP</Text>
              </View>
            </View>

            <Text style={styles.title}>{t('auth.createAccount', 'Create Account')}</Text>
            <Text style={styles.subtitle}>
              {t('auth.joinTravelPro', 'Join TravelPro today')}
            </Text>

            {!!formError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            )}

            <FormInput
              label={t('auth.fullName', 'Full Name')}
              placeholder={t('auth.fullNamePlaceholder', 'John Doe')}
              value={form.name}
              onChangeText={(val) => handleInputChange('name', val)}
              disabled={loading}
            />

            <FormInput
              label={t('auth.email', 'Email')}
              placeholder={t('auth.emailPlaceholder', 'you@example.com')}
              value={form.email}
              onChangeText={(val) => handleInputChange('email', val)}
              keyboardType="email-address"
              inputMode="email"
              disabled={loading}
            />

            <FormInput
              label={t('auth.password', 'Password')}
              placeholder={t('auth.passwordPlaceholder', 'Create a strong password')}
              value={form.password}
              onChangeText={(val) => handleInputChange('password', val)}
              secureTextEntry
              disabled={loading}
            />

            <FormInput
              label={t('auth.phone', 'Phone')}
              placeholder={t('auth.phonePlaceholder', '+1 (555) 000-0000')}
              value={form.phone}
              onChangeText={(val) => handleInputChange('phone', val)}
              keyboardType="phone-pad"
              inputMode="tel"
              disabled={loading}
            />

            {/* Account Type Selector */}
            <View style={styles.selectorGroup}>
              <Text style={styles.selectorLabel}>{t('auth.accountType', 'Account Type')}</Text>
              <View style={styles.selectorRow}>
                {['traveler', 'driver', 'agency_admin'].map((role) => (
                  <TouchableOpacity
                    key={role}
                    onPress={() => handleInputChange('role', role)}
                    style={[
                      styles.selectorOption,
                      form.role === role && styles.selectorOptionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.selectorOptionText,
                        form.role === role && styles.selectorOptionTextActive,
                      ]}
                    >
                      {role === 'traveler'
                        ? t('auth.traveler', 'Traveler')
                        : role === 'driver'
                        ? t('auth.driver', 'Driver')
                        : t('auth.agencyAdmin', 'Agency Admin')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Driver Fields */}
            {form.role === 'driver' && (
              <View style={styles.driverSection}>
                <Text style={styles.driverSectionTitle}>
                  🚘 {t('auth.driverDetails', 'Driver Details')}
                </Text>

                {/* Vehicle Type selector */}
                <View style={styles.selectorGroup}>
                  <Text style={styles.selectorLabel}>{t('auth.vehicleType', 'Vehicle Type')}</Text>
                  <View style={styles.vehicleTypeContainer}>
                    {['Sedan', 'SUV', 'Hatchback', 'Van', 'Bus'].map((vType) => (
                      <TouchableOpacity
                        key={vType}
                        onPress={() => handleInputChange('vehicleType', vType)}
                        style={[
                          styles.vehicleTypeOption,
                          form.vehicleType === vType && styles.vehicleTypeOptionActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.vehicleTypeOptionText,
                            form.vehicleType === vType && styles.vehicleTypeOptionTextActive,
                          ]}
                        >
                          {vType}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <FormInput
                  label={t('auth.vehicleRegistration', 'Vehicle Registration')}
                  placeholder={t('auth.vehicleRegPlaceholder', 'KA-01-AB-1234')}
                  value={form.vehicleReg}
                  onChangeText={(val) => handleInputChange('vehicleReg', val)}
                />

                <FormInput
                  label={t('auth.licenseNumber', 'License Number')}
                  placeholder={t('auth.licensePlaceholder', 'DL-123456789')}
                  value={form.licenseNo}
                  onChangeText={(val) => handleInputChange('licenseNo', val)}
                />

                {/* Driving License Attachment */}
                <View style={styles.filePickerGroup}>
                  <Text style={styles.filePickerLabel}>
                    {t('auth.licenseDoc', 'Driving License')} <Text style={{ color: '#c53030' }}>*</Text>
                  </Text>
                  <TouchableOpacity
                    onPress={() => handlePickDocument('licenseDoc')}
                    style={styles.filePickerBtn}
                  >
                    <Text style={styles.filePickerBtnText}>
                      {licenseDoc ? '📄 ' + licenseDoc.name : '📎 Select Document'}
                    </Text>
                  </TouchableOpacity>
                  {!!fileErrors.licenseDoc && (
                    <Text style={styles.filePickerError}>{fileErrors.licenseDoc}</Text>
                  )}
                </View>

                {/* Vehicle RC Attachment */}
                <View style={styles.filePickerGroup}>
                  <Text style={styles.filePickerLabel}>
                    {t('auth.vehicleRc', 'Vehicle RC')} <Text style={{ color: '#c53030' }}>*</Text>
                  </Text>
                  <TouchableOpacity
                    onPress={() => handlePickDocument('vehicleRc')}
                    style={styles.filePickerBtn}
                  >
                    <Text style={styles.filePickerBtnText}>
                      {vehicleRc ? '📄 ' + vehicleRc.name : '📎 Select Document'}
                    </Text>
                  </TouchableOpacity>
                  {!!fileErrors.vehicleRc && (
                    <Text style={styles.filePickerError}>{fileErrors.vehicleRc}</Text>
                  )}
                </View>

                {/* Optional Agency Selection */}
                <View style={styles.selectorGroup}>
                  <Text style={styles.selectorLabel}>{t('auth.agency', 'Agency')}</Text>
                  <View style={styles.facetsScroll}>
                    {agencies.map((agency) => {
                      const isSelected = form.agencyId === agency.id.toString();
                      return (
                        <TouchableOpacity
                          key={agency.id}
                          onPress={() => handleInputChange('agencyId', isSelected ? '' : agency.id.toString())}
                          style={[styles.facetChip, isSelected && styles.facetChipActive]}
                        >
                          <Text style={[styles.facetChipText, isSelected && styles.facetChipTextActive]}>
                            {agency.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}

            <Button onPress={handleRegisterSubmit} loading={loading} style={styles.submitBtn}>
              {t('auth.createAccountButton', 'Create Account')}
            </Button>

            <View style={styles.loginContainer}>
              <Text style={styles.loginLabel}>
                {t('auth.alreadyHaveAccount', 'Already have an account?')}{' '}
              </Text>
              <Link href="/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.loginLink}>{t('auth.signInLink', 'Sign in')}</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </>
        ) : (
          /* Step 2: OTP Verification */
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 52, marginBottom: 8 }}>📧</Text>
            <Text style={styles.title}>{t('auth.verifyEmail', 'Verify your email')}</Text>
            <Text style={styles.subtitle}>
              {t('auth.otpSentTo', 'We sent a 6-digit code to')}{' '}
              <Text style={{ fontWeight: '700', color: '#306D29' }}>{pendingEmail}</Text>
            </Text>

            {!!otpError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{otpError}</Text>
              </View>
            )}

            {/* OTP 6-box input */}
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <FormInputTyped
                  key={index}
                  label=""
                  value={digit}
                  onChangeText={(val: string) => handleOtpChange(val, index)}
                  placeholder=""
                  style={styles.otpBoxWrapper}
                  keyboardType="numeric"
                  inputMode="numeric"
                  disabled={otpLoading}
                  ref={(ref: any) => (otpRefs.current[index] = ref?.inputRef || ref)}
                />
              ))}
            </View>

            <Button onPress={handleVerifyOtp} loading={otpLoading} style={styles.submitBtn}>
              {t('auth.verifyOtp', 'Verify & Continue')}
            </Button>

            <View style={styles.resendContainer}>
              <Text style={styles.resendLabel}>
                {t('auth.didntReceive', "Didn't receive it?")}{' '}
              </Text>
              {resendTimer > 0 ? (
                <Text style={styles.resendTimerText}>
                  {t('auth.resendIn', 'Resend in')} {resendTimer}s
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResendOtp} disabled={resending}>
                  {resending ? (
                    <ActivityIndicator size="small" color="#306D29" />
                  ) : (
                    <Text style={styles.resendLink}>{t('auth.resendCode', 'Resend Code')}</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={() => {
                setStep('form');
                setOtp(['', '', '', '', '', '']);
              }}
              style={styles.backBtn}
            >
              <Text style={styles.backBtnText}>
                ← {t('auth.changeEmail', 'Change email / go back')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FBF5DD',
    justifyContent: 'center',
    padding: 20,
    paddingTop: 60,
  },
  langHeader: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  langBtn: {
    backgroundColor: 'rgba(48, 109, 41, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  langBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#306D29',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#306D29',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0D530E',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
    textAlign: 'center',
  },
  selectorGroup: {
    marginBottom: 16,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  selectorOption: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: 'rgba(13, 83, 14, 0.12)',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectorOptionActive: {
    backgroundColor: '#306D29',
    borderColor: '#306D29',
  },
  selectorOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4a5568',
  },
  selectorOptionTextActive: {
    color: '#FFFFFF',
  },
  driverSection: {
    marginTop: 16,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(13, 83, 14, 0.08)',
    paddingTop: 16,
  },
  driverSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D530E',
    marginBottom: 16,
  },
  vehicleTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vehicleTypeOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: 'rgba(13, 83, 14, 0.12)',
    borderRadius: 20,
  },
  vehicleTypeOptionActive: {
    backgroundColor: '#306D29',
    borderColor: '#306D29',
  },
  vehicleTypeOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4a5568',
  },
  vehicleTypeOptionTextActive: {
    color: '#FFFFFF',
  },
  filePickerGroup: {
    marginBottom: 16,
  },
  filePickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 6,
  },
  filePickerBtn: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: 'rgba(13, 83, 14, 0.12)',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  filePickerBtnText: {
    fontSize: 14,
    color: '#4a5568',
  },
  filePickerError: {
    color: '#c53030',
    fontSize: 12,
    marginTop: 4,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 6,
  },
  pickerWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(13, 83, 14, 0.12)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  submitBtn: {
    marginTop: 8,
    width: '100%',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#306D29',
  },
  otpContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginVertical: 20,
  },
  otpBoxWrapper: {
    width: 40,
    marginBottom: 0,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  resendLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#306D29',
  },
  resendTimerText: {
    fontSize: 14,
    color: '#a0aec0',
  },
  backBtn: {
    marginTop: 24,
  },
  backBtnText: {
    fontSize: 13,
    color: '#a0aec0',
    fontWeight: '600',
  },
  facetsScroll: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  facetChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: 'rgba(13, 83, 14, 0.12)',
    marginRight: 6,
  },
  facetChipActive: {
    backgroundColor: '#306D29',
    borderColor: '#306D29',
  },
  facetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4a5568',
  },
  facetChipTextActive: {
    color: '#FFFFFF',
  },
});
