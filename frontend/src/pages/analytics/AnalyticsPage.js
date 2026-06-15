import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getBookingsByDate } from '../../services/analyticsService';
import Button from '../../components/common/Button';
import { ScrollReveal } from '../../hooks/useScrollAnimation';
import { SkeletonTable } from '../../components/common/SkeletonLoader';

function AnalyticsPage() {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  const fetchAnalytics = useCallback(async (s, e) => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (s) params.startDate = s;
      if (e) params.endDate = e;
      const result = await getBookingsByDate(params);
      setData(result || []);
    } catch (err) {
      setError(t('analytics.failedLoad', 'Failed to load analytics'));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchAnalytics(startDate, endDate);
  }, [fetchAnalytics, startDate, endDate]);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchAnalytics(startDate, endDate);
  };

  const totalBookings = data.reduce((sum, row) => sum + (row.count || 0), 0);

  return (
    <div className="analytics-page">
      <div className="container">
        <ScrollReveal className="animate-fade-up">
          <div className="admin-header">
            <div>
              <h1 className="admin-title">{t('analytics.title', 'Bookings Analytics')}</h1>
              <p className="text-muted">{t('analytics.subtitle', 'Track booking trends over time')}</p>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal className="animate-fade-up">
          <div className="card mb-xl">
            <form onSubmit={handleFilter}>
              <div className="analytics-filters">
                <div className="form-group">
                  <label className="form-label">{t('analytics.startDate', 'Start Date')}</label>
                  <input
                    className="form-input"
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('analytics.endDate', 'End Date')}</label>
                  <input
                    className="form-input"
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                  />
                </div>
                <Button type="submit">{t('analytics.filter', 'Apply Filter')}</Button>
              </div>
            </form>
          </div>
        </ScrollReveal>

        {loading && <SkeletonTable rows={5} />}

        {error && (
          <div className="error-state">
            <div className="error-state-icon">✕</div>
            <h3>{t('analytics.errorLoadingData', 'Error Loading Data')}</h3>
            <p className="text-muted mt-sm">{error}</p>
          </div>
        )}

        {!loading && !error && data.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <h3 className="empty-state-title">{t('analytics.noDataAvailable', 'No Data Available')}</h3>
            <p className="text-muted mt-sm">{t('analytics.noData', 'No booking data found for the selected period.')}</p>
          </div>
        )}

        {!loading && data.length > 0 && (
          <ScrollReveal className="animate-fade-up">
            <div className="stats-grid mb-lg">
              <div className="stat-card">
                <div className="stat-card-label">{t('analytics.bookings', 'Total Bookings')}</div>
                <div className="stat-card-value">{totalBookings}</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-label">{t('analytics.dateRange', 'Date Range')}</div>
                <div className="stat-card-value">{t('analytics.daysCount', '{{count}} days', { count: data.length })}</div>
              </div>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('analytics.date', 'Date')}</th>
                    <th>{t('analytics.bookings', 'Bookings')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(row => (
                    <tr key={row.date}>
                      <td>{row.date}</td>
                      <td><span className="font-bold">{row.count}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollReveal>
        )}
      </div>
    </div>
  );
}

export default AnalyticsPage;
