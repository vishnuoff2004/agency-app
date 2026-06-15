import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ScrollReveal } from '../../hooks/useScrollAnimation';
import { SkeletonList } from '../../components/common/SkeletonLoader';

function NotificationCenterPage() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNotifications = useCallback(async (p) => {
    setLoading(true);
    try {
      const res = await api.get(`/notifications?page=${p}&pageSize=10`);
      setNotifications(res.data.notifications || []);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(page);
  }, [page, fetchNotifications]);

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading && page === 1) {
    return (
      <div className="notification-center">
        <div className="container">
          <h1 className="admin-title mb-lg">{t('notification.title')}</h1>
          <SkeletonList rows={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="notification-center">
      <div className="container">
        <ScrollReveal className="animate-fade-up">
          <div className="notification-center-header">
            <div>
              <h1 className="admin-title">{t('notification.title')}</h1>
              {unreadCount > 0 && (
                <p className="text-muted">{unreadCount} unread</p>
              )}
            </div>
            {notifications.length > 0 && (
              <Button variant="outline" size="sm" onClick={markAllRead}>
                {t('notification.markAllRead')}
              </Button>
            )}
          </div>
        </ScrollReveal>

        {!loading && notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔔</div>
            <h3 className="empty-state-title">{t('notification.noNotifications')}</h3>
            <p className="empty-state-text">You're all caught up!</p>
          </div>
        ) : (
          <div className="notification-list">
            {notifications.map(n => (
              <ScrollReveal key={n.id} className="animate-fade-up">
                <div
                  className={`notification-item ${n.isRead ? '' : 'notification-unread'}`}
                  onClick={() => !n.isRead && markRead(n.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !n.isRead) markRead(n.id); }}
                >
                  <div className="notification-item-icon">
                    {n.isRead ? '📩' : '📬'}
                  </div>
                  <div className="notification-item-content">
                    <div className="notification-item-title">{t(n.title)}</div>
                    <div className="notification-item-body">{t(n.body)}</div>
                    <div className="notification-item-time">{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                  {!n.isRead && <div className="notification-unread-dot" />}
                </div>
              </ScrollReveal>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <nav className="pagination" aria-label="Notification pagination">
            <button
              className="pagination-btn"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              ‹
            </button>
            <span className="pagination-info">{t('common.page')} {page} {t('common.of')} {totalPages}</span>
            <button
              className="pagination-btn"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              ›
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}

export default NotificationCenterPage;
