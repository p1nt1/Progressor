import axios from 'axios';

import type { ActiveExercise, ProfileData } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  withCredentials: true,
});

export const auth = {
  session: () => api.get('/auth/session'),
  login: (idToken: string) => api.post('/auth/login', { idToken }),
  register: (username: string, password: string) => api.post('/auth/register', { username, password }),
  loginLocal: (username: string, password: string) => api.post('/auth/login-local', { username, password }),
  logout: () => api.post('/auth/logout'),
};

export const exercises = {
  list: (muscleGroup?: string) =>
    api.get('/exercises', { params: muscleGroup ? { muscleGroup } : {} }),
  create: (data: { name: string; muscleGroup: string; isCompound: boolean }) =>
    api.post('/exercises', data),
};

export const workouts = {
  create: (data: { name: string; type: string; startedAt: string; exercises: Array<{ exerciseId: number; order: number; sets: Array<{ setNumber: number; reps: number; weightKg: number; completed: boolean }> }> }) => api.post('/workouts', data),
  list: (limit = 20, offset = 0) => api.get('/workouts', { params: { limit, offset } }),
  get: (id: string) => api.get(`/workouts/${id}`),
  complete: (id: string, feedbackRating?: number) => api.put(`/workouts/${id}/complete`, { feedbackRating }),
  history: (exerciseId: number) => api.get(`/workouts/history/${exerciseId}`),
  lastWeights: (exerciseIds: number[]) => api.post('/workouts/last-weights', { exerciseIds }),
  stats: () => api.get('/workouts/stats'),
};

export const ai = {
  generate: (type: string, focus?: string, config?: { signal?: AbortSignal }) =>
    api.post('/ai/generate', { type, focus }, config),
  reviewWorkout: (workoutId: string, feedbackRating?: number) => api.post('/ai/review-workout', { workoutId, feedbackRating }),
};

export const profile = {
  get: () => api.get('/profile'),
  save: (data: Partial<ProfileData>) => api.put('/profile', data),
  patchSplitRotation: (splitRotationIndex: number) =>
    api.patch('/profile/split-rotation', { splitRotationIndex }),
};

export const templates = {
  list: () => api.get('/templates'),
  create: (data: { name: string; type: string; exercises: ActiveExercise[] }) => api.post('/templates', data),
  remove: (id: number) => api.delete(`/templates/${id}`),
};

export const bootstrap = {
  load: () => api.get('/bootstrap'),
};

export default api;
