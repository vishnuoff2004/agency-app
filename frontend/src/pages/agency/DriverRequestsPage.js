import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Button from '../../components/common/Button';

function DriverRequestsPage() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('Pending');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchRequests = async () => {
    try {
      const res = await api.get('/agency/requests');
      setRequests(res.data);
    } catch {
      setError(t('driver.failedToLoadDriverRequests', 'Failed to load driver requests'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleRespond = async (requestId, action, driverName) => {
    setActionId(`${requestId}-${action}`);
    setError(''); setSuccess('');
    try {
      const res = await api.put(`/agency/requests/${requestId}`, { action });
      setSuccess(res.data.message || (action === 'accept' ? `${driverName} added to agency` : 'Request denied'));
      await fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    } finally {
      setActionId(null);
    }
  };

  const available = (v) => v === true || v === 1;

  if (loading) {
    return (
      <div className="agency-page">
        <div className="container">
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 90, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, marginBottom: 12 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="agency-page">
      <div className="container">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg,#7c3aed,#a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem',
            boxShadow: '0 4px 12px rgba(124,58,237,0.2)',
          }}>📨</div>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: '1.8rem', fontWeight: 800 }}>{t('agency.driverRequests', 'Driver Requests')}</h1>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
              {t('agency.requestsSubtitle', 'Manage join requests from drivers')}
            </p>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, borderBottom: '1px solid #e5e7eb', paddingBottom: 10 }}>
          {['Pending', 'Accepted', 'Denied'].map(tab => {
            const count = requests.filter(r => r.status === tab).length;
            const label = tab === 'Pending' ? t('agency.pendingTab', 'Pending') : tab === 'Accepted' ? t('agency.approvedTab', 'Approved') : t('agency.rejectedTab', 'Rejected');
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontWeight: activeTab === tab ? 700 : 500,
                  color: activeTab === tab ? '#7c3aed' : '#6b7280',
                  borderBottom: activeTab === tab ? '2.5px solid #7c3aed' : 'none',
                  fontSize: '0.9rem',
                }}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8, padding: '12px 16px', marginBottom: 16,
            color: '#dc2626', fontSize: '0.87rem', display: 'flex', justifyContent: 'space-between',
          }}>
            <span>⚠️ {error}</span>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}>✕</button>
          </div>
        )}
        {success && (
          <div style={{
            background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 8, padding: '12px 16px', marginBottom: 16,
            color: '#16a34a', fontSize: '0.87rem',
          }}>
            ✅ {success}
          </div>
        )}

        {/* Empty state */}
        {requests.filter(r => r.status === activeTab).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>📭</div>
            <h3 style={{ margin: '0 0 8px', fontWeight: 700 }}>
              {activeTab === 'Pending' ? t('agency.noPendingRequests', 'No Pending Requests') : activeTab === 'Accepted' ? t('agency.noApprovedRequests', 'No Approved Drivers') : t('agency.noRejectedRequests', 'No Rejected Requests')}
            </h3>
            <p style={{ color: '#6b7280', margin: 0 }}>{t('agency.driverRequestsAppearHere', 'No driver requests are currently in this list.')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {requests.filter(r => r.status === activeTab).map(r => {
              const initials = r.driverName
                ? r.driverName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                : 'D';
              const isAvail = available(r.available);

              return (
                <div key={r.id} style={{
                  background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14,
                  padding: '20px 22px', display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap',
                  transition: 'box-shadow 0.2s',
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg,#7c3aed,#a78bfa)',
                    color: '#fff', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontWeight: 800, fontSize: '1rem',
                  }}>
                    {initials}
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 8 }}>
                      {r.driverName || '—'}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px', fontSize: '0.82rem' }}>
                      {[
                        ['📞', r.driverPhone || 'N/A'],
                        ['🚗', r.vehicleType || 'N/A'],
                        ['🔖', r.vehicleReg || 'N/A'],
                        ['📋', r.licenseNo || 'N/A'],
                      ].map(([icon, val]) => (
                        <div key={icon} style={{ color: '#6b7280' }}>
                          {icon} <span style={{ color: '#111827', fontWeight: 500 }}>{val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Document Preview Section */}
                    {(r.licenseDocUrl || r.vehicleRcUrl) && (
                      <div style={{ marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {r.licenseDocUrl && (
                          <a
                            href={r.licenseDocUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: '0.8rem',
                              color: '#7c3aed',
                              textDecoration: 'none',
                              fontWeight: 600,
                              background: 'rgba(124,58,237,0.08)',
                              padding: '6px 12px',
                              borderRadius: 6,
                              border: '1px solid rgba(124,58,237,0.2)',
                            }}
                          >
                            📄 {t('agency.viewLicense', 'View License')}
                          </a>
                        )}
                        {r.vehicleRcUrl && (
                          <a
                            href={r.vehicleRcUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: '0.8rem',
                              color: '#7c3aed',
                              textDecoration: 'none',
                              fontWeight: 600,
                              background: 'rgba(124,58,237,0.08)',
                              padding: '6px 12px',
                              borderRadius: 6,
                              border: '1px solid rgba(124,58,237,0.2)',
                            }}
                          >
                            📄 {t('agency.viewRc', 'View Vehicle RC')}
                          </a>
                        )}
                      </div>
                    )}

                    <div style={{ marginTop: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px',
                        borderRadius: 999, border: '1px solid',
                        background: isAvail ? 'rgba(34,197,94,0.1)' : 'rgba(107,114,128,0.08)',
                        color: isAvail ? '#16a34a' : '#6b7280',
                        borderColor: isAvail ? 'rgba(34,197,94,0.3)' : '#e5e7eb',
                      }}>
                        {isAvail ? t('agency.dotAvailable', '● Available') : t('agency.dotUnavailable', '● Unavailable')}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                        {t('agency.requestedAt', 'Requested {{date}}', { date: new Date(r.requestedAt).toLocaleDateString() })}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  {r.status === 'Pending' && (
                    <div style={{ display: 'flex', gap: 10, flexShrink: 0, alignSelf: 'center' }}>
                      <Button
                        variant="success"
                        size="sm"
                        loading={actionId === `${r.id}-accept`}
                        disabled={actionId !== null}
                        onClick={() => handleRespond(r.id, 'accept', r.driverName)}
                      >
                        {t('common.approve', '✓ Approve')}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        loading={actionId === `${r.id}-deny`}
                        disabled={actionId !== null}
                        onClick={() => handleRespond(r.id, 'deny', r.driverName)}
                      >
                        {t('common.reject', '✕ Reject')}
                      </Button>
                    </div>
                  )}

                  {r.status !== 'Pending' && (
                    <div style={{ alignSelf: 'center', flexShrink: 0 }}>
                      <span style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        padding: '6px 12px',
                        borderRadius: 8,
                        background: r.status === 'Accepted' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        color: r.status === 'Accepted' ? '#16a34a' : '#dc2626',
                        display: 'inline-block'
                      }}>
                        {r.status === 'Accepted' ? t('agency.approvedLabel', 'Approved') : t('agency.rejectedLabel', 'Rejected')}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default DriverRequestsPage;
