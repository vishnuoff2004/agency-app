import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Button from '../../components/common/Button';
import { ScrollReveal } from '../../hooks/useScrollAnimation';
import Pagination from '../../components/common/Pagination';

// ── Confirmation Modal (rendered via portal directly onto document.body) ──────
function RemoveConfirmModal({ driver, onConfirm, onCancel, removing }) {
  const { t } = useTranslation();
  if (!driver) return null;

  const initials = driver.name
    ? driver.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'D';

  const available = driver.available === true || driver.available === 1;

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#fff', borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
          width: '100%', maxWidth: '460px',
          padding: '32px',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '2.4rem', marginBottom: '10px' }}>⚠️</div>
          <h2 style={{ margin: '0 0 6px', fontSize: '1.3rem', fontWeight: 800 }}>{t('agency.removeDriver', 'Remove Driver')}</h2>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#6b7280' }}>
            {t('agency.reviewDriverDetails', 'Review driver details before confirming removal.')}
          </p>
        </div>

        {/* Driver detail box */}
        <div style={{
          background: '#f9fafb', border: '1px solid #e5e7eb',
          borderRadius: '12px', padding: '20px', marginBottom: '20px',
          display: 'flex', gap: '16px', alignItems: 'flex-start',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg,#ef4444,#b91c1c)',
            color: '#fff', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: 800, fontSize: '1rem',
          }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '12px' }}>
              {driver.name || '—'}
            </div>
            {[
              [t('agency.phoneLabel', '📞 Phone'), driver.phone || 'N/A'],
              [t('agency.vehicleLabel', '🚗 Vehicle'), driver.vehicleType || 'N/A'],
              [t('agency.regNoLabel', '🔖 Reg. No.'), driver.vehicleReg || 'N/A'],
              [t('agency.licenseLabel', '📋 License'), driver.licenseNo || 'N/A'],
              [t('agency.statusLabel', '✅ Status'), available ? t('agency.availableStatus', 'Available') : t('agency.unavailableStatus', 'Unavailable')],
            ].map(([label, value]) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: '0.83rem', marginBottom: '6px',
              }}>
                <span style={{ color: '#6b7280' }}>{label}</span>
                <span style={{
                  fontWeight: 600,
                  color: label.includes('Status') ? (available ? '#16a34a' : '#6b7280') : '#111827',
                }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Warning */}
        <p style={{
          fontSize: '0.82rem', color: '#92400e',
          background: 'rgba(234,179,8,0.08)',
          border: '1px solid rgba(234,179,8,0.3)',
          borderRadius: '8px', padding: '10px 14px',
          marginBottom: '24px', lineHeight: 1.5,
        }}>
          {t('agency.removeWarning', 'Removing this driver will unlink them from your agency and cancel any pending bookings assigned to them.')}
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={onCancel} disabled={removing}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={removing}>
            {t('agency.confirmRemove', 'Confirm Remove')}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

function DriverManagementPage() {
  const { t } = useTranslation();
  const [drivers, setDrivers] = useState([]);
  const [agencyName, setAgencyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setLoading(true);
    api.get('/agency/drivers', { params: { page, limit: 10, search: debouncedSearch } })
      .then(res => {
        setDrivers(res.data.data || []);
        setAgencyName(res.data.agencyName || 'Your Agency');
        setTotalPages(res.data.totalPages || 0);
        setTotalItems(res.data.totalItems || 0);
      })
      .catch(() => setError(t('agency.failedLoadDrivers', 'Failed to load drivers')))
      .finally(() => setLoading(false));
  }, [page, debouncedSearch, t]);

  const handleConfirmRemove = async () => {
    if (!selectedDriver) return;
    setRemoving(true);
    try {
      await api.delete(`/agency/drivers/${selectedDriver.id}`);
      setDrivers(prev => prev.filter(d => d.id !== selectedDriver.id));
      setTotalItems(prev => Math.max(0, prev - 1));
      setSelectedDriver(null);
    } catch (err) {
      setError(err.response?.data?.message || t('agency.failedRemoveDriver', 'Failed to remove driver'));
      setSelectedDriver(null);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="agency-page">
      <div className="container">

        {/* Agency heading */}
        <ScrollReveal className="animate-fade-up revealed">
          <div className="driver-mgmt-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div className="driver-mgmt-agency-badge">🏢</div>
              <div>
                <h1 className="driver-mgmt-agency-name">{agencyName}</h1>
                <p className="text-muted">
                  {drivers.length === 0 && !search
                    ? t('agency.noDrivers', 'No drivers in your agency')
                    : t('agency.drivers_count', '{{count}} driver(s) in your agency', { count: totalItems })}
                </p>
              </div>
            </div>
            <input
              className="form-input"
              style={{ maxWidth: 260, margin: 0 }}
              placeholder={t('agency.searchDrivers', 'Search drivers by name, vehicle…')}
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </ScrollReveal>

        {/* Error banner */}
        {error && (
          <div className="action-error-banner" role="alert">
            <span>⚠️ {error}</span>
            <button className="action-error-dismiss" onClick={() => setError('')}>✕</button>
          </div>
        )}

        {loading ? (
          <div style={{ marginTop: 24 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                height: 72, background: '#f9fafb', border: '1px solid #e5e7eb',
                borderRadius: 12, marginBottom: 12,
              }} key={i} />
            ))}
          </div>
        ) : drivers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <h3 className="empty-state-title">{t('agency.noDriversYet', 'No Drivers Yet')}</h3>
            <p className="empty-state-text">{search ? t('agency.noDriversMatch', 'No drivers match your search.') : t('agency.driversJoinAppearHere', 'Drivers who join your agency will appear here.')}</p>
          </div>
        ) : (
          <>
            <div className="driver-numbered-list">
              {drivers.map((d, i) => {
                const initials = d.name
                  ? d.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                  : 'D';
                const available = d.available === true || d.available === 1;

                return (
                  <div key={d.id} className="driver-numbered-row">
                    <div className="driver-row-number">{(page - 1) * 10 + i + 1}</div>
                    <div className="driver-row-avatar">{initials}</div>
                    <div className="driver-row-info">
                      <div className="driver-row-name">{d.name || '—'}</div>
                      <div className="driver-row-meta">
                        {d.vehicleType && <span>🚗 {d.vehicleType}</span>}
                        {d.vehicleReg && <span>🔖 {d.vehicleReg}</span>}
                        {d.phone && <span>📞 {d.phone}</span>}
                      </div>
                    </div>
                    <div className={`driver-row-status ${available ? 'available' : 'unavailable'}`}>
                      {available ? t('agency.dotAvailable', '● Available') : t('agency.dotUnavailable', '● Unavailable')}
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setSelectedDriver(d)}
                    >
                      {t('common.delete', 'Remove')}
                    </Button>
                  </div>
                );
              })}
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Modal — portal to document.body */}
      <RemoveConfirmModal
        driver={selectedDriver}
        onConfirm={handleConfirmRemove}
        onCancel={() => { if (!removing) setSelectedDriver(null); }}
        removing={removing}
      />
    </div>
  );
}

export default DriverManagementPage;
