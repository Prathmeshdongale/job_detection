import { createSlice } from '@reduxjs/toolkit';

const storedTheme = localStorage.getItem('jg_theme') || 'dark';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    toasts: [],
    isLoading: false,
    theme: storedTheme,
  },
  reducers: {
    addToast(state, action) {
      state.toasts.push({ id: Date.now(), ...action.payload });
    },
    removeToast(state, action) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('jg_theme', state.theme);
    },
  },
});

export const { addToast, removeToast, toggleTheme } = uiSlice.actions;
export default uiSlice.reducer;
