import { supabase, isDemoPreview } from '../lib/supabase';
import React, { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Spark } from '../components/PixelIcons';

export type Mode = 'signin' | 'signup';

export default function AuthScreen() {
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();

  if (isDemoPreview) return <Centered><div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 space-y-5"><Spark size={40}/><p className="eyebrow">Локальное демо</p><h1 className="text-2xl">Здесь вход не требуется</h1><p className="text-sm text-muted-foreground">Это отдельная версия для проверки интерфейса с тестовыми данными. Google и настоящий аккаунт доступны в основном приложении.</p><a className="block rounded-xl bg-primary text-primary-foreground p-3 text-center" href="http://localhost:5180/auth">Открыть настоящее приложение</a><a className="block text-center underline p-3" href="/">Вернуться к демо</a></div></Centered>;

  if (!loading && user) return <Navigate to="/" replace />;

  if (loading) {
    return (
      <Centered>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
        <p style={{ fontFamily: 'var(--font-machine)', color: 'var(--foreground)', opacity: 0.5 }}>
          Загрузка…
        </p>
      </Centered>
    );
  }

  return <Centered><AuthPanel initialMode={searchParams.get('mode') === 'signup' ? 'signup' : 'signin'} /></Centered>;
}

const panelTitles: Record<Mode, string> = { signin: 'Вход в Dreamboard', signup: 'Создайте свой Dreamboard' };

/**
 * Sign-in is Google-only: one button both signs in and, on first use, creates the account.
 * Used by /auth (variant "page", with the big logo) and inline on the landing page
 * (variant "inline", compact title and a close button).
 */
export function AuthPanel({ initialMode = 'signin', variant = 'page', onClose }: { initialMode?: Mode; variant?: 'page' | 'inline'; onClose?: () => void }) {
  const [googleBusy, setGoogleBusy] = useState(false);

  const signInWithGoogle = async () => {
    setGoogleBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/`, queryParams: { prompt: 'select_account' } },
      });
      if (error) throw error;
    } catch {
      toast.error('Не удалось начать вход через Google. Проверьте подключение и попробуйте ещё раз.');
      setGoogleBusy(false);
    }
  };

  return (
    <div className={`w-full max-w-md ${variant === 'inline' ? 'auth-inline' : ''}`}>
      {variant === 'inline' ? <div className="auth-inline-head">
        <div><p className="eyebrow">Dreamboard</p><h2>{panelTitles[initialMode]}</h2></div>
        {onClose && <button type="button" onClick={onClose} className="auth-inline-close" aria-label="Закрыть">×</button>}
      </div> : <div className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl tracking-tight mb-2" style={{ fontFamily: 'var(--font-machine)', color: 'var(--foreground)' }}>
          <Link to="/">Dreamboard</Link>
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {initialMode === 'signup' ? 'Создайте свой Dreamboard' : 'Войдите в свой аккаунт'}
        </p>
      </div>}

      <div className="auth-card rounded-2xl border border-border p-6 sm:p-8" style={{ background: 'var(--card)' }}>
        <button type="button" disabled={googleBusy} onClick={signInWithGoogle} className="auth-google">
          <GoogleIcon/>
          <span>{googleBusy ? 'Открываем Google…' : 'Продолжить с Google'}</span>
        </button>
        <p className="mt-4 text-center text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
          {initialMode === 'signup' ? 'Аккаунт создастся автоматически при первом входе.' : 'Нет аккаунта? Он создастся автоматически при первом входе.'}
        </p>
        <div className="mt-6 pt-5 text-center border-t border-border">
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Личное пространство для ваших мечт{variant === 'page' && <> · <Link to="/" className="underline underline-offset-4">Что такое Dreamboard</Link></>}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4"
      style={{ background: 'transparent' }}>
      {children}
    </div>
  );
}

function GoogleIcon() {
  return <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
  </svg>;
}
