import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Button from '../../components/common/Button';
import BookingStatusBadge from '../../components/BookingStatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ScrollReveal } from '../../hooks/useScrollAnimation';

function BookingDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get(`/bookings/${id}`),
      api.get(`/bookings/${id}/status-history`),
    ])
      .then(([b, h]) => {
        setBooking(b.data);
        setHistory(h.data);
      })
      .catch(() => navigate('/bookings'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.put(`/bookings/${id}/cancel`);
      navigate('/bookings');
    } catch (err) {
      alert(err.response?.data?.message || t('booking.cannotCancel', 'Cannot cancel'));
    } finally {
      setCancelling(false);
    }
  };

  const translateStatus = (status) => {
    if (!status) return 'N/A';
    const cleanStatus = status.toLowerCase().replace(/[\s_-]+/g, '');
    const cleanKey = cleanStatus === 'ontrip' || cleanStatus === 'inprogress' ? 'onTrip' : cleanStatus;
    return t(`booking.status.${cleanKey}`, status);
  };


  if (loading) return <LoadingSpinner text={t('booking.loadingDetails', 'Loading booking details...')} />;
  if (!booking) return (
    <div className="booking-detail-page">
      <div className="container">
        <div className="error-state">
          <div className="error-state-icon">✕</div>
          <h3>{t('booking.notFound', 'Booking Not Found')}</h3>
          <Button variant="secondary" onClick={() => navigate('/bookings')}>{t('booking.goBack', 'Go Back')}</Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="booking-detail-page">
      <div className="container">
        <ScrollReveal className="animate-fade-up">
          <div className="booking-detail-card">
            <div className="booking-detail-header">
              <h1>{t('booking.bookingId', 'Booking #{{id}}', { id: booking.id })}</h1>
              <div className="booking-detail-meta">
                <div className="booking-detail-meta-item">
                  <span className="booking-detail-meta-label">{t('agency.status', 'Status')}</span>
                  <BookingStatusBadge status={booking.status} />
                </div>
                <div className="booking-detail-meta-item">
                  <span className="booking-detail-meta-label">{t('booking.seatCount', 'Seats')}</span>
                  <span className="booking-detail-meta-value">{booking.seatCount}</span>
                </div>
                <div className="booking-detail-meta-item">
                  <span className="booking-detail-meta-label">{t('booking.travelDate', 'Travel Date')}</span>
                  <span className="booking-detail-meta-value">{booking.travelDate}</span>
                </div>
              </div>
            </div>
            <div className="booking-detail-body">
              {/* Info Grid */}
              <div className="booking-info-grid">
                {/* 1. Trip Information Card */}
                {booking.Route ? (
                  <div className="detail-section-card">
                    <h3 className="detail-section-title">
                      <span>📍</span> {t('booking.tripInfo', 'Trip Information')}
                    </h3>
                    <div className="detail-field-group">
                      <div className="detail-field">
                        <span className="detail-label">{t('booking.route', 'Route')}</span>
                        <span className="detail-value font-semibold">
                          {booking.Route.source} → {booking.Route.destination}
                        </span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">{t('booking.departure', 'Departure')}</span>
                        <span className="detail-value">
                          {new Date(booking.Route.departureTime).toLocaleString()}
                        </span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">{t('booking.arrival', 'Arrival')}</span>
                        <span className="detail-value">
                          {new Date(booking.Route.arrivalTime).toLocaleString()}
                        </span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">{t('booking.farePerSeat', 'Fare per Seat')}</span>
                        <span className="detail-value font-mono">₹{booking.Route.fare}</span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">{t('booking.totalAmount', 'Total Amount')}</span>
                        <span className="detail-value text-accent font-bold" style={{ fontSize: '1.15rem' }}>
                          ₹{(Number(booking.Route.fare) * booking.seatCount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="detail-section-card">
                    <h3 className="detail-section-title">
                      <span>📍</span> {t('booking.tripInfo', 'Trip Information')}
                    </h3>
                    <p className="text-muted">{t('booking.routeDetailsUnavailable', 'Route details unavailable')}</p>
                  </div>
                )}

                {/* 2. Driver & Vehicle Card */}
                {booking.Driver ? (
                  <div className="detail-section-card">
                    <h3 className="detail-section-title">
                      <span>👤</span> {t('booking.driverAndVehicle', 'Driver & Vehicle')}
                    </h3>
                    <div className="detail-field-group">
                      <div className="detail-field">
                        <span className="detail-label">{t('booking.driverName', 'Driver Name')}</span>
                        <span className="detail-value font-semibold">{booking.Driver.name}</span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">{t('booking.driverContact', 'Driver Contact')}</span>
                        <span className="detail-value">{booking.Driver.phone}</span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">{t('booking.vehicleType', 'Vehicle Type')}</span>
                        <span className="detail-value">{booking.Driver.vehicleType || 'N/A'}</span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">{t('booking.vehicleRegNo', 'Vehicle Reg. No')}</span>
                        <span className="detail-value font-mono">{booking.Driver.vehicleReg || 'N/A'}</span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">{t('booking.licenseNumber', 'License Number')}</span>
                        <span className="detail-value font-mono">{booking.Driver.licenseNo || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="detail-section-card">
                    <h3 className="detail-section-title">
                      <span>👤</span> {t('booking.driverAndVehicle', 'Driver & Vehicle')}
                    </h3>
                    <p className="text-muted">{t('booking.driverDetailsUnavailable', 'Driver details unavailable')}</p>
                  </div>
                )}

                {/* 3. Agency Details Card */}
                {booking.Driver?.Agency ? (
                  <div className="detail-section-card">
                    <h3 className="detail-section-title">
                      <span>🏢</span> {t('booking.serviceProvider', 'Service Provider')}
                    </h3>
                    <div className="detail-field-group">
                      <div className="detail-field">
                        <span className="detail-label">{t('booking.agencyName', 'Agency Name')}</span>
                        <span className="detail-value font-semibold">
                          {booking.Driver.Agency.name}
                        </span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">{t('booking.agencyContact', 'Agency Contact')}</span>
                        <span className="detail-value">{booking.Driver.Agency.phone}</span>
                      </div>
                      <div className="detail-field">
                        <span className="detail-label">{t('booking.agencyEmail', 'Agency Email')}</span>
                        <span className="detail-value">{booking.Driver.Agency.email}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="detail-section-card">
                    <h3 className="detail-section-title">
                      <span>🏢</span> {t('booking.serviceProvider', 'Service Provider')}
                    </h3>
                    <p className="text-muted">{t('booking.agencyDetailsUnavailable', 'Agency details unavailable')}</p>
                  </div>
                )}
              </div>

              {['Pending', 'Confirmed'].includes(booking.status) && (
                <div className="booking-detail-actions">
                  <Button variant="danger" onClick={handleCancel} loading={cancelling}>
                    {t('booking.cancel', 'Cancel Booking')}
                  </Button>
                </div>
              )}

              {history.length > 0 && (
                <>
                  <h3 style={{ marginTop: 32, marginBottom: 16 }}>{t('booking.statusHistory', 'Status History')}</h3>
                  <div className="booking-status-timeline">
                    {history.map((h, i) => (
                      <div key={i} className="booking-status-timeline-item">
                        <div>
                          <div className="booking-status-timeline-status">
                            {translateStatus(h.fromStatus)} → {translateStatus(h.toStatus)}
                          </div>
                          <div className="booking-status-timeline-date">
                            {new Date(h.changedAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}

export default BookingDetailPage;
