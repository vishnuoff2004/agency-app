import React from 'react';
import { useTranslation } from 'react-i18next';

const statusMap = {
  pending: 'badge-pending',
  confirmed: 'badge-confirmed',
  'in-progress': 'badge-in-progress',
  in_progress: 'badge-in-progress',
  'on trip': 'badge-in-progress',
  'on_trip': 'badge-in-progress',
  completed: 'badge-completed',
  cancelled: 'badge-cancelled',
  rejected: 'badge-rejected',
};

function BookingStatusBadge({ status, className = '' }) {
  const { t } = useTranslation();
  const badgeClass = statusMap[status?.toLowerCase()] || 'badge-pending';
  const cleanStatus = status?.toLowerCase().replace(/[\s_-]+/g, '');
  const cleanKey = cleanStatus === 'ontrip' || cleanStatus === 'inprogress' ? 'onTrip' : cleanStatus;
  const displayStatus = t(`booking.status.${cleanKey}`, status || 'Unknown');
  return (
    <span className={`badge ${badgeClass} ${className}`}>
      {displayStatus}
    </span>
  );
}

export default BookingStatusBadge;
