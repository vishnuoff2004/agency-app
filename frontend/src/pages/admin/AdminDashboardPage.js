import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import DashboardStats from '../../components/DashboardStats';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ScrollReveal } from '../../hooks/useScrollAnimation';

function AdminDashboardPage() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/admin')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text={t('common.loadingDashboard', 'Loading dashboard...')} />;

  return (
    <div className="admin-page">
      <div className="container">
        <ScrollReveal className="animate-fade-up">
          <div className="admin-header">
            <div>
              <h1 className="admin-title">{t('admin.dashboard', 'Admin Dashboard')}</h1>
              <p className="text-muted">{t('admin.platformOverview', 'Overview of your platform')}</p>
            </div>
          </div>
        </ScrollReveal>

        <DashboardStats fetchStats={() => api.get('/dashboard/admin').then(r => r.data)} />

        {data?.bookingsByStatus && (
          <ScrollReveal className="animate-fade-up">
            <div className="dashboard-widget">
              <div className="dashboard-widget-header">
                <h3 className="dashboard-widget-title">{t('admin.bookingStatusBreakdown', 'Booking Status Breakdown')}</h3>
              </div>
              <div className="dashboard-widget-body">
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
                  {Object.entries(data.bookingsByStatus).map(([k, v]) => (
                    <div key={k} className="stat-card">
                      <div className="stat-card-label">{k}</div>
                      <div className="stat-card-value">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
        )}
      </div>
    </div>
  );
}

export default AdminDashboardPage;
