import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getUserProfile, updateUserProfile } from '../../services/bookingService';
import FormInput from '../../components/FormInput';
import Button from '../../components/Button';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { user, logout, updateUserLocal } = useAuth();
  const { language, changeLanguage } = useLanguage();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getUserProfile();
      setName(data.name || '');
      setPhone(data.phone || '');
      setEmail(data.email || '');
      setRole(data.role || '');
      
      // Update local context profile if fields differ
      updateUserLocal({ name: data.name, phone: data.phone });
    } catch (err: any) {
      setError(t('profile.failedToLoad', 'Failed to load profile details'));
      // Fall back to context data if offline
      if (user) {
        setName(user.name || '');
        setPhone(user.phone || '');
        setEmail(user.email || '');
        setRole(user.role || '');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!name || !phone) {
      Alert.alert(t('common.error', 'Error'), t('profile.fieldsRequired', 'Name and Phone are required.'));
      return;
    }

    setSaving(true);
    try {
      await updateUserProfile({ name, phone });
      updateUserLocal({ name, phone });
      setIsEditing(false);
      Alert.alert(t('common.success', 'Success'), t('profile.saveSuccess', 'Profile updated successfully!'));
    } catch (err: any) {
      Alert.alert(
        t('common.error', 'Error'),
        err.response?.data?.message || t('profile.saveFailed', 'Failed to update profile')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#306D29" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Profile Card Header */}
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {name ? name.substring(0, 2).toUpperCase() : 'U'}
          </Text>
        </View>
        <Text style={styles.profileName}>{name}</Text>
        <Text style={styles.profileRole}>
          {role === 'traveler' ? t('auth.traveler', 'Traveler') : role}
        </Text>
      </View>

      {/* Info Card Block */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('profile.details', 'Personal Information')}</Text>

        {!!error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.detailsGroup}>
          <FormInput
            label={t('auth.fullName', 'Full Name')}
            value={name}
            onChangeText={setName}
            disabled={!isEditing || saving}
          />

          <FormInput
            label={t('auth.phone', 'Phone')}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            disabled={!isEditing || saving}
          />

          <FormInput
            label={t('auth.email', 'Email')}
            value={email}
            onChangeText={() => {}}
            disabled
          />
        </View>

        {isEditing ? (
          <View style={styles.actionRow}>
            <Button onPress={handleCancel} variant="outline" style={styles.flexBtn} disabled={saving}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button onPress={handleSave} loading={saving} style={styles.flexBtn}>
              {t('common.save', 'Save')}
            </Button>
          </View>
        ) : (
          <Button onPress={() => setIsEditing(true)} variant="outline" style={styles.editBtn}>
            ✏️ {t('common.edit', 'Edit Profile')}
          </Button>
        )}
      </View>

      {/* Preferences Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('language.label', 'Language Settings')}</Text>
        <View style={styles.langRow}>
          <Text style={styles.langLabel}>
            {t('language.switcher.label', 'App Language')}: {language === 'en' ? 'English' : 'தமிழ்'}
          </Text>
          <TouchableOpacity
            onPress={() => changeLanguage(language === 'en' ? 'ta' : 'en')}
            style={styles.langBtn}
          >
            <Text style={styles.langBtnText}>
              {language === 'en' ? 'தமிழ்' : 'English'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout Button */}
      <Button onPress={logout} variant="danger" style={styles.logoutBtn}>
        🚪 {t('auth.logout', 'Logout')}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: '#FBF5DD',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FBF5DD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(13, 83, 14, 0.05)',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#306D29',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 28,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D530E',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(13, 83, 14, 0.05)',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D530E',
    marginBottom: 16,
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
  detailsGroup: {
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  flexBtn: {
    flex: 1,
  },
  editBtn: {
    width: '100%',
    marginTop: 8,
  },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  langLabel: {
    fontSize: 14,
    color: '#4a5568',
    fontWeight: '600',
  },
  langBtn: {
    backgroundColor: 'rgba(48, 109, 41, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  langBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#306D29',
  },
  logoutBtn: {
    width: '100%',
    marginTop: 8,
  },
});
