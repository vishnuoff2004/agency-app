import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Button from '../../components/common/Button';

function DocumentViewModal({ url, title, onClose }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="doc-viewer-modal" onClick={e => e.stopPropagation()}>
        <div className="doc-viewer-header">
          <h3 className="doc-viewer-title">{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="doc-viewer-body">
          <img src={url} alt={title} className="doc-viewer-image" />
        </div>
      </div>
    </div>
  );
}

function DriverRequestsPage() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('Pending');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [docModal, setDocModal] = useState(null);

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
            <div key={i} className="request-skeleton" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="agency-page">
      <div className="container">

        <div className="request-page-header">
          <div className="request-page-icon">📨</div>
          <div>
            <h1 className="request-page-title">{t('agency.driverRequests', 'Driver Requests')}</h1>
            <p className="text-muted">{t('agency.requestsSubtitle', 'Manage join requests from drivers')}</p>
          </div>
        </div>

        <div className="request-tabs">
          {['Pending', 'Accepted', 'Denied'].map(tab => {
            const count = requests.filter(r => r.status === tab).length;
            const label = tab === 'Pending' ? t('agency.pendingTab', 'Pending') : tab === 'Accepted' ? t('agency.approvedTab', 'Approved') : t('agency.rejectedTab', 'Rejected');
            return (
              <button
                key={tab}
                className={`request-tab-btn${activeTab === tab ? ' active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>

        {error && (
          <div className="action-error-banner" role="alert">
            <span>⚠️ {error}</span>
            <button className="action-error-dismiss" onClick={() => setError('')}>✕</button>
          </div>
        )}
        {success && (
          <div className="request-success-banner">
            ✅ {success}
          </div>
        )}

        {requests.filter(r => r.status === activeTab).length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3 className="empty-state-title">
              {activeTab === 'Pending' ? t('agency.noPendingRequests', 'No Pending Requests') : activeTab === 'Accepted' ? t('agency.noApprovedRequests', 'No Approved Drivers') : t('agency.noRejectedRequests', 'No Rejected Requests')}
            </h3>
            <p className="empty-state-text">{t('agency.driverRequestsAppearHere', 'No driver requests are currently in this list.')}</p>
          </div>
        ) : (
          <div className="request-card-list">
            {requests.filter(r => r.status === activeTab).map(r => {
              const initials = r.driverName
                ? r.driverName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                : 'D';
              const isAvail = available(r.available);

              return (
                <div key={r.id} className="request-card">
                  <div className="request-card-avatar">{initials}</div>
                  <div className="request-card-info">
                    <div className="request-card-name">{r.driverName || '—'}</div>
                    <div className="request-card-details">
                      {[
                        ['📞', r.driverPhone || 'N/A'],
                        ['🚗', r.vehicleType || 'N/A'],
                        ['🔖', r.vehicleReg || 'N/A'],
                        ['📋', r.licenseNo || 'N/A'],
                      ].map(([icon, val]) => (
                        <div key={icon} className="request-card-detail">
                          {icon} <span>{val}</span>
                        </div>
                      ))}
                    </div>

                    {(r.licenseDocUrl || r.vehicleRcUrl) && (
                      <div className="request-card-docs">
                        {r.licenseDocUrl && (
                          <button className="doc-view-btn" onClick={() => setDocModal({ url: r.licenseDocUrl, title: t('agency.driverLicense', 'Driver License') })}>
                            📄 {t('agency.viewLicense', 'View License')}
                          </button>
                        )}
                        {r.vehicleRcUrl && (
                          <button className="doc-view-btn" onClick={() => setDocModal({ url: r.vehicleRcUrl, title: t('agency.vehicleRc', 'Vehicle RC') })}>
                            📄 {t('agency.viewRc', 'View Vehicle RC')}
                          </button>
                        )}
                      </div>
                    )}

                    <div className="request-card-status-row">
                      <span className={`request-card-status-badge ${isAvail ? 'available' : 'unavailable'}`}>
                        {isAvail ? t('agency.dotAvailable', '● Available') : t('agency.dotUnavailable', '● Unavailable')}
                      </span>
                      <span className="request-card-date">
                        {t('agency.requestedAt', 'Requested {{date}}', { date: new Date(r.requestedAt).toLocaleDateString() })}
                      </span>
                    </div>
                  </div>

                  {r.status === 'Pending' && (
                    <div className="request-card-actions">
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
                    <div className="request-card-status-label">
                      <span className={`request-badge ${r.status === 'Accepted' ? 'approved' : 'rejected'}`}>
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

      {docModal && (
        <DocumentViewModal
          url={docModal.url}
          title={docModal.title}
          onClose={() => setDocModal(null)}
        />
      )}
    </div>
  );
}

export default DriverRequestsPage;
