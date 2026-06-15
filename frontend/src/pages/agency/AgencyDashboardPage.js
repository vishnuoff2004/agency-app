import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import DashboardStats from '../../components/DashboardStats';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ScrollReveal } from '../../hooks/useScrollAnimation';

function AgencyDashboardPage() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/agency/drivers', { params: { limit: 100 } }),
      api.get('/agency/bookings'),
    ])
      .then(([drivers, bookings]) => {
        setData({
          driverCount: drivers.data.totalItems || drivers.data.data?.length || 0,
          bookingCount: bookings.data.data?.length || bookings.data.length || 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text={t('common.loadingDashboard', 'Loading dashboard...')} />;

  return (
    <div className="agency-page">
      <div className="container">
        <ScrollReveal className="animate-fade-up">
          <div className="admin-header">
            <div>
              <h1 className="admin-title">{t('agency.dashboard', 'Agency Dashboard')}</h1>
              <p className="text-muted">{t('agency.yourAgencyOverview', 'Your agency overview')}</p>
            </div>
          </div>
        </ScrollReveal>

        <DashboardStats fetchStats={() => Promise.resolve({
          totalDrivers: data?.driverCount || 0,
          totalBookings: data?.bookingCount || 0,
        })} />
      </div>
    </div>
  );
}

export default AgencyDashboardPage;
