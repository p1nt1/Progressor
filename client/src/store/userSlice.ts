import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { ProfileData } from '../types';

interface UserState {
  profile: ProfileData | null;
  profileLoading: boolean;
  isLoggedIn: boolean;
}

const initialState: UserState = {
  profile: null,
  profileLoading: false,
  isLoggedIn: localStorage.getItem('isLoggedIn') === '1',
};

// ── Slice ───────────────────────────────────────────────────────────────────
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setProfile(state, action: PayloadAction<ProfileData | null>) {
      state.profile = action.payload;
      state.profileLoading = false;
    },
    setProfileLoading(state, action: PayloadAction<boolean>) {
      state.profileLoading = action.payload;
    },
    updateProfile(state, action: PayloadAction<Partial<ProfileData>>) {
      if (state.profile) {
        Object.assign(state.profile, action.payload);
      }
    },
    setLoggedIn(state, action: PayloadAction<boolean>) {
      state.isLoggedIn = action.payload;
      if (action.payload) localStorage.setItem('isLoggedIn', '1');
      else localStorage.removeItem('isLoggedIn');
    },
    clearProfile() {
      localStorage.removeItem('isLoggedIn');
      return { ...initialState, isLoggedIn: false };
    },
  },
});

export const {
  setProfile,
  setProfileLoading,
  updateProfile,
  setLoggedIn,
  clearProfile,
} = userSlice.actions;

export default userSlice.reducer;
