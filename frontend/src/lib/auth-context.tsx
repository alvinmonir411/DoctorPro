"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "@/types";
import { auth as authApi } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    phone?: string
  ) => Promise<void>;
  logout: () => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "doctorpro_token";

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Load user on mount
  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

    if (!token) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }

    setState((s) => ({ ...s, token }));

    authApi
      .getProfile()
      .then((user) => {
        setState({
          user: user as User,
          token,
          isLoading: false,
          isAuthenticated: true,
        });
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        });
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res: any = await authApi.login({ email, password });
    const token = res?.access_token || res?.accessToken;
    const user = res?.user as User;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
    setState({
      user,
      token,
      isLoading: false,
      isAuthenticated: !!token,
    });
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, phone?: string) => {
      const res = await authApi.register({ name, email, password, phone });
      const { access_token, user } = res as {
        access_token: string;
        user: User;
      };
      localStorage.setItem(TOKEN_KEY, access_token);
      setState({
        user,
        token: access_token,
        isLoading: false,
        isAuthenticated: true,
      });
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  const value = useMemo(
    () => ({ ...state, login, register, logout }),
    [state, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
