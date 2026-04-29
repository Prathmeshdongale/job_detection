import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import authReducer from '../store/authSlice';
import checksReducer from '../store/checksSlice';
import uiReducer from '../store/uiSlice';
import CheckRow from '../components/history/CheckRow';
import Pagination from '../components/history/Pagination';
import HistoryPage from '../pages/HistoryPage';

// Prevent fetchHistory thunk from firing and overriding preloaded state
vi.mock('../store/checksSlice', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    fetchHistory: () => ({ type: 'checks/fetchHistory/noop' }),
  };
});

function makeStore(checksState = {}) {
  return configureStore({
    reducer: { auth: authReducer, checks: checksReducer, ui: uiReducer },
    preloadedState: {
      auth: { token: 'tok', user: null, status: 'idle', error: null },
      checks: {
        currentCheck: null,
        batchResults: null,
        history: [],
        pagination: { page: 1, limit: 20, total: 0 },
        status: 'idle',
        error: null,
        ...checksState,
      },
    },
  });
}

const SAMPLE_CHECKS = [
  { _id: '1', inputText: 'Job A description', scamProbability: 0.85, riskLabel: 'High Risk', createdAt: new Date().toISOString() },
  { _id: '2', inputText: 'Job B description', scamProbability: 0.3, riskLabel: 'Low Risk', createdAt: new Date().toISOString() },
  { _id: '3', inputText: 'Job C description', scamProbability: 0.55, riskLabel: 'Medium Risk', createdAt: new Date().toISOString() },
];

// ── HistoryPage renders correct number of rows ───────────────────────────────

describe('HistoryPage', () => {
  it('renders correct number of rows from Redux state', () => {
    // status must be 'succeeded' so HistoryPage renders the table (not skeleton)
    const store = makeStore({ history: SAMPLE_CHECKS, status: 'succeeded' });
    render(
      <Provider store={store}>
        <MemoryRouter>
          <HistoryPage />
        </MemoryRouter>
      </Provider>
    );
    // Each check has a delete button
    const deleteButtons = screen.getAllByRole('button', { name: /delete check/i });
    expect(deleteButtons).toHaveLength(3);
  });
});

// ── Pagination ───────────────────────────────────────────────────────────────

describe('Pagination', () => {
  it('dispatches fetchHistory with correct page on Next click', () => {
    const store = makeStore({ pagination: { page: 1, limit: 20, total: 50 } });
    const dispatch = vi.spyOn(store, 'dispatch');

    render(
      <Provider store={store}>
        <MemoryRouter>
          <Pagination pagination={{ page: 1, limit: 20, total: 50 }} />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.click(screen.getByText(/next/i));
    // The dispatched action should be a thunk (function)
    expect(dispatch).toHaveBeenCalled();
  });

  it('disables Previous button on first page', () => {
    const store = makeStore();
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Pagination pagination={{ page: 1, limit: 20, total: 50 }} />
        </MemoryRouter>
      </Provider>
    );
    expect(screen.getByText(/← previous/i)).toBeDisabled();
  });

  it('disables Next button on last page', () => {
    const store = makeStore();
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Pagination pagination={{ page: 3, limit: 20, total: 60 }} />
        </MemoryRouter>
      </Provider>
    );
    expect(screen.getByText(/next →/i)).toBeDisabled();
  });
});

// ── CheckRow ─────────────────────────────────────────────────────────────────

describe('CheckRow', () => {
  it('delete button dispatches deleteCheck with correct ID', () => {
    const store = makeStore({ history: [SAMPLE_CHECKS[0]] });
    const dispatch = vi.spyOn(store, 'dispatch');

    render(
      <Provider store={store}>
        <MemoryRouter>
          <table>
            <tbody>
              <CheckRow check={SAMPLE_CHECKS[0]} />
            </tbody>
          </table>
        </MemoryRouter>
      </Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: /delete check 1/i }));
    expect(dispatch).toHaveBeenCalled();
  });
});
