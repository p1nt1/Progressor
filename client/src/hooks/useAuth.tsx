import type { ReactNode } from 'react';
import { useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearActivePlan } from '../store/workoutSlice';
import { clearProfile, setLoggedIn } from '../store/userSlice';
import type { SessionUser } from '../types';
import { auth as authApi } from '../api/client';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return <>{children}</>;
}

export function useAuth() {
  const qc = useQueryClient();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isLoggedIn = useAppSelector((s) => s.user.isLoggedIn);

  const { data: user, isLoading } = useQuery<SessionUser | null>({
    queryKey: ['session'],
    queryFn: async () => {
      try {
        const res = await authApi.session();
        const u = (res.data.user as SessionUser) ?? null;
        if (!u) dispatch(setLoggedIn(false));
        return u;
      } catch {
        dispatch(setLoggedIn(false));
        return null;
      }
    },
    enabled: isLoggedIn,
    staleTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  /** Shared credential handler */
  const handleCredential = useCallback(
    async (response: { credential: string }) => {
      try {
        await authApi.login(response.credential);
        dispatch(setLoggedIn(true));
        await qc.invalidateQueries({ queryKey: ['session'] });
      } catch (err) {
        console.error('Login failed:', err);
      }
    },
    [qc, dispatch],
  );

  /** Opens the Google sign-in popup. */
  const login = useCallback(function tryLogin(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google;
    if (!google) {
      // Retry until the Google script has loaded
      setTimeout(tryLogin, 300);
      return;
    }

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredential,
      auto_select: false,
    });

    // Render a hidden Google button and click it to open the account-chooser popup
    const tmp = document.createElement('div');
    tmp.style.cssText = 'position:fixed;top:-9999px';
    document.body.appendChild(tmp);
    google.accounts.id.renderButton(tmp, { type: 'icon', size: 'large' });

    const btn = tmp.querySelector('[role="button"]') as HTMLElement
      ?? tmp.querySelector('div[tabindex]') as HTMLElement;
    btn?.click();

    setTimeout(() => tmp.remove(), 5000);
  }, [handleCredential]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch { /* ignore */ }
    dispatch(clearActivePlan());
    dispatch(clearProfile());
    qc.clear();
    (window as any).google?.accounts.id.disableAutoSelect();
    navigate('/', { replace: true });
  }, [qc, dispatch, navigate]);

  const loginLocal = useCallback(async (username: string, password: string) => {
    await authApi.loginLocal(username, password);
    dispatch(setLoggedIn(true));
    await qc.invalidateQueries({ queryKey: ['session'] });
  }, [qc, dispatch]);

  const register = useCallback(async (username: string, password: string) => {
    await authApi.register(username, password);
    dispatch(setLoggedIn(true));
    await qc.invalidateQueries({ queryKey: ['session'] });
  }, [qc, dispatch]);

  return {
    user: user ?? null,
    isAuthenticated: !isLoading && !!user,
    isLoading,
    login,
    loginLocal,
    register,
    logout,
  };
}
