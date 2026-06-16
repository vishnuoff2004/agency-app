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
import { router } from 'expo-router';
import { getBookings } from '../../../services/bookingService';
import { useSocketContext } from '../../../contexts/SocketContext';
import FormInput from '../../../components/FormInput';
import BookingStatusBadge from '../../../components/BookingStatusBadge';
import SkeletonLoader from '../../../components/SkeletonLoader';
import Button from '../../../components/Button';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export default function BookingsListScreen() {
  const { t } = useTranslation();
  const { socket } = useSocketContext();

  const [bookings, setBookings] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const fetchBookingsList = useCallback(
    async (p: number, showSkeleton = true) => {
      if (showSkeleton) setLoading(true);
      setError('');
      try {
        const data = await getBookings(p, 10, debouncedSearch);
        setBookings(data.data || []);
        setTotalPages(data.totalPages || 0);
      } catch (err) {
        setError(t('booking.failedToLoad', 'Failed to load bookings'));
        setBookings([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [debouncedSearch, t]
  );

  useEffect(() => {
    fetchBookingsList(page);
  }, [page, debouncedSearch, fetchBookingsList]);

  // Real-time updates via Socket.IO
  useEffect(() => {
    if (socket) {
      const handleRealtimeUpdate = () => {
        // Refresh current page
        fetchBookingsList(page, false);
      };

      socket.on('booking:created', handleRealtimeUpdate);
      socket.on('booking:status-changed', handleRealtimeUpdate);
      socket.on('booking:cancelled', handleRealtimeUpdate);

      return () => {
        socket.off('booking:created', handleRealtimeUpdate);
        socket.off('booking:status-changed', handleRealtimeUpdate);
        socket.off('booking:cancelled', handleRealtimeUpdate);
      };
    }
  }, [socket, page, fetchBookingsList]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookingsList(1, false);
    setPage(1);
  };

  const handlePageChange = (p: number) => {
    if (p >= 1 && p <= totalPages) {
      setPage(p);
    }
  };

  // Generate pagination buttons array (max 5 visible, supporting ellipses)
  const renderPaginationControls = () => {
    if (totalPages <= 1) return null;

    const pageButtons: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pageButtons.push(i);
      }
    } else {
      pageButtons.push(1);
      if (page > 3) {
        pageButtons.push('...');
      }

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        if (!pageButtons.includes(i)) {
          pageButtons.push(i);
        }
      }

      if (page < totalPages - 2) {
        pageButtons.push('...');
      }
      if (!pageButtons.includes(totalPages)) {
        pageButtons.push(totalPages);
      }
    }

    return (
      <View style={styles.paginationRow}>
        <TouchableOpacity
          onPress={() => handlePageChange(page - 1)}
          disabled={page <= 1}
          style={[styles.pageNavBtn, page <= 1 && styles.pageNavBtnDisabled]}
        >
          <Text style={styles.pageNavBtnText}>‹</Text>
        </TouchableOpacity>

        {pageButtons.map((btn, idx) => {
          if (btn === '...') {
            return (
              <Text key={`ellipsis-${idx}`} style={styles.paginationEllipsis}>
                ...
              </Text>
            );
          }
          const isSelected = btn === page;
          return (
            <TouchableOpacity
              key={`page-${btn}`}
              onPress={() => handlePageChange(btn as number)}
              style={[styles.pageBtn, isSelected && styles.pageBtnSelected]}
            >
              <Text style={[styles.pageBtnText, isSelected && styles.pageBtnTextSelected]}>
                {btn}
              </Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          onPress={() => handlePageChange(page + 1)}
          disabled={page >= totalPages}
          style={[styles.pageNavBtn, page >= totalPages && styles.pageNavBtnDisabled]}
        >
          <Text style={styles.pageNavBtnText}>›</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderBookingItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity
        onPress={() => {
          router.push({
            pathname: '/(tabs)/bookings/[id]',
            params: { id: item.id.toString() },
          });
        }}
        activeOpacity={0.8}
        style={styles.bookingCard}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardRouteContainer}>
            <Text style={styles.routeText}>
              📍{' '}
              {item.routeSource && item.routeDestination
                ? `${item.routeSource} → ${item.routeDestination}`
                : t('booking.route', 'Route')}
            </Text>
          </View>
          <BookingStatusBadge status={item.status} />
        </View>

        <View style={styles.cardInfoGrid}>
          {item.travelDate && <Text style={styles.infoChip}>📅 {item.travelDate}</Text>}
          {item.driverName && <Text style={styles.infoChip}>👤 {item.driverName}</Text>}
          {item.vehicleType && (
            <Text style={styles.infoChip}>
              🚗 {item.vehicleType}
              {item.vehicleReg ? ` (${item.vehicleReg})` : ''}
            </Text>
          )}
          <Text style={styles.infoChip}>🪑 {item.seatCount} seat{item.seatCount > 1 ? 's' : ''}</Text>
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.bookingIdText}>
              #{item.id}
            </Text>
            {item.routeDeparture && (
              <Text style={styles.timeText}>
                🕒 {new Date(item.routeDeparture).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
              </Text>
            )}
          </View>
          
          <View style={styles.fareContainer}>
            <Text style={styles.fareAmount}>₹{item.totalAmount}</Text>
            <Text style={styles.fareLabel}>{item.seatCount} seat{item.seatCount > 1 ? 's' : ''}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.headerBar}>
        <FormInput
          label=""
          placeholder={t('booking.searchPlaceholder', 'Search bookings…')}
          value={search}
          onChangeText={(val) => {
            setSearch(val);
            setPage(1);
          }}
          style={styles.searchInput}
        />
      </View>

      {/* Booking List Area */}
      <View style={styles.listContainer}>
        {loading ? (
          <View style={{ padding: 16 }}>
            <SkeletonLoader type="list" count={5} />
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorIcon}>✕</Text>
            <Text style={styles.errorTitle}>{t('booking.errorLoading', 'Error Loading Bookings')}</Text>
            <Text style={styles.errorSubtitle}>{error}</Text>
            <Button onPress={() => fetchBookingsList(page)} style={styles.retryBtn}>
              Retry
            </Button>
          </View>
        ) : bookings.length === 0 ? (
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
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>{t('booking.noBookings', 'No Bookings Yet')}</Text>
            <Text style={styles.emptySubtitle}>
              Search for routes and book your first trip.
            </Text>
            <Button onPress={() => router.push('/(tabs)/search')} style={styles.emptyBtn}>
              {t('search.title', 'Search Routes')}
            </Button>
          </ScrollView>
        ) : (
          <FlatList
            data={bookings}
            renderItem={renderBookingItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListFooterComponent={renderPaginationControls}
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
  },
  searchInput: {
    marginBottom: 0,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(13, 83, 14, 0.05)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardRouteContainer: {
    flex: 1,
    paddingRight: 8,
  },
  routeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D530E',
  },
  cardInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  infoChip: {
    fontSize: 11,
    color: '#4a5568',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(13, 83, 14, 0.05)',
    paddingTop: 12,
  },
  bookingIdText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#306D29',
  },
  timeText: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  fareContainer: {
    alignItems: 'flex-end',
  },
  fareAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D530E',
  },
  fareLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorIcon: {
    fontSize: 48,
    color: '#c53030',
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#c53030',
    marginBottom: 4,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    paddingHorizontal: 24,
  },
  emptyContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    paddingTop: 100,
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
    marginBottom: 20,
  },
  emptyBtn: {
    paddingHorizontal: 24,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  pageBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(13, 83, 14, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageBtnSelected: {
    backgroundColor: '#306D29',
    borderColor: '#306D29',
  },
  pageBtnText: {
    fontSize: 12,
    color: '#4a5568',
    fontWeight: '600',
  },
  pageBtnTextSelected: {
    color: '#FFFFFF',
  },
  pageNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(13, 83, 14, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNavBtnDisabled: {
    opacity: 0.4,
  },
  pageNavBtnText: {
    fontSize: 16,
    color: '#306D29',
    fontWeight: '700',
  },
  paginationEllipsis: {
    fontSize: 14,
    color: '#6b7280',
    marginHorizontal: 4,
  },
});
