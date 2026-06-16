import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/bookingService';
import { useSocketContext } from '../../contexts/SocketContext';
import Button from '../../components/Button';
import SkeletonLoader from '../../components/SkeletonLoader';

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const { socket } = useSocketContext();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNotificationsList = useCallback(async (p: number, showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    try {
      const res = await getNotifications(p, 15);
      setNotifications((prev) => {
        if (p === 1) return res.notifications || [];
        return [...prev, ...(res.notifications || [])];
      });
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotificationsList(1);
    setPage(1);
  }, [fetchNotificationsList]);

  // Real-time socket updates for notifications
  useEffect(() => {
    if (socket) {
      const handleRealtimeNotify = () => {
        fetchNotificationsList(1, false);
        setPage(1);
      };

      socket.on('notification:received', handleRealtimeNotify);
      socket.on('booking:status-changed', handleRealtimeNotify);

      return () => {
        socket.off('notification:received', handleRealtimeNotify);
        socket.off('booking:status-changed', handleRealtimeNotify);
      };
    }
  }, [socket, fetchNotificationsList]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotificationsList(1, false);
    setPage(1);
  };

  const handleLoadMore = () => {
    if (page < totalPages && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotificationsList(nextPage, false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.warn('Failed to mark all as read', err);
    }
  };

  const handleMarkRead = async (id: number | string) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.warn('Failed to mark notification read', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const renderNotificationItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity
        onPress={() => !item.isRead && handleMarkRead(item.id)}
        activeOpacity={0.8}
        style={[
          styles.notificationCard,
          item.isRead ? styles.cardRead : styles.cardUnread,
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>{item.isRead ? '📩' : '📬'}</Text>
          <Text style={[styles.cardTitle, !item.isRead && styles.cardTitleBold]}>
            {String(t(item.title, item.title))}
          </Text>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>

        <Text style={[styles.cardBody, !item.isRead && styles.cardBodyBold]}>
          {String(t(item.body, item.body))}
        </Text>
        
        <Text style={styles.cardTime}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Notifications Header Area */}
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.headerTitle}>{t('notification.title', 'Notifications')}</Text>
          {unreadCount > 0 && (
            <Text style={styles.unreadCountText}>{unreadCount} unread</Text>
          )}
        </View>
        {notifications.length > 0 && (
          <Button onPress={handleMarkAllRead} variant="outline" size="sm">
            {t('notification.markAllRead', 'Mark All Read')}
          </Button>
        )}
      </View>

      {/* Main List */}
      <View style={styles.listContainer}>
        {loading && page === 1 ? (
          <View style={{ padding: 16 }}>
            <SkeletonLoader type="list" count={6} />
          </View>
        ) : notifications.length === 0 ? (
          <ScrollView
            contentContainerStyle={styles.emptyContainer}
            refreshControl={
              <FlatList
                data={[]}
                renderItem={() => null}
                refreshing={refreshing}
                onRefresh={handleRefresh}
              /> as any
            }
          >
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>
              {t('notification.noNotifications', 'No notifications.')}
            </Text>
            <Text style={styles.emptySubtitle}>You're all caught up!</Text>
          </ScrollView>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF5DD',
  },
  headerBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(13, 83, 14, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D530E',
  },
  unreadCountText: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(13, 83, 14, 0.05)',
  },
  cardRead: {
    opacity: 0.8,
  },
  cardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#306D29',
    shadowColor: '#306D29',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  cardIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 14,
    color: '#4a5568',
    fontWeight: '500',
    flex: 1,
  },
  cardTitleBold: {
    color: '#1a1a2e',
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#c53030',
    marginLeft: 8,
  },
  cardBody: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginBottom: 8,
    paddingLeft: 26,
  },
  cardBodyBold: {
    color: '#1a1a2e',
    fontWeight: '600',
  },
  cardTime: {
    fontSize: 10,
    color: '#a0aec0',
    paddingLeft: 26,
  },
  emptyContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    paddingTop: 120,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D530E',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
});
