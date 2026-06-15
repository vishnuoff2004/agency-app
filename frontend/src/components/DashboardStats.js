import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SkeletonStats } from './common/SkeletonLoader';

const icons = {
  totalUsers: '👥',
  totalAgencies: '🏢',
  totalActiveBookings: '📋',
  pendingRequests: '⏳',
  activeTrips: '🚗',
  totalDrivers: '👤',
  totalBookings: '📊',
  revenue: '💰',
  completedTrips: '✅',
};

export default function DashboardStats({ fetchStats, interval = 30000 }) {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let timer;

    const load = async () => {
      try {
        const data = await fetchStats();
        if (mounted) setStats(data);
      } catch (err) {
        console.error('Dashboard stats error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    timer = setInterval(load, interval);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [fetchStats, interval]);

  if (loading) {
    return <SkeletonStats count={4} />;
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="stats-grid" role="region" aria-label="Dashboard statistics" aria-live="polite">
      {Object.entries(stats).filter(([, v]) => typeof v !== 'object').map(([key, value]) => {
        const defaultLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
        const label = t('stats.' + key, defaultLabel);
        const icon = icons[key] || '📊';
        return (
          <div key={key} className="stat-card">
            <div className="stat-card-icon">{icon}</div>
            <div className="stat-card-label">{label}</div>
            <div className="stat-card-value">{value ?? 0}</div>
          </div>
        );
      })}
    </div>
  );
}
