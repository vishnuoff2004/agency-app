import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Button from '../../components/common/Button';
import { ScrollReveal } from '../../hooks/useScrollAnimation';
import { SkeletonCard } from '../../components/common/SkeletonLoader';

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

function SearchPage() {
  const { t } = useTranslation();
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [seats, setSeats] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [facetCounts, setFacetCounts] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debouncedSource = useDebounce(source, 300);
  const debouncedDestination = useDebounce(destination, 300);
  const debouncedSeats = useDebounce(seats, 300);
  const debouncedPriceMin = useDebounce(priceMin, 300);
  const debouncedPriceMax = useDebounce(priceMax, 300);
  const navigate = useNavigate();
  const hasFetched = useRef(false);

  const toggleVehicleType = (type) => {
    setVehicleTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  useEffect(() => {
    if (!debouncedSource && !debouncedDestination) {
      setResults([]);
      setFacetCounts(null);
      return;
    }
    hasFetched.current = true;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const params = {
          source: debouncedSource,
          destination: debouncedDestination,
        };
        if (debouncedSeats) params.seats = debouncedSeats;
        if (debouncedPriceMin) params.priceMin = debouncedPriceMin;
        if (debouncedPriceMax) params.priceMax = debouncedPriceMax;
        if (vehicleTypes.length > 0) params.vehicleTypes = vehicleTypes.join(',');
        const res = await api.get('/routes/search', { params });
        if (!cancelled) {
          setResults(res.data.data || []);
          setFacetCounts(res.data.facetCounts || null);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
          setFacetCounts(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [debouncedSource, debouncedDestination, debouncedSeats, debouncedPriceMin, debouncedPriceMax, vehicleTypes]);

  return (
    <div className="search-page">
      <div className="container">
        <ScrollReveal className="animate-fade-up">
          <div className="search-header">
            <h1 className="search-title">{t('search.title') || 'Find Your Route'}</h1>
            <p className="search-description">{t('search.description') || 'Search for available routes between cities'}</p>
          </div>
        </ScrollReveal>

        <ScrollReveal className="animate-fade-up">
          <div className="search-bar">
            <input
              className="form-input"
              placeholder={t('search.from') || 'From'}
              value={source}
              onChange={e => setSource(e.target.value)}
              aria-label={t('search.from') || 'Source'}
            />
            <input
              className="form-input"
              placeholder={t('search.to') || 'To'}
              value={destination}
              onChange={e => setDestination(e.target.value)}
              aria-label={t('search.to') || 'Destination'}
            />
          </div>
        </ScrollReveal>

        <ScrollReveal className="animate-fade-up">
          <div className="search-filters">
            <div className="search-filter-group">
              <label className="search-filter-label">{t('search.seats') || 'Seats'}</label>
              <input
                className="form-input"
                type="number"
                min="1"
                placeholder={t('search.seatsPlaceholder') || 'Min seats'}
                value={seats}
                onChange={e => setSeats(e.target.value)}
                aria-label={t('search.seats') || 'Seats'}
              />
            </div>
            <div className="search-filter-group">
              <label className="search-filter-label">{t('search.minPrice') || 'Min Price'}</label>
              <input
                className="form-input"
                type="number"
                min="0"
                placeholder="₹0"
                value={priceMin}
                onChange={e => setPriceMin(e.target.value)}
                aria-label={t('search.minPrice') || 'Min Price'}
              />
            </div>
            <div className="search-filter-group">
              <label className="search-filter-label">{t('search.maxPrice') || 'Max Price'}</label>
              <input
                className="form-input"
                type="number"
                min="0"
                placeholder="₹10000"
                value={priceMax}
                onChange={e => setPriceMax(e.target.value)}
                aria-label={t('search.maxPrice') || 'Max Price'}
              />
            </div>
          </div>
        </ScrollReveal>

        {facetCounts && facetCounts.vehicleType && Object.keys(facetCounts.vehicleType).length > 0 && (
          <ScrollReveal className="animate-fade-up">
            <div className="search-facets">
              <div className="search-facet-group">
                <span className="search-facet-label">{t('search.vehicleType', 'Vehicle Type')}</span>
                <div className="search-facet-options">
                  {Object.entries(facetCounts.vehicleType).map(([type, count]) => (
                    <label key={type} className={`search-facet-chip${vehicleTypes.includes(type) ? ' active' : ''}`}>
                      <input
                        type="checkbox"
                        checked={vehicleTypes.includes(type)}
                        onChange={() => toggleVehicleType(type)}
                      />
                      <span className="search-facet-chip-label">{type}</span>
                      <span className="search-facet-chip-count">{count}</span>
                    </label>
                  ))}
                  {vehicleTypes.length > 0 && (
                    <button className="search-facet-clear" onClick={() => setVehicleTypes([])}>
                      ✕ {t('search.clear', 'Clear')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </ScrollReveal>
        )}

        {loading && (
          <div className="search-results">
            <SkeletonCard count={3} />
          </div>
        )}

        {!loading && !hasFetched.current && results.length === 0 && (
          <ScrollReveal className="animate-scale-in">
            <div className="search-empty">
              <div className="search-empty-icon">🔍</div>
              <h3 className="search-empty-title">{t('search.startTyping') || 'Start Searching'}</h3>
              <p className="search-empty-text">{t('search.hint') || 'Enter a source and destination to find available routes.'}</p>
            </div>
          </ScrollReveal>
        )}

        {!loading && hasFetched.current && results.length === 0 && (
          <ScrollReveal className="animate-scale-in">
            <div className="search-empty">
              <div className="search-empty-icon">🚫</div>
              <h3 className="search-empty-title">{t('search.noResults') || 'No Routes Found'}</h3>
              <p className="search-empty-text">{t('search.tryDifferent') || 'Try a different search or check back later.'}</p>
            </div>
          </ScrollReveal>
        )}

        {results.length > 0 && (
          <div className="search-results animate-stagger revealed">
            {results.map(r => {
              const depDate = r.departureTime ? new Date(r.departureTime).toISOString().split('T')[0] : '';
              const isBooked = r.exclusivelyBooked;
              const isMyBooking = r.bookedByMe;

              return (
                <div key={r.id} className={`search-result-card${isBooked ? ' search-result-card--booked' : ''}`}>
                  <div className="search-result-route">
                    <h3>
                      <span className="search-result-route-icon">📍</span>
                      {r.source} → {r.destination}
                      {isBooked && (
                        <span className="booking-exclusive-badge" title="This vehicle is exclusively booked by another traveler">
                          🔒 {t('search.exclusivelyBooked', 'Exclusively Booked')}
                        </span>
                      )}
                      {isMyBooking && !isBooked && (
                        <span className="booking-mine-badge">
                          ✓ {t('search.yourBooking', 'Your Booking')}
                        </span>
                      )}
                    </h3>
                    <div className="search-result-details">
                      <span className="search-result-detail">🚗 {r.vehicleType}</span>
                      <span className="search-result-detail">👤 {r.driverName}</span>
                      <span className="search-result-detail">🏢 {r.agencyName}</span>
                      <span className="search-result-detail">📅 {new Date(r.departureTime).toLocaleDateString()}</span>
                      <span className="search-result-detail">🕒 {new Date(r.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {isBooked && (
                      <p className="search-result-booked-msg">
                        {t('search.bookedByOther', 'This vehicle is exclusively reserved by another traveler. Please choose a different route.')}
                      </p>
                    )}
                  </div>
                  <div className="search-result-actions">
                    <div className="search-result-price">₹{r.fare}</div>
                    <div className="search-result-price-label">
                      {isBooked ? t('search.unavailable', 'Unavailable') : t('search.perSeat', 'per seat')}
                    </div>
                    {isBooked ? (
                      <button className="btn btn-booked-disabled" disabled>
                        🔒 {t('search.alreadyBooked', 'Already Booked')}
                      </button>
                    ) : isMyBooking ? (
                      <Button
                        size="sm"
                        onClick={() => navigate(`/bookings/new?routeId=${r.id}&driverId=${r.driverId}&date=${depDate}`)}
                      >
                        ➕ {t('search.addSeats', 'Add More Seats')}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => navigate(`/bookings/new?routeId=${r.id}&driverId=${r.driverId}&date=${depDate}`)}
                      >
                        {t('search.book') || 'Book Now'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchPage;
