import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Button from '../../components/common/Button';
import { ScrollReveal } from '../../hooks/useScrollAnimation';

function RouteManagementPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ source: '', destination: '', departureTime: '', arrivalTime: '', fare: '', capacity: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/drivers/routes', form);
      setSuccess(true);
      setForm({ source: '', destination: '', departureTime: '', arrivalTime: '', fare: '', capacity: '' });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert(err.response?.data?.message || t('driver.failedToCreateRoute', 'Failed to create route'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="driver-page">
      <div className="container">
        <ScrollReveal className="animate-fade-up">
          <div className="admin-header">
            <div>
              <h1 className="admin-title">{t('driver.routes', 'Manage Routes')}</h1>
              <p className="text-muted">{t('driver.createNewRoutes', 'Create new driving routes')}</p>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal className="animate-fade-up">
          <div className="route-form-card">
            {success && (
              <div className="success-state" style={{ padding: '16px 0' }}>
                <div className="success-state-icon" style={{ width: 48, height: 48, fontSize: '1.2rem' }}>✓</div>
                <h3 style={{ marginTop: 8 }}>{t('driver.routeCreated', 'Route Created!')}</h3>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-input-group">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">{t('driver.source', 'Source')}</label>
                  <input className="form-input" name="source" placeholder={t('driver.sourcePlaceholder', 'City name')} value={form.source} onChange={handleChange} required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">{t('driver.destination', 'Destination')}</label>
                  <input className="form-input" name="destination" placeholder={t('driver.destinationPlaceholder', 'City name')} value={form.destination} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-input-group">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">{t('driver.departure', 'Departure')}</label>
                  <input className="form-input" name="departureTime" type="datetime-local" value={form.departureTime} onChange={handleChange} required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">{t('driver.arrival', 'Arrival')}</label>
                  <input className="form-input" name="arrivalTime" type="datetime-local" value={form.arrivalTime} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-input-group">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">{t('driver.farePerSeat', 'Fare (₹)')}</label>
                  <input className="form-input" name="fare" type="number" placeholder={t('driver.fareAmountPlaceholder', 'Amount')} value={form.fare} onChange={handleChange} required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">{t('driver.capacity', 'Capacity')}</label>
                  <input className="form-input" name="capacity" type="number" placeholder={t('driver.capacityPlaceholder', 'Seats')} value={form.capacity} onChange={handleChange} required />
                </div>
              </div>
              <Button type="submit" loading={loading} className="w-full" size="lg">
                {t('driver.createRoute', 'Create Route')}
              </Button>
            </form>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}

export default RouteManagementPage;
