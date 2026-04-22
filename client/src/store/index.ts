import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { logout } from './authSlice';
import authReducer from './authSlice';
import workoutReducer from './workoutSlice';

const appReducer = combineReducers({
  auth: authReducer,
  workout: workoutReducer,
});

const rootReducer: typeof appReducer = (state, action) => {
  // Reset all state when user logs out
  if (action.type === logout.type) {
    state = undefined;
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
