import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { createBooking } from '../../services/bookingService';
import FormInput from '../../components/FormInput';
import Button from '../../components/Button';

export default function NewBookingScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();

  const routeId = params.routeId as string;
  const driverId = params.driverId as string;
  const initialDate = (params.date as string) || '';

  const [seatCount, setSeatCount] = useState('1');
  const [travelDate, setTravelDate] = useState(initialDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError('');
    const seats = parseInt(seatCount, 10);
    
    if (isNaN(seats) || seats < 1 || seats > 20) {
      setError(t('booking.seatsError', 'Please enter a seat count between 1 and 20.'));
      return;
    }

    if (!travelDate) {
      setError(t('booking.dateError', 'Please enter a valid travel date (YYYY-MM-DD).'));
      return;
    }

    setLoading(true);
    try {
      await createBooking({
        routeId: Number(routeId),
        driverId: Number(driverId),
        seatCount: seats,
        travelDate,
      });
      setSuccess(true);
      setTimeout(() => {
        // Redirect to booking history page
        router.replace('/(tabs)/bookings');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || t('booking.bookingFailed', 'Booking failed'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIconContainer}>
          <Text style={styles.successIcon}>✓</Text>
        </View>
        <Text style={styles.successTitle}>
          {t('booking.bookingConfirmed', 'Booking Confirmed!')}
        </Text>
        <Text style={styles.successSubtitle}>
          {t('booking.redirecting', 'Redirecting to your bookings...')}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('booking.bookATrip', 'Book a Trip')}</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {!!error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <FormInput
            label={t('booking.routeId', 'Route ID')}
            value={routeId || ''}
            onChangeText={() => {}}
            disabled
          />

          <FormInput
            label={t('booking.numberOfSeats', 'Number of Seats')}
            placeholder="1-20"
            value={seatCount}
            onChangeText={setSeatCount}
            keyboardType="numeric"
            inputMode="numeric"
            disabled={loading}
          />

          <FormInput
            label={t('booking.travelDate', 'Travel Date')}
            placeholder="YYYY-MM-DD"
            value={travelDate}
            onChangeText={setTravelDate}
            disabled={!!initialDate || loading}
          />

          {!!initialDate && (
            <Text style={styles.helperText}>
              🔒 {t('booking.dateLocked', 'Travel date is fixed based on route schedule')}
            </Text>
          )}

          <Button onPress={handleSubmit} loading={loading} style={styles.submitBtn}>
            {t('booking.confirmBooking', 'Confirm Booking')}
          </Button>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(13, 83, 14, 0.08)',
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0D530E',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: -8,
    marginBottom: 8,
  },
  submitBtn: {
    width: '100%',
    marginTop: 8,
  },
  successContainer: {
    flex: 1,
    backgroundColor: '#FBF5DD',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#306D29',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#306D29',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  successIcon: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0D530E',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
