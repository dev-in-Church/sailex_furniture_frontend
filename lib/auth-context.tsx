"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { type User, getMe, login as apiLogin, register as apiRegister, mergeCart } from "./api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; phone?: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "sailex_token";
const SESSION_KEY = "sailex_session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        try {
          const { user } = await getMe(storedToken);
          setUser(user);
          setToken(storedToken);
        } catch {
          localStorage.removeItem(TOKEN_KEY);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const handleAuthSuccess = useCallback(async (authUser: User, authToken: string) => {
    localStorage.setItem(TOKEN_KEY, authToken);
    setUser(authUser);
    setToken(authToken);

    // Merge guest cart if exists
    const sessionId = localStorage.getItem(SESSION_KEY);
    if (sessionId) {
      try {
        await mergeCart(sessionId, authToken);
        localStorage.removeItem(SESSION_KEY);
      } catch (error) {
        console.error("Failed to merge cart:", error);
      }
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user, token } = await apiLogin(email, password);
    await handleAuthSuccess(user, token);
  }, [handleAuthSuccess]);

  const loginWithGoogle = useCallback(async (credential: string) => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const response = await fetch(`${API_BASE}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to authenticate with Google");
    }
    
    const { user, token } = await response.json();
    await handleAuthSuccess(user, token);
  }, [handleAuthSuccess]);

  const register = useCallback(async (data: { email: string; password: string; name: string; phone?: string }) => {
    const { user, token } = await apiRegister(data);
    await handleAuthSuccess(user, token);
  }, [handleAuthSuccess]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, loginWithGoogle, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}
