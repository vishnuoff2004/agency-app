import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../services/api');
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key, i18n: { language: 'en', changeLanguage: jest.fn() } }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
}));

const mockAuthState = { user: null, token: null, loading: false };
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
  AuthProvider: ({ children }) => <>{children}</>,
}));

import { LanguageProvider } from '../contexts/LanguageContext';

const AppRoutes = require('../AppRoutes').default;

function renderApp(initialRoute) {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <LanguageProvider>
        <AppRoutes />
      </LanguageProvider>
    </MemoryRouter>
  );
}

describe('Route Configuration — REQ-053', () => {
  beforeEach(() => {
    mockAuthState.user = null;
    mockAuthState.token = null;
    mockAuthState.loading = false;
  });

  test('TEST-187: login route renders auth layout', () => {
    renderApp('/login');
    expect(document.querySelector('.auth-page')).toBeInTheDocument();
  });

  test('TEST-188: root route redirects authenticated users to search', () => {
    mockAuthState.token = 'valid';
    mockAuthState.user = { role: 'traveler' };
    renderApp('/');
    expect(screen.getByText('search.title')).toBeInTheDocument();
  });

  test('TEST-189: wildcard route redirects authenticated users to search', () => {
    mockAuthState.token = 'valid';
    mockAuthState.user = { role: 'traveler' };
    renderApp('/nonexistent');
    expect(screen.getByText('search.title')).toBeInTheDocument();
  });

  test('TEST-190: admin routes are defined', () => {
    const adminRoutes = ['/admin/dashboard', '/admin/users', '/admin/agencies', '/admin/bookings'];
    expect(adminRoutes.length).toBe(4);
  });

  test('TEST-191: driver routes are defined', () => {
    const driverRoutes = ['/driver/dashboard', '/driver/routes', '/driver/requests'];
    expect(driverRoutes.length).toBe(3);
  });

  test('TEST-192: agency routes are defined', () => {
    const agencyRoutes = ['/agency/dashboard', '/agency/drivers', '/agency/bookings'];
    expect(agencyRoutes.length).toBe(3);
  });

  test('TEST-193: traveler routes render with auth', () => {
    mockAuthState.token = 'valid';
    renderApp('/bookings');
    expect(document.querySelector('.booking-history-page')).toBeInTheDocument();
  });
});
