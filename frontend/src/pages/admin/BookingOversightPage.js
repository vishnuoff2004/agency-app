import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { getAllBookings } from '../../services/adminService';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import BookingStatusBadge from '../../components/BookingStatusBadge';
import { ScrollReveal } from '../../hooks/useScrollAnimation';
import { SkeletonTable } from '../../components/common/SkeletonLoader';

function BookingOversightPage() {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    getAllBookings(page, 10, debouncedSearch)
      .then(data => {
        setBookings(Array.isArray(data) ? data : data.data || []);
        setTotalPages(data.totalPages || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, debouncedSearch]);

  const handleCancel = async (id) => {
    setCancelling(id);
    try {
      await api.put(`/admin/bookings/${id}/cancel`, { reason: 'Platform policy' });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'Cancelled' } : b));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="admin-page">
      <div className="container">
        <ScrollReveal className="animate-fade-up">
          <div className="admin-header">
            <div>
              <h1 className="admin-title">{t('admin.bookingOversight', 'Booking Oversight')}</h1>
              <p className="text-muted">{t('admin.totalBookingsCount', '{{count}} total bookings', { count: bookings.length })}</p>
            </div>
            <input
              className="form-input"
              style={{ maxWidth: 280 }}
              placeholder="Search by traveler, driver, agency, route…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </ScrollReveal>

        {loading ? (
          <SkeletonTable rows={8} />
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
                    <th>Agency</th>
                    <th>Travel Date</th>
                    <th>Seats</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <React.Fragment key={b.id}>
                      <tr
                        className={expanded === b.id ? 'table-row-expanded' : ''}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setExpanded(expanded === b.id ? null : b.id)}
                      >
                        <td><span className="font-semibold">#{b.id}</span></td>
                        <td>
                          <div className="font-semibold">{b.travelerName || 'N/A'}</div>
                          {b.travelerPhone && <div className="text-muted" style={{ fontSize: '0.78rem' }}>📞 {b.travelerPhone}</div>}
                        </td>
                        <td>
                          {b.routeSource && b.routeDestination
                            ? <span className="font-semibold">{b.routeSource} → {b.routeDestination}</span>
                            : 'N/A'}
                        </td>
                        <td>
                          <div>{b.driverName || 'N/A'}</div>
                          {b.vehicleType && <div className="text-muted" style={{ fontSize: '0.78rem' }}>🚗 {b.vehicleType}</div>}
                        </td>
                        <td><span className="badge-agency">{b.agencyName || 'N/A'}</span></td>
                        <td>{b.travelDate || 'N/A'}</td>
                        <td><span className="font-semibold">{b.seatCount}</span></td>
                        <td>{b.totalAmount ? <span className="text-accent font-bold">₹{b.totalAmount}</span> : '—'}</td>
                        <td><BookingStatusBadge status={b.status} /></td>
                        <td onClick={e => e.stopPropagation()}>
                          {b.status !== 'Cancelled' && b.status !== 'Completed' && (
                            <Button
                              variant="danger"
                              size="sm"
                              loading={cancelling === b.id}
                              onClick={() => handleCancel(b.id)}
                            >
                              {t('common.cancel', 'Cancel')}
                            </Button>
                          )}
                        </td>
                      </tr>
                      {expanded === b.id && (
                        <tr className="table-row-detail">
                          <td colSpan={10}>
                            <div className="booking-expanded-detail">
                              <div className="booking-expanded-section">
                                <div className="booking-expanded-label">👤 Traveler</div>
                                <div><strong>{b.travelerName}</strong></div>
                                <div className="text-muted">{b.travelerEmail}</div>
                                <div className="text-muted">{b.travelerPhone}</div>
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
                                <div className="text-muted">License: {b.licenseNo}</div>
                              </div>
                              <div className="booking-expanded-section">
                                <div className="booking-expanded-label">🏢 Agency</div>
                                <div><strong>{b.agencyName}</strong></div>
                                <div className="text-muted">{b.agencyEmail}</div>
                                <div className="text-muted">📞 {b.agencyPhone}</div>
                              </div>
                              <div className="booking-expanded-section">
                                <div className="booking-expanded-label">💰 Fare</div>
                                <div>₹{b.fare} × {b.seatCount} seats</div>
                                <div><strong className="text-accent">Total: ₹{b.totalAmount}</strong></div>
                                {b.cancelReason && <div className="text-muted" style={{ color: '#dc2626', marginTop: 4 }}>Reason: {b.cancelReason}</div>}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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

export default BookingOversightPage;
