import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/authSlice';
import checksReducer from '../store/checksSlice';
import uiReducer from '../store/uiSlice';
import ProtectedRoute from '../components/routing/ProtectedRoute';
import PublicRoute from '../components/routing/PublicRoute';
import AuthForm from '../components/AuthForm';
import userEvent from '@testing-library/user-event';

function makeStore(authState = {}) {
  return configureStore({
    reducer: { auth: authReducer, checks: checksReducer, ui: uiReducer },
    preloadedState: {
      auth: { token: null, user: null, status: 'idle', error: null, ...authState },
    },
  });
}

// ── ProtectedRoute ──────────────────────────────────────────────────────────

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to /login', () => {
    const store = makeStore({ token: null });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<div>Dashboard</div>} />
            </Route>
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    const store = makeStore({ token: 'valid-token' });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<div>Dashboard</div>} />
            </Route>
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});

// ── PublicRoute ─────────────────────────────────────────────────────────────

describe('PublicRoute', () => {
  it('redirects authenticated users to /dashboard', () => {
    const store = makeStore({ token: 'valid-token' });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<div>Login Page</div>} />
            </Route>
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  it('renders children when not authenticated', () => {
    const store = makeStore({ token: null });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<div>Login Page</div>} />
            </Route>
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
});

// ── AuthForm ────────────────────────────────────────────────────────────────

describe('AuthForm', () => {
  it('disables submit button while loading', () => {
    render(<AuthForm mode="login" onSubmit={() => {}} status="loading" error={null} />);
    expect(screen.getByRole('button', { name: /please wait/i })).toBeDisabled();
  });

  it('shows error message on failure', () => {
    render(
      <AuthForm mode="login" onSubmit={() => {}} status="failed" error="Invalid credentials" />
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
  });

  it('renders username field in register mode', () => {
    render(<AuthForm mode="register" onSubmit={() => {}} status="idle" error={null} />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
  });

  it('does not render username field in login mode', () => {
    render(<AuthForm mode="login" onSubmit={() => {}} status="idle" error={null} />);
    expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument();
  });
});
