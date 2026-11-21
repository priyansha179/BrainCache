import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../services/api';
import { tokenStorage } from '../services/tokenStorage';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const signOut = useCallback(async () => {
    try { await tokenStorage.clear(); } finally { setToken(null); setUser(null); }
  }, []);
  useEffect(() => {
    let active = true;
    async function restoreSession() {
      try {
        const savedToken = await tokenStorage.get();
        if (!savedToken) return;
        const currentUser = await authApi.me(savedToken);
        if (active) { setToken(savedToken); setUser(currentUser); }
      } catch { await tokenStorage.clear().catch(() => {}); }
      finally { if (active) setIsLoading(false); }
    }
    restoreSession();
    return () => { active = false; };
  }, []);
  const signIn = useCallback(async (email, password) => {
    const result = await authApi.login(email.trim().toLowerCase(), password);
    await tokenStorage.set(result.access_token);
    try {
      const currentUser = await authApi.me(result.access_token);
      setToken(result.access_token); setUser(currentUser); return currentUser;
    } catch (error) { await tokenStorage.clear(); throw error; }
  }, []);
  const signUp = useCallback(async (email, password) => {
    await authApi.register(email.trim().toLowerCase(), password);
    return signIn(email, password);
  }, [signIn]);
  const value = useMemo(() => ({ token, user, isLoading, isAuthenticated: Boolean(token && user), signIn, signUp, signOut }), [token, user, isLoading, signIn, signUp, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}