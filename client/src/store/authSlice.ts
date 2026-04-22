import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';
import type { AuthUser } from '../types';

const SSO_COOKIE = 'ssoid';


interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Restore from cookie on load
function getInitialState(): AuthState {
  const token = Cookies.get(SSO_COOKIE) || null;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 > Date.now()) {
        return {
          user: { email: payload.email, name: payload.name, picture: payload.picture, sub: payload.sub },
          token,
          isAuthenticated: true,
          isLoading: false,
        };
      }
    } catch { /* invalid token */ }
    Cookies.remove(SSO_COOKIE);
  }
  return { user: null, token: null, isAuthenticated: false, isLoading: false };
}

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState(),
  reducers: {
    loginSuccess(state, action: PayloadAction<{ token: string; user: AuthUser }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isLoading = false;
      Cookies.set(SSO_COOKIE, action.payload.token, {
        expires: 1, // 1 day
        sameSite: 'Lax',
        secure: window.location.protocol === 'https:',
      });
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      Cookies.remove(SSO_COOKIE);
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
  },
});

export const { loginSuccess, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;

