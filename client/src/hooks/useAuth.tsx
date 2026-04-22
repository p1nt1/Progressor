import { useEffect, useCallback, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginSuccess, logout as logoutAction } from '../store/authSlice';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((s) => s.auth);

  const handleCredentialResponse = useCallback(
    (response: any) => {
      const idToken = response.credential;
      const payload = JSON.parse(atob(idToken.split('.')[1]));

      dispatch(
        loginSuccess({
          token: idToken,
          user: {
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
            sub: payload.sub,
          },
        })
      );
    },
    [dispatch]
  );

  useEffect(() => {
    if (isAuthenticated) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      (window as any).google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: true,
      });
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [isAuthenticated, handleCredentialResponse]);

  return <>{children}</>;
}

export function useAuth() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading, user } = useAppSelector((s) => s.auth);

  const login = () => {
    (window as any).google?.accounts.id.prompt();
  };

  const logout = () => {
    dispatch(logoutAction());
    queryClient.clear();
    (window as any).google?.accounts.id.disableAutoSelect();
  };

  return { isAuthenticated, isLoading, user, login, logout };
}
