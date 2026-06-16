import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  getBookingDetail,
  getBookingStatusHistory,
  cancelBooking,
} from '../../../services/bookingService';
import BookingStatusBadge from '../../../components/BookingStatusBadge';
import Button from '../../../components/Button';

export default function BookingDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();

  const [booking, setBooking] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    Promise.all([getBookingDetail(id as string), getBookingStatusHistory(id as string)])
      .then(([bDetail, bHistory]) => {
        setBooking(bDetail);
        setHistory(bHistory || []);
      })
      .catch((err) => {
        console.error('Failed to load booking detail', err);
        Alert.alert(t('common.error', 'Error'), t('booking.notFound', 'Booking not found'));
        router.back();
      })
      .finally(() => setLoading(false));
  }, [id, t]);

  const handleCancelBooking = () => {
    Alert.alert(
      t('booking.cancel', 'Cancel Booking'),
      t('booking.cancelConfirm', 'Are you sure you want to cancel this booking?'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('common.confirm', 'Confirm'),
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await cancelBooking(id as string);
              // Refresh page data
              const bDetail = await getBookingDetail(id as string);
              const bHistory = await getBookingStatusHistory(id as string);
              setBooking(bDetail);
              setHistory(bHistory || []);
            } catch (err: any) {
              Alert.alert(
                t('common.error', 'Error'),
                err.response?.data?.message || t('booking.cannotCancel', 'Cannot cancel')
              );
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const translateStatus = (status: string) => {
    if (!status) return 'N/A';
    const cleanStatus = status.toLowerCase().replace(/[\s_-]+/g, '');
    const cleanKey = cleanStatus === 'ontrip' || cleanStatus === 'inprogress' ? 'onTrip' : cleanStatus;
    return t(`booking.status.${cleanKey}`, status);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#306D29" />
        <Text style={styles.loadingText}>
          {t('booking.loadingDetails', 'Loading booking details...')}
        </Text>
      </View>
    );
  }

  if (!booking) return null;

  const showCancelButton = ['Pending', 'Confirmed'].includes(booking.status);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.bookingId}>
          {t('booking.bookingId', 'Booking #{{id}}', { id: booking.id })}
        </Text>
        <View style={styles.headerMetaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{t('agency.status', 'Status')}</Text>
            <BookingStatusBadge status={booking.status} />
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{t('booking.seatCount', 'Seats')}</Text>
            <Text style={styles.metaValue}>{booking.seatCount}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{t('booking.travelDate', 'Travel Date')}</Text>
            <Text style={styles.metaValue}>{booking.travelDate}</Text>
          </View>
        </View>
      </View>

      {/* 1. Trip Information Card */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>📍 {t('booking.tripInfo', 'Trip Information')}</Text>
        
        {booking.Route ? (
          <View style={styles.fieldGroup}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{t('booking.route', 'Route')}</Text>
              <Text style={styles.fieldValueBold}>
                {booking.Route.source} → {booking.Route.destination}
              </Text>
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{t('booking.departure', 'Departure')}</Text>
              <Text style={styles.fieldValue}>
                {new Date(booking.Route.departureTime).toLocaleString()}
              </Text>
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{t('booking.arrival', 'Arrival')}</Text>
              <Text style={styles.fieldValue}>
                {new Date(booking.Route.arrivalTime).toLocaleString()}
              </Text>
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{t('booking.farePerSeat', 'Fare per Seat')}</Text>
              <Text style={styles.fieldValueFontMono}>₹{booking.Route.fare}</Text>
            </View>

            <View style={[styles.fieldRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>{t('booking.totalAmount', 'Total Amount')}</Text>
              <Text style={styles.totalValue}>
                ₹{(Number(booking.Route.fare) * booking.seatCount).toFixed(2)}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.unavailableText}>
            {t('booking.routeDetailsUnavailable', 'Route details unavailable')}
          </Text>
        )}
      </View>

      {/* 2. Driver & Vehicle Card */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>👤 {t('booking.driverAndVehicle', 'Driver & Vehicle')}</Text>
        
        {booking.Driver ? (
          <View style={styles.fieldGroup}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{t('booking.driverName', 'Driver Name')}</Text>
              <Text style={styles.fieldValueBold}>{booking.Driver.name}</Text>
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{t('booking.driverContact', 'Driver Contact')}</Text>
              <Text style={styles.fieldValue}>{booking.Driver.phone}</Text>
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{t('booking.vehicleType', 'Vehicle Type')}</Text>
              <Text style={styles.fieldValue}>{booking.Driver.vehicleType || 'N/A'}</Text>
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{t('booking.vehicleRegNo', 'Vehicle Reg. No')}</Text>
              <Text style={styles.fieldValueFontMono}>{booking.Driver.vehicleReg || 'N/A'}</Text>
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{t('booking.licenseNumber', 'License Number')}</Text>
              <Text style={styles.fieldValueFontMono}>{booking.Driver.licenseNo || 'N/A'}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.unavailableText}>
            {t('booking.driverDetailsUnavailable', 'Driver details unavailable')}
          </Text>
        )}
      </View>

      {/* 3. Service Provider Card */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>🏢 {t('booking.serviceProvider', 'Service Provider')}</Text>
        
        {booking.Driver?.Agency ? (
          <View style={styles.fieldGroup}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{t('booking.agencyName', 'Agency Name')}</Text>
              <Text style={styles.fieldValueBold}>{booking.Driver.Agency.name}</Text>
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{t('booking.agencyContact', 'Agency Contact')}</Text>
              <Text style={styles.fieldValue}>{booking.Driver.Agency.phone}</Text>
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{t('booking.agencyEmail', 'Agency Email')}</Text>
              <Text style={styles.fieldValue}>{booking.Driver.Agency.email}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.unavailableText}>
            {t('booking.agencyDetailsUnavailable', 'Agency details unavailable')}
          </Text>
        )}
      </View>

      {/* Cancel Booking Button */}
      {showCancelButton && (
        <Button
          onPress={handleCancelBooking}
          variant="danger"
          loading={cancelling}
          style={styles.cancelBtn}
        >
          {t('booking.cancel', 'Cancel Booking')}
        </Button>
      )}

      {/* Status History Timeline */}
      {history.length > 0 && (
        <View style={styles.timelineSection}>
          <Text style={styles.timelineTitle}>{t('booking.statusHistory', 'Status History')}</Text>
          <View style={styles.timeline}>
            {history.map((h, i) => {
              const isLast = i === history.length - 1;
              return (
                <View key={i} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={styles.timelineNode} />
                    {!isLast && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineStatusText}>
                      {translateStatus(h.fromStatus)} → {translateStatus(h.toStatus)}
                    </Text>
                    <Text style={styles.timelineDateText}>
                      {new Date(h.changedAt).toLocaleString()}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
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
  loadingText: {
    marginTop: 12,
    color: '#0D530E',
    fontWeight: '600',
    fontSize: 14,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(13, 83, 14, 0.05)',
  },
  bookingId: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D530E',
    marginBottom: 16,
  },
  headerMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(13, 83, 14, 0.05)',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D530E',
    marginBottom: 14,
  },
  fieldGroup: {
    gap: 10,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  fieldValue: {
    fontSize: 13,
    color: '#1a1a2e',
  },
  fieldValueBold: {
    fontSize: 13,
    color: '#1a1a2e',
    fontWeight: '700',
  },
  fieldValueFontMono: {
    fontSize: 13,
    color: '#1a1a2e',
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(13, 83, 14, 0.08)',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#306D29',
  },
  unavailableText: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  cancelBtn: {
    width: '100%',
    marginBottom: 24,
  },
  timelineSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(13, 83, 14, 0.05)',
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D530E',
    marginBottom: 16,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 50,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 12,
  },
  timelineNode: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#306D29',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#cbd5e1',
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
  },
  timelineStatusText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  timelineDateText: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
});
