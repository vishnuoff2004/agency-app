import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Button from '../../components/common/Button';

function BookingPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const routeId = searchParams.get('routeId');
  const driverId = searchParams.get('driverId');
  const initialDate = searchParams.get('date') || '';

  const [seatCount, setSeatCount] = useState(1);
  const [travelDate, setTravelDate] = useState(initialDate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/bookings', { routeId: Number(routeId), driverId: Number(driverId), seatCount: Number(seatCount), travelDate });
      setSuccess(true);
      setTimeout(() => navigate('/bookings'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || t('booking.bookingFailed', 'Booking failed'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="booking-page">
        <div className="container">
          <div className="success-state">
            <div className="success-state-icon">✓</div>
            <h2>{t('booking.bookingConfirmed', 'Booking Confirmed!')}</h2>
            <p className="text-muted mt-sm">{t('booking.redirecting', 'Redirecting to your bookings...')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <div className="container">
        <div className="booking-form-card animate-fade-up revealed">
          <h2 className="booking-form-title">{t('booking.bookATrip', 'Book a Trip')}</h2>

          {error && <div className="auth-error" role="alert">{error}</div>}

          <form onSubmit={handleSubmit}>
            {!routeId && (
              <div className="form-group">
                <label className="form-label">{t('booking.routeId', 'Route ID')}</label>
                <input className="form-input" value={routeId || ''} disabled />
              </div>
            )}
            <div className="form-group">
              <label className="form-label" htmlFor="seats">{t('booking.numberOfSeats', 'Number of Seats')}</label>
              <input
                id="seats"
                className="form-input"
                type="number"
                min="1"
                max="20"
                value={seatCount}
                onChange={e => setSeatCount(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="travel-date">{t('booking.travelDate', 'Travel Date')}</label>
              <input
                id="travel-date"
                className="form-input"
                type="date"
                value={travelDate}
                onChange={e => setTravelDate(e.target.value)}
                disabled={!!initialDate}
                required
              />
              {initialDate && (
                <small className="text-muted mt-xs" style={{ display: 'block', fontSize: '0.8rem', marginTop: '4px' }}>
                  {t('booking.dateLocked', 'Travel date is fixed based on route schedule')}
                </small>
              )}
            </div>
            <Button type="submit" loading={loading} className="w-full" size="lg">
              {t('booking.confirmBooking', 'Confirm Booking')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default BookingPage;
