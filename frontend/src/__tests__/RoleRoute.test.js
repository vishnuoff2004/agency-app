import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
  AuthProvider: ({ children }) => <>{children}</>,
}));

const { useAuth } = require('../contexts/AuthContext');

function TestPage() {
  return <div data-testid="protected-content">Protected Content</div>;
}

const RoleRoute = require('../components/common/RoleRoute').default;

function renderRoute() {
  return render(
    <MemoryRouter initialEntries={['/test']}>
      <Routes>
        <Route path="/test" element={
          <RoleRoute roles={['admin']}>
            <TestPage />
          </RoleRoute>
        } />
        <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('RoleRoute — REQ-052', () => {
  beforeEach(() => {
    useAuth.mockReset();
  });

  test('TEST-183: renders children when user has required role', () => {
    useAuth.mockReturnValue({ user: { role: 'admin' }, loading: false });
    renderRoute();
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  test('TEST-184: redirects when user lacks required role', () => {
    useAuth.mockReturnValue({ user: { role: 'traveler' }, loading: false });
    renderRoute();
    expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
  });

  test('TEST-185: redirects when no user', () => {
    useAuth.mockReturnValue({ user: null, loading: false });
    renderRoute();
    expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
  });

  test('TEST-186: shows loading state while auth is loading', () => {
    useAuth.mockReturnValue({ user: null, loading: true });
    renderRoute();
    expect(screen.getByText('Verifying access...')).toBeInTheDocument();
  });
});
