import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axiosInstance';

export const fetchProfile = createAsyncThunk('user/fetchProfile', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/api/user/profile');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to load profile');
  }
});

export const changePassword = createAsyncThunk('user/changePassword', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.put('/api/user/password', payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to change password');
  }
});

export const deleteAccount = createAsyncThunk('user/deleteAccount', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.delete('/api/user/account');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to delete account');
  }
});

const userSlice = createSlice({
  name: 'user',
  initialState: { profile: null, status: 'idle', error: null, pwStatus: 'idle', pwError: null },
  reducers: {
    clearUserState(state) { state.profile = null; state.status = 'idle'; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(fetchProfile.fulfilled, (state, action) => { state.status = 'succeeded'; state.profile = action.payload; })
      .addCase(fetchProfile.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })
      .addCase(changePassword.pending, (state) => { state.pwStatus = 'loading'; state.pwError = null; })
      .addCase(changePassword.fulfilled, (state) => { state.pwStatus = 'succeeded'; })
      .addCase(changePassword.rejected, (state, action) => { state.pwStatus = 'failed'; state.pwError = action.payload; });
  },
});

export const { clearUserState } = userSlice.actions;
export default userSlice.reducer;
