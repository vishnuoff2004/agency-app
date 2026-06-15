import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { BookingProvider } from '../contexts/BookingContext';
import BookingHistoryPage from '../pages/traveler/BookingHistoryPage';

jest.mock('../services/api');
jest.mock('../services/bookingService');
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValue, options) => {
      let result = typeof defaultValue === 'string' ? defaultValue : key;
      const opt = typeof defaultValue === 'object' ? defaultValue : options;
      if (opt) {
        Object.keys(opt).forEach(k => {
          result = result.replace(new RegExp(`{{${k}}}`, 'g'), opt[k]);
        });
      }
      return result;
    }
  }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
}));

const mockBookings = {
  data: [
    { id: 1, route: 'Delhi → Mumbai', status: 'confirmed', travelDate: '2026-06-15' },
    { id: 2, route: 'Mumbai → Goa', status: 'completed', travelDate: '2026-05-10' },
  ],
  totalPages: 1,
  page: 1,
  total: 2,
};

function renderWithProviders() {
  localStorage.setItem('token', 'mock-token');
  return render(
    <MemoryRouter>
      <AuthProvider>
        <BookingProvider>
          <BookingHistoryPage />
        </BookingProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('BookingHistoryPage — REQ-048, REQ-049, REQ-050', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('TEST-171: displays loading skeleton on mount', () => {
    const bookingService = require('../services/bookingService');
    bookingService.getBookings.mockImplementation(() => new Promise(() => {}));
    renderWithProviders();
    expect(document.querySelector('.skeleton-list-item')).toBeInTheDocument();
  });

  test('TEST-172: renders bookings using bookingService', async () => {
    const bookingService = require('../services/bookingService');
    bookingService.getBookings.mockResolvedValue(mockBookings);
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText('Booking #1')).toBeInTheDocument();
      expect(screen.getByText('Booking #2')).toBeInTheDocument();
    });
  });

  test('TEST-173: renders error state when bookingService fails', async () => {
    const bookingService = require('../services/bookingService');
    bookingService.getBookings.mockRejectedValue(new Error('Failed to load'));
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText(/Failed to load/i)).toBeInTheDocument();
    });
  });

  test('TEST-174: shows empty state when no bookings', async () => {
    const bookingService = require('../services/bookingService');
    bookingService.getBookings.mockResolvedValue({ data: [], totalPages: 0, page: 1, total: 0 });
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText('booking.noBookings')).toBeInTheDocument();
    });
  });

  test('TEST-175: uses BookingContext provider for state', () => {
    const bookingService = require('../services/bookingService');
    bookingService.getBookings.mockImplementation(() => new Promise(() => {}));
    renderWithProviders();
    expect(screen.getByText('nav.bookings')).toBeInTheDocument();
  });

  test('TEST-176: pagination appears for multi-page results', async () => {
    const bookingService = require('../services/bookingService');
    bookingService.getBookings.mockResolvedValue({
      data: [{ id: 1, route: 'Test', status: 'pending' }],
      totalPages: 3,
      page: 1,
      total: 21,
    });
    renderWithProviders();
    await waitFor(() => {
      expect(document.querySelector('.pagination')).toBeInTheDocument();
    });
  });
});
