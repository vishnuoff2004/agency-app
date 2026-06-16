import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { searchRoutes } from '../../services/bookingService';
import FormInput from '../../components/FormInput';
import Button from '../../components/Button';
import PriceRangeSlider from '../../components/PriceRangeSlider';
import SkeletonLoader from '../../components/SkeletonLoader';

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

export default function SearchScreen() {
  const { t } = useTranslation();

  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [seats, setSeats] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);

  // Draft filters for the popup modal
  const [draftSeats, setDraftSeats] = useState('');
  const [draftPriceRange, setDraftPriceRange] = useState<[number, number]>([0, 10000]);

  const [showFilters, setShowFilters] = useState(false);
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [facetCounts, setFacetCounts] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debouncedSource = useDebounce(source, 300);
  const debouncedDestination = useDebounce(destination, 300);
  const debouncedSeats = useDebounce(seats, 300);
  const debouncedPriceRange = useDebounce(priceRange, 300);

  const toggleVehicleType = (type: string) => {
    setVehicleTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  useEffect(() => {
    if (!debouncedSource && !debouncedDestination) {
      setResults([]);
      setFacetCounts(null);
      setHasSearched(false);
      return;
    }

    setHasSearched(true);
    let isCancelled = false;

    async function fetchSearch() {
      setLoading(true);
      try {
        const params: any = {
          source: debouncedSource,
          destination: debouncedDestination,
        };

        if (debouncedSeats) params.seats = debouncedSeats;
        if (debouncedPriceRange[0] > 0) params.priceMin = debouncedPriceRange[0];
        if (debouncedPriceRange[1] < 10000) params.priceMax = debouncedPriceRange[1];
        if (vehicleTypes.length > 0) params.vehicleTypes = vehicleTypes.join(',');

        const res = await searchRoutes(params);
        if (!isCancelled) {
          setResults(res.data || []);
          setFacetCounts(res.facetCounts || null);
        }
      } catch (err) {
        if (!isCancelled) {
          setResults([]);
          setFacetCounts(null);
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    fetchSearch();

    return () => {
      isCancelled = true;
    };
  }, [debouncedSource, debouncedDestination, debouncedSeats, debouncedPriceRange, vehicleTypes]);

  const handleApplyFilters = () => {
    setSeats(draftSeats);
    setPriceRange(draftPriceRange);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setDraftSeats('');
    setDraftPriceRange([0, 10000]);
    setSeats('');
    setPriceRange([0, 10000]);
    setShowFilters(false);
  };

  const renderResultCard = ({ item }: { item: any }) => {
    const depDate = item.departureTime ? new Date(item.departureTime).toISOString().split('T')[0] : '';
    const isBooked = item.exclusivelyBooked;
    const isMyBooking = item.bookedByMe;

    const navigateToBooking = () => {
      router.push({
        pathname: '/booking/new',
        params: {
          routeId: item.id.toString(),
          driverId: item.driverId.toString(),
          date: depDate,
        },
      });
    };

    return (
      <View style={[styles.card, isBooked && styles.cardBooked]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            📍 {item.source} → {item.destination}
          </Text>
          {isBooked && (
            <View style={styles.exclusiveBadge}>
              <Text style={styles.exclusiveBadgeText}>🔒 {t('search.exclusivelyBooked', 'Booked')}</Text>
            </View>
          )}
          {isMyBooking && !isBooked && (
            <View style={styles.myBookingBadge}>
              <Text style={styles.myBookingBadgeText}>✓ {t('search.yourBooking', 'Your Booking')}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardDetails}>
          <Text style={styles.detailText}>🚗 {item.vehicleType}</Text>
          <Text style={styles.detailText}>👤 {item.driverName}</Text>
          <Text style={styles.detailText}>🏢 {item.agencyName}</Text>
          <Text style={styles.detailText}>
            📅 {new Date(item.departureTime).toLocaleDateString()}
          </Text>
          <Text style={styles.detailText}>
            🕒 {new Date(item.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {isBooked && (
          <Text style={styles.bookedMessage}>
            {t('search.bookedByOther', 'This vehicle is reserved by another traveler.')}
          </Text>
        )}

        <View style={styles.cardActions}>
          <View>
            <Text style={styles.fareAmount}>₹{item.fare}</Text>
            <Text style={styles.fareLabel}>
              {isBooked ? t('search.unavailable', 'Unavailable') : t('search.perSeat', 'per seat')}
            </Text>
          </View>

          {isBooked ? (
            <Button onPress={() => {}} disabled style={styles.actionBtn} variant="outline">
              🔒 {t('search.alreadyBooked', 'Already Booked')}
            </Button>
          ) : isMyBooking ? (
            <Button onPress={navigateToBooking} style={styles.actionBtn}>
              ➕ {t('search.addSeats', 'Add Seats')}
            </Button>
          ) : (
            <Button onPress={navigateToBooking} style={styles.actionBtn}>
              {t('search.book', 'Book Now')}
            </Button>
          )}
        </View>
      </View>
    );
  };

  const hasActiveFilters = seats || priceRange[0] > 0 || priceRange[1] < 10000;

  return (
    <View style={styles.container}>
      {/* Search Header Fields */}
      <View style={styles.searchBar}>
        <View style={styles.inputRow}>
          <FormInput
            label=""
            placeholder={t('search.from', 'From')}
            value={source}
            onChangeText={setSource}
            style={styles.searchInput}
          />
          <FormInput
            label=""
            placeholder={t('search.to', 'To')}
            value={destination}
            onChangeText={setDestination}
            style={styles.searchInput}
          />
          <TouchableOpacity
            onPress={() => {
              setDraftSeats(seats);
              setDraftPriceRange(priceRange);
              setShowFilters(true);
            }}
            style={[styles.filterBtn, hasActiveFilters && styles.filterBtnActive]}
          >
            <Text style={[styles.filterIcon, hasActiveFilters && styles.filterIconActive]}>
              ⚙️
            </Text>
            {hasActiveFilters && <View style={styles.filterBadge} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Vehicle Type Chips Category Filters */}
      {facetCounts?.vehicleType && Object.keys(facetCounts.vehicleType).length > 0 && (
        <View style={styles.facetsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.facetsScroll}>
            {Object.entries(facetCounts.vehicleType).map(([type, count]) => {
              const isActive = vehicleTypes.includes(type);
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => toggleVehicleType(type)}
                  style={[styles.facetChip, isActive && styles.facetChipActive]}
                >
                  <Text style={[styles.facetChipText, isActive && styles.facetChipTextActive]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                  <View style={[styles.facetCountBadge, isActive && styles.facetCountBadgeActive]}>
                    <Text style={[styles.facetCountText, isActive && styles.facetCountTextActive]}>
                      {String(count)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            {vehicleTypes.length > 0 && (
              <TouchableOpacity onPress={() => setVehicleTypes([])} style={styles.clearFacetsBtn}>
                <Text style={styles.clearFacetsText}>✕ {t('search.clear', 'Clear')}</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}

      {/* Main Content Area */}
      <View style={styles.listContainer}>
        {loading ? (
          <View style={{ padding: 16 }}>
            <SkeletonLoader type="card" count={3} />
          </View>
        ) : results.length > 0 ? (
          <FlatList
            data={results}
            renderItem={renderResultCard}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.resultsList}
          />
        ) : !hasSearched ? (
          <ScrollView contentContainerStyle={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>{t('search.startTyping', 'Start Searching')}</Text>
            <Text style={styles.emptySubtitle}>
              {t('search.hint', 'Enter a source and destination to find available routes.')}
            </Text>
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🚫</Text>
            <Text style={styles.emptyTitle}>{t('search.noResults', 'No Routes Found')}</Text>
            <Text style={styles.emptySubtitle}>
              {t('search.tryDifferent', 'Try a different search or check back later.')}
            </Text>
          </ScrollView>
        )}
      </View>

      <Modal visible={showFilters} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowFilters(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('common.filter', 'Filters')}</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <FormInput
              label={t('search.seats', 'Seats')}
              placeholder={t('search.seatsPlaceholder', 'Min seats')}
              value={draftSeats}
              onChangeText={setDraftSeats}
              keyboardType="numeric"
            />

            <PriceRangeSlider
              min={0}
              max={10000}
              step={100}
              value={draftPriceRange}
              onChange={setDraftPriceRange}
            />

            <View style={styles.modalActions}>
              <Button onPress={handleClearFilters} variant="outline" style={styles.modalActionBtn}>
                {t('common.clear', 'Clear')}
              </Button>
              <Button onPress={handleApplyFilters} style={styles.modalActionBtn}>
                {t('common.filter', 'Apply')}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBF5DD',
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(13, 83, 14, 0.08)',
    padding: 16,
    paddingTop: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
  },
  filterBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: 'rgba(13, 83, 14, 0.12)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBtnActive: {
    backgroundColor: '#306D29',
    borderColor: '#306D29',
  },
  filterIcon: {
    fontSize: 18,
    color: '#4a5568',
  },
  filterIconActive: {
    color: '#FFFFFF',
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#c53030',
  },
  facetsContainer: {
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(13, 83, 14, 0.08)',
  },
  facetsScroll: {
    paddingHorizontal: 16,
  },
  facetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(13, 83, 14, 0.12)',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    height: 32,
    gap: 6,
  },
  facetChipActive: {
    borderColor: '#306D29',
    backgroundColor: 'rgba(48, 109, 41, 0.08)',
  },
  facetChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4a5568',
  },
  facetChipTextActive: {
    color: '#0D530E',
    fontWeight: '700',
  },
  facetCountBadge: {
    backgroundColor: '#FBF5DD',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  facetCountBadgeActive: {
    backgroundColor: 'rgba(48, 109, 41, 0.15)',
  },
  facetCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6b7280',
  },
  facetCountTextActive: {
    color: '#0D530E',
  },
  clearFacetsBtn: {
    height: 32,
    justifyContent: 'center',
    paddingLeft: 4,
    paddingRight: 16,
  },
  clearFacetsText: {
    fontSize: 12,
    color: '#c53030',
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
  },
  resultsList: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: 'rgba(13, 83, 14, 0.05)',
  },
  cardBooked: {
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    opacity: 0.8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D530E',
    flex: 1,
  },
  exclusiveBadge: {
    backgroundColor: '#cbd5e1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  exclusiveBadgeText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '700',
  },
  myBookingBadge: {
    backgroundColor: 'rgba(48, 109, 41, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  myBookingBadgeText: {
    fontSize: 10,
    color: '#306D29',
    fontWeight: '700',
  },
  cardDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  detailText: {
    fontSize: 12,
    color: '#4a5568',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bookedMessage: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(13, 83, 14, 0.05)',
    paddingTop: 12,
  },
  fareAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#306D29',
  },
  fareLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    paddingTop: 80,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D530E',
  },
  modalCloseText: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalActionBtn: {
    flex: 1,
  },
});
