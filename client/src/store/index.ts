import { configureStore } from '@reduxjs/toolkit';
import workoutReducer from './workoutSlice';
import userReducer from './userSlice';

export const store = configureStore({
  reducer: {
    workout: workoutReducer,
    user: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
