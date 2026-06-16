import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

interface BookingStatusBadgeProps {
  status: string;
}

const statusMap: Record<string, string> = {
  pending: 'pending',
  confirmed: 'confirmed',
  'in-progress': 'onTrip',
  in_progress: 'onTrip',
  'on trip': 'onTrip',
  on_trip: 'onTrip',
  completed: 'completed',
  cancelled: 'cancelled',
  rejected: 'rejected',
};

export default function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  const { t } = useTranslation();
  const cleanStatus = status?.toLowerCase() || 'pending';
  const mappedKey = statusMap[cleanStatus] || 'pending';
  const displayStatus = t(`booking.status.${mappedKey}`, status || 'Unknown');

  const getStyle = () => {
    switch (mappedKey) {
      case 'confirmed':
        return styles.confirmed;
      case 'onTrip':
        return styles.onTrip;
      case 'completed':
        return styles.completed;
      case 'cancelled':
      case 'rejected':
        return styles.cancelled;
      case 'pending':
      default:
        return styles.pending;
    }
  };

  const getTextStyle = () => {
    switch (mappedKey) {
      case 'confirmed':
        return styles.confirmedText;
      case 'onTrip':
        return styles.onTripText;
      case 'completed':
        return styles.completedText;
      case 'cancelled':
      case 'rejected':
        return styles.cancelledText;
      case 'pending':
      default:
        return styles.pendingText;
    }
  };

  return (
    <View style={[styles.badge, getStyle()]}>
      <Text style={[styles.text, getTextStyle()]}>{displayStatus}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  pending: {
    backgroundColor: '#fef3c7',
  },
  pendingText: {
    color: '#d97706',
  },
  confirmed: {
    backgroundColor: '#dcfce7',
  },
  confirmedText: {
    color: '#15803d',
  },
  onTrip: {
    backgroundColor: '#dbeafe',
  },
  onTripText: {
    color: '#1d4ed8',
  },
  completed: {
    backgroundColor: 'rgba(48, 109, 41, 0.1)',
  },
  completedText: {
    color: '#306D29',
  },
  cancelled: {
    backgroundColor: '#fee2e2',
  },
  cancelledText: {
    color: '#b91c1c',
  },
});
