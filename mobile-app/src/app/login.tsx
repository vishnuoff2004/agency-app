import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { useLocalSearchParams, Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import FormInput from '../components/FormInput';
import Button from '../components/Button';

const demoCredentials = [
  { role: 'Admin', email: 'admin123@gmail.com', password: 'Admin123' },
  { role: 'Agency', email: 'agency@example.com', password: 'Password@123' },
  { role: 'Driver', email: 'driver@example.com', password: 'Password@123' },
  { role: 'Traveler', email: 'traveler@example.com', password: 'Password@123' },
];

export default function LoginScreen() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const { language, changeLanguage } = useLanguage();
  const params = useLocalSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    if (params.sessionExpired === 'true') {
      setFormError(t('auth.sessionExpired', 'Session expired. Please log in again.'));
    }
  }, [params, t]);

  const validateEmail = (emailStr: string) => {
    return /\S+@\S+\.\S+/.test(emailStr);
  };

  const handleLogin = async () => {
    setFormError(null);
    
    if (!email) {
      setFormError(t('auth.emailRequired', 'Email is required.'));
      return;
    }
    if (!validateEmail(email)) {
      setFormError(t('auth.invalidEmail', 'Please enter a valid email address.'));
      return;
    }
    if (!password) {
      setFormError(t('auth.passwordRequired', 'Password is required.'));
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setFormError(err.response?.data?.message || t('auth.loginFailed', 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    const cred = demoCredentials.find((c) => c.email === demoEmail);
    setEmail(demoEmail);
    setPassword(cred?.password || 'Password@123');
    setFormError(null);
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
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoText}>TP</Text>
          </View>
        </View>

        <Text style={styles.title}>{t('auth.welcomeBack', 'Welcome Back')}</Text>
        <Text style={styles.subtitle}>{t('auth.signIn', 'Sign in to your TravelPro account')}</Text>

        {!!formError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{formError}</Text>
          </View>
        )}

        <FormInput
          label={t('auth.email', 'Email')}
          placeholder={t('auth.emailPlaceholder', 'you@example.com')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          inputMode="email"
          disabled={loading}
        />

        <FormInput
          label={t('auth.password', 'Password')}
          placeholder={t('auth.passwordPlaceholder', 'Enter your password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          disabled={loading}
        />

        <Button onPress={handleLogin} loading={loading} style={styles.submitBtn}>
          {t('auth.signInButton', 'Sign In')}
        </Button>

        <View style={styles.registerContainer}>
          <Text style={styles.registerLabel}>{t('auth.dontHaveAccount', "Don't have an account?")} </Text>
          <Link href="/register" asChild>
            <TouchableOpacity>
              <Text style={styles.registerLink}>{t('auth.createOne', 'Create one')}</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Demo Accounts Section */}
        <View style={styles.demoSection}>
          <Pressable onPress={() => setShowDemo(!showDemo)} style={styles.demoHeader}>
            <Text style={styles.demoTitle}>💡 {t('auth.demoAccounts', 'Demo Accounts')}</Text>
            <Text style={styles.demoToggle}>{showDemo ? '▲' : '▼'}</Text>
          </Pressable>

          {showDemo && (
            <View style={styles.demoList}>
              {demoCredentials.map((cred) => (
                <TouchableOpacity
                  key={cred.email}
                  onPress={() => fillDemo(cred.email)}
                  style={styles.demoItem}
                >
                  <Text style={styles.demoItemRole}>{cred.role}</Text>
                  <Text style={styles.demoItemText}>
                    {cred.email} / {cred.password}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
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
    fontSize: 24,
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
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: 8,
    width: '100%',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  registerLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#306D29',
  },
  demoSection: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(13, 83, 14, 0.08)',
    paddingTop: 16,
  },
  demoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
  },
  demoToggle: {
    fontSize: 11,
    color: '#6b7280',
  },
  demoList: {
    marginTop: 10,
    gap: 8,
  },
  demoItem: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
  },
  demoItemRole: {
    fontWeight: '700',
    color: '#306D29',
    fontSize: 12,
    marginBottom: 2,
  },
  demoItemText: {
    fontSize: 12,
    color: '#4a5568',
  },
});
