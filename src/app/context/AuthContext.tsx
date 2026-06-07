import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase, apiCall } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<{ needsConfirmation: boolean }>;
  resendConfirmation: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => ({ needsConfirmation: false }),
  resendConfirmation: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  updateName: async () => {},
  changePassword: async () => {},
  deleteAccount: async () => {},
});

export const useAuth = (): AuthContextType => useContext(AuthContext);

const toAuthUser = (u: any): AuthUser => ({
  id: u.id,
  email: u.email ?? '',
  name: u.user_metadata?.name ?? u.email?.split('@')[0] ?? 'User',
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    // onAuthStateChange ловит ВСЕ события: INITIAL_SESSION, SIGNED_IN, SIGNED_OUT,
    // TOKEN_REFRESHED, USER_UPDATED — в том числе подтверждение email из ссылки в письме
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] event:', event, '| user:', session?.user?.email ?? 'null');

      setUser(session?.user ? toAuthUser(session.user) : null);

      if (!initialized.current) {
        initialized.current = true;
        setLoading(false);
      }
    });

    // Страховка на случай если onAuthStateChange завис
    const fallback = setTimeout(() => {
      if (!initialized.current) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          setUser(session?.user ? toAuthUser(session.user) : null);
          initialized.current = true;
          setLoading(false);
        });
      }
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallback);
    };
  }, []);

  // ─── Вход ─────────────────────────────────────────────────────────────────

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // Устанавливаем user немедленно — до navigate() в AuthScreen
    if (data.user) setUser(toAuthUser(data.user));
  };

  // ─── Регистрация ──────────────────────────────────────────────────────────

  /**
   * Стандартная регистрация через Supabase Auth.
   * 
   * Supabase сам отправляет письмо с подтверждением на email.
   * Возвращает { needsConfirmation: true } если письмо отправлено и надо ждать.
   * Возвращает { needsConfirmation: false } если подтверждение не нужно (disabled в dashboard).
   * 
   * После клика по ссылке в письме — onAuthStateChange срабатывает со SIGNED_IN,
   * и пользователь автоматически оказывается в приложении.
   */
  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) throw error;

    // Если session есть сразу — подтверждение не нужно (отключено в Supabase dashboard)
    if (data.session) {
      if (data.user) setUser(toAuthUser(data.user));

      return { needsConfirmation: false };
    }

    // session === null означает: письмо отправлено, ждём подтверждения
    return { needsConfirmation: true };
  };

  const resendConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error) throw error;
  };

  // ─── Выход ────────────────────────────────────────────────────────────────

  const signOut = async () => {
    setUser(null);
    await supabase.auth.signOut();
  };

  // ─── Сброс пароля ─────────────────────────────────────────────────────────

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };

  // ─── Обновления профиля ───────────────────────────────────────────────────

  const updateName = async (name: string) => {
    const { data, error } = await supabase.auth.updateUser({ data: { name } });
    if (error) throw error;
    if (data.user) setUser(toAuthUser(data.user));
  };

  const changePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  const deleteAccount = async () => {
    await apiCall('/account', { method: 'DELETE' });
    setUser(null);
    await supabase.auth.signOut();
  };

  // ─── Value ────────────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider value={{
      user, loading,
      signIn, signUp, resendConfirmation, signOut,
      resetPassword, updateName, changePassword, deleteAccount,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
