import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: '/api',
});

// Attach token from SSO cookie to every request
api.interceptors.request.use((config) => {
  const token = Cookies.get('ssoid');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API helpers
export const auth = {
  session: () => api.get('/auth/session'),
};

export const exercises = {
  list: (muscleGroup?: string) =>
    api.get('/exercises', { params: muscleGroup ? { muscleGroup } : {} }),
};

export const workouts = {
  create: (data: any) => api.post('/workouts', data),
  list: (limit = 20, offset = 0) => api.get('/workouts', { params: { limit, offset } }),
  get: (id: string) => api.get(`/workouts/${id}`),
  complete: (id: string) => api.put(`/workouts/${id}/complete`),
  history: (exerciseId: number) => api.get(`/workouts/history/${exerciseId}`),
  progression: (exerciseId: number) => api.get(`/workouts/progression/${exerciseId}`),
  lastWeights: (exerciseIds: number[]) => api.post('/workouts/last-weights', { exerciseIds }),
  stats: () => api.get('/workouts/stats'),
  progressionLog: (exerciseId?: number, limit = 50) =>
    api.get('/workouts/progression-log', { params: { ...(exerciseId !== undefined ? { exerciseId } : {}), limit } }),
  progressionSummary: () => api.get('/workouts/progression-summary'),
};

export const ai = {
  generate: (type: string) => api.post('/ai/generate', { type }),
  explain: (exerciseId: number) => api.get(`/ai/explain/${exerciseId}`),
  weeklySummary: () => api.get('/ai/weekly-summary'),
  reviewWorkout: (workoutId: string) => api.post('/ai/review-workout', { workoutId }),
};

export const profile = {
  get: () => api.get('/profile'),
  save: (data: any) => api.put('/profile', data),
};

export const templates = {
  list: () => api.get('/templates'),
  create: (data: { name: string; type: string; exercises: any[] }) => api.post('/templates', data),
  remove: (id: number) => api.delete(`/templates/${id}`),
};

export default api;
