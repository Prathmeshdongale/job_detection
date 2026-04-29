import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axiosInstance';

export const submitJobText = createAsyncThunk(
  'checks/submitJobText',
  async (text, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/api/predict', { text });
      return { type: 'single', data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Prediction failed');
    }
  }
);

export const uploadCsv = createAsyncThunk(
  'checks/uploadCsv',
  async ({ file, onProgress }, { rejectWithValue }) => {
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post('/api/predict/batch', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      return { type: 'batch', data };
    } catch (err) {
      const status = err.response?.status;
      const msg =
        status === 413 ? 'File too large (max 10 MB)' :
        status === 422 ? 'Too many rows (max 500)' :
        err.response?.data?.error || 'Upload failed';
      return rejectWithValue(msg);
    }
  }
);

export const fetchHistory = createAsyncThunk(
  'checks/fetchHistory',
  async ({ page = 1, limit = 20, risk = '', search = '', dateFrom = '', dateTo = '' } = {}, { rejectWithValue }) => {
    try {
      const params = { page, limit };
      if (risk) params.risk = risk;
      if (search) params.search = search;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const { data } = await api.get('/api/checks', { params });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch history');
    }
  }
);

export const deleteCheck = createAsyncThunk(
  'checks/deleteCheck',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/api/checks/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Delete failed');
    }
  }
);

export const fetchAnalytics = createAsyncThunk(
  'checks/fetchAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/api/checks/analytics');
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch analytics');
    }
  }
);

export const toggleBookmark = createAsyncThunk(
  'checks/toggleBookmark',
  async (id, { getState }) => {
    const bookmarks = getState().checks.bookmarks;
    const updated = bookmarks.includes(id)
      ? bookmarks.filter((b) => b !== id)
      : [...bookmarks, id];
    localStorage.setItem('jg_bookmarks', JSON.stringify(updated));
    return updated;
  }
);

const storedBookmarks = (() => {
  try { return JSON.parse(localStorage.getItem('jg_bookmarks') || '[]'); } catch { return []; }
})();

const checksSlice = createSlice({
  name: 'checks',
  initialState: {
    currentCheck: null,
    batchResults: null,
    history: [],
    pagination: { page: 1, limit: 20, total: 0 },
    filters: { risk: '', search: '', dateFrom: '', dateTo: '' },
    analytics: null,
    bookmarks: storedBookmarks,
    status: 'idle',
    analyticsStatus: 'idle',
    error: null,
  },
  reducers: {
    clearCurrentCheck(state) {
      state.currentCheck = null;
      state.batchResults = null;
    },
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters(state) {
      state.filters = { risk: '', search: '', dateFrom: '', dateTo: '' };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitJobText.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(submitJobText.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentCheck = action.payload.data;
        state.batchResults = null;
      })
      .addCase(submitJobText.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(uploadCsv.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(uploadCsv.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.batchResults = action.payload.data;
        state.currentCheck = null;
      })
      .addCase(uploadCsv.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchHistory.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(fetchHistory.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.history = action.payload.checks;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchHistory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(deleteCheck.fulfilled, (state, action) => {
        state.history = state.history.filter((c) => c._id !== action.payload);
        state.pagination.total = Math.max(0, state.pagination.total - 1);
      })
      .addCase(fetchAnalytics.pending, (state) => { state.analyticsStatus = 'loading'; })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.analyticsStatus = 'succeeded';
        state.analytics = action.payload;
      })
      .addCase(fetchAnalytics.rejected, (state) => { state.analyticsStatus = 'failed'; })
      .addCase(toggleBookmark.fulfilled, (state, action) => {
        state.bookmarks = action.payload;
      });
  },
});

export const { clearCurrentCheck, setFilters, clearFilters } = checksSlice.actions;
export default checksSlice.reducer;
