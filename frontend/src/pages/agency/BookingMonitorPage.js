import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import BookingStatusBadge from '../../components/BookingStatusBadge';
import { ScrollReveal } from '../../hooks/useScrollAnimation';
import { SkeletonList } from '../../components/common/SkeletonLoader';
import Pagination from '../../components/common/Pagination';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

function BookingMonitorPage() {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setLoading(true);
    api.get('/agency/bookings', { params: { page, limit: 10, search: debouncedSearch } })
      .then(res => {
        setBookings(res.data.data || []);
        setTotalPages(res.data.totalPages || 0);
        setTotalItems(res.data.totalItems || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, debouncedSearch]);

  return (
    <div className="agency-page">
      <div className="container">
        <ScrollReveal className="animate-fade-up">
          <div className="admin-header">
            <div>
              <h1 className="admin-title">{t('agency.bookingMonitor', 'Booking Monitor')}</h1>
              <p className="text-muted">{t('agency.bookingsCount', '{{count}} bookings', { count: totalItems })}</p>
            </div>
            <input
              className="form-input"
              style={{ maxWidth: 260 }}
              placeholder="Search by traveler, driver, route…"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </ScrollReveal>

        {loading ? (
          <SkeletonList rows={6} />
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3 className="empty-state-title">{t('agency.noBookings', 'No Bookings')}</h3>
            <p className="empty-state-text">{search ? 'No bookings match your search.' : t('booking.noBookingsYet', 'No bookings have been made yet.')}</p>
          </div>
        ) : (
          <ScrollReveal className="animate-fade-up">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Traveler</th>
                    <th>Route</th>
                    <th>Driver</th>
                    <th>Travel Date</th>
                    <th>Seats</th>
                    <th>Total Fare</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <>
                      <tr
                        key={b.bookingId}
                        style={{ cursor: 'pointer' }}
                        className={expanded === b.bookingId ? 'table-row-expanded' : ''}
                        onClick={() => setExpanded(expanded === b.bookingId ? null : b.bookingId)}
                      >
                        <td><span className="font-semibold">#{b.bookingId}</span></td>
                        <td>
                          <div className="font-semibold">{b.travelerName || 'N/A'}</div>
                          {b.travelerPhone && <div className="text-muted" style={{ fontSize: '0.78rem' }}>📞 {b.travelerPhone}</div>}
                        </td>
                        <td>
                          {b.routeSource && b.routeDestination
                            ? <span className="font-semibold">{b.routeSource} → {b.routeDestination}</span>
                            : b.route || 'N/A'}
                        </td>
                        <td>
                          <div>{b.driverName || 'N/A'}</div>
                          {b.vehicleType && <div className="text-muted" style={{ fontSize: '0.78rem' }}>🚗 {b.vehicleType}</div>}
                        </td>
                        <td>{b.travelDate || 'N/A'}</td>
                        <td><span className="font-semibold">{b.seatCount}</span></td>
                        <td>{b.totalAmount ? <span className="text-accent font-bold">₹{b.totalAmount}</span> : b.fare ? `₹${b.fare}` : '—'}</td>
                        <td><BookingStatusBadge status={b.status} /></td>
                      </tr>
                      {expanded === b.bookingId && (
                        <tr key={`${b.bookingId}-detail`} className="table-row-detail">
                          <td colSpan={8}>
                            <div className="booking-expanded-detail">
                              <div className="booking-expanded-section">
                                <div className="booking-expanded-label">👤 Traveler</div>
                                <div><strong>{b.travelerName}</strong></div>
                                <div className="text-muted">{b.travelerEmail}</div>
                                <div className="text-muted">📞 {b.travelerPhone}</div>
                              </div>
                              <div className="booking-expanded-section">
                                <div className="booking-expanded-label">📍 Route</div>
                                <div><strong>{b.routeSource} → {b.routeDestination}</strong></div>
                                {b.routeDeparture && <div className="text-muted">Departs: {new Date(b.routeDeparture).toLocaleString()}</div>}
                                {b.routeArrival && <div className="text-muted">Arrives: {new Date(b.routeArrival).toLocaleString()}</div>}
                              </div>
                              <div className="booking-expanded-section">
                                <div className="booking-expanded-label">🚗 Driver & Vehicle</div>
                                <div><strong>{b.driverName}</strong></div>
                                <div className="text-muted">{b.vehicleType} — {b.vehicleReg}</div>
                                <div className="text-muted">📞 {b.driverPhone}</div>
                              </div>
                              <div className="booking-expanded-section">
                                <div className="booking-expanded-label">💰 Fare Details</div>
                                <div>₹{b.fare} × {b.seatCount} seats</div>
                                <div><strong className="text-accent">Total: ₹{b.totalAmount}</strong></div>
                                {b.cancelReason && <div style={{ color: '#dc2626', marginTop: 4 }}>Reason: {b.cancelReason}</div>}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </ScrollReveal>
        )}
      </div>
    </div>
  );
}

export default BookingMonitorPage;
