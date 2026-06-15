import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getBookings } from '../../services/bookingService';
import Pagination from '../../components/common/Pagination';
import BookingStatusBadge from '../../components/BookingStatusBadge';
import { ScrollReveal } from '../../hooks/useScrollAnimation';
import { SkeletonList } from '../../components/common/SkeletonLoader';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

function BookingHistoryPage() {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setLoading(true);
    setError('');
    getBookings(page, 10, debouncedSearch)
      .then(data => {
        setBookings(data.data || []);
        setTotalPages(data.totalPages || 0);
      })
      .catch(() => {
        setError(t('booking.failedToLoad', 'Failed to load bookings'));
        setBookings([]);
      })
      .finally(() => setLoading(false));
  }, [page, debouncedSearch, t]);

  return (
    <div className="booking-history-page">
      <div className="container">
        <ScrollReveal className="animate-fade-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            <h1 className="search-title" style={{ margin: 0 }}>{t('nav.bookings')}</h1>
            <input
              className="form-input"
              style={{ maxWidth: 300 }}
              placeholder={t('booking.searchPlaceholder', 'Search bookings…')}
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </ScrollReveal>

        {loading ? (
          <SkeletonList rows={5} />
        ) : error ? (
          <div className="error-state">
            <div className="error-state-icon">✕</div>
            <h3>{t('booking.errorLoading', 'Error Loading Bookings')}</h3>
            <p className="text-muted mt-sm">{error}</p>
          </div>
        ) : bookings.length === 0 ? (
          <ScrollReveal className="animate-scale-in">
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3 className="empty-state-title">{t('booking.noBookings') || 'No Bookings Yet'}</h3>
              <p className="empty-state-text">{t('booking.noBookingsHint') || 'Search for routes and book your first trip.'}</p>
              <div className="empty-state-action">
                <Link to="/search" className="btn btn-primary">{t('search.title') || 'Search Routes'}</Link>
              </div>
            </div>
          </ScrollReveal>
        ) : (
          <div className="booking-list">
            {bookings.map(b => (
              <ScrollReveal key={b.id} className="animate-fade-up">
                <Link to={`/bookings/${b.id}`} className="booking-list-item booking-list-item--rich">
                  {/* Left: Route + meta */}
                  <div className="booking-list-item-main">
                    <div className="booking-list-item-route">
                      <span className="booking-route-icon">📍</span>
                      <span className="booking-list-item-title">
                        {b.routeSource && b.routeDestination
                          ? `${b.routeSource} → ${b.routeDestination}`
                          : t('booking.route', 'Route')}
                      </span>
                      <BookingStatusBadge status={b.status} />
                    </div>
                    <div className="booking-list-item-details">
                      {b.travelDate && (
                        <span className="booking-detail-chip">
                          📅 {b.travelDate}
                        </span>
                      )}
                      {b.driverName && (
                        <span className="booking-detail-chip">
                          👤 {b.driverName}
                        </span>
                      )}
                      {b.vehicleType && (
                        <span className="booking-detail-chip">
                          🚗 {b.vehicleType}
                          {b.vehicleReg ? ` (${b.vehicleReg})` : ''}
                        </span>
                      )}
                      <span className="booking-detail-chip">
                        🪑 {b.seatCount} {b.seatCount === 1 ? 'seat' : 'seats'}
                      </span>
                    </div>
                    <div className="booking-list-item-id">
                      {t('booking.bookingId', 'Booking #{{id}}', { id: b.id })}
                      {b.routeDeparture && (
                        <span className="text-muted" style={{ marginLeft: 8, fontSize: '0.78rem' }}>
                          🕒 {new Date(b.routeDeparture).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Fare + arrow */}
                  <div className="booking-list-item-right">
                    {b.totalAmount && (
                      <div className="booking-list-item-fare">
                        <span className="booking-fare-amount">₹{b.totalAmount}</span>
                        <span className="booking-fare-label">{b.seatCount} seat{b.seatCount > 1 ? 's' : ''}</span>
                      </div>
                    )}
                    <span className="booking-list-item-arrow">→</span>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        )}

        {!loading && (
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        )}
      </div>
    </div>
  );
}

export default BookingHistoryPage;
