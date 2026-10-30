"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { appConfig } from "@/config/app-config";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadUser = window.setTimeout(() => {
      const storedUser = window.localStorage.getItem(appConfig.storageKeys.loggedInUser);
      setUser(storedUser ? JSON.parse(storedUser) : null);
      setIsReady(true);
    }, 0);
    return () => window.clearTimeout(loadUser);
  }, []);

  const value = useMemo(() => ({
    isReady,
    user,
    logIn(nextUser) {
      window.localStorage.setItem(appConfig.storageKeys.loggedInUser, JSON.stringify(nextUser));
      setUser(nextUser);
    },
    logOut() {
      window.localStorage.removeItem(appConfig.storageKeys.loggedInUser);
      setUser(null);
    }
  }), [isReady, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
