import { supabase, isDemoPreview } from '../lib/supabase';
import React, { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Spark } from '../components/PixelIcons';

type Mode = 'signin' | 'signup' | 'forgot';

export default function AuthScreen() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>(() => searchParams.get('mode') === 'signup' ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
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
    } finally {
      setGoogleBusy(false);
    }
  };
  const [pendingEmail, setPendingEmail] = useState<string | null>(null); // ← экран "проверьте почту"
  const [resending, setResending] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    banner?: string;
  }>({});

  const { user, loading, signIn, signUp, resendConfirmation, resetPassword } = useAuth();
  const navigate = useNavigate();

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

  // ── Экран "письмо отправлено" ─────────────────────────────────────────────
  if (pendingEmail) {
    return (
      <Centered>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mb-4 flex justify-center"><Spark size={48} /></div>
            <h2 style={{ fontFamily: 'var(--font-machine)', fontSize: 32, color: 'var(--foreground)' }}>
              Проверьте почту
            </h2>
          </div>

          <div className="rounded-2xl p-8 shadow-xl text-center space-y-4"
            style={{ background: 'var(--card)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <p style={{ color: 'var(--foreground)' }}>
              Мы отправили письмо с подтверждением на
            </p>
            <p className="font-semibold text-lg" style={{ color: 'var(--foreground)' }}>
              {pendingEmail}
            </p>
            <p className="text-sm" style={{ color: 'rgba(0,0,0,0.45)' }}>
              Откройте письмо и нажмите кнопку «Подтвердить email» —
              вы автоматически войдёте в Dreamboard.
            </p>

            <div className="pt-2 space-y-2">
              <p className="text-xs" style={{ color: 'rgba(0,0,0,0.3)' }}>
                Не пришло? Проверьте папку «Спам».
              </p>
              <button
                type="button"
                disabled={resending}
                onClick={async () => {
                  setResending(true);
                  try {
                    await resendConfirmation(pendingEmail);
                    toast.success('Новое письмо с подтверждением отправлено');
                  } catch (error: any) {
                    toast.error(error?.message ?? 'Не удалось отправить письмо повторно');
                  } finally {
                    setResending(false);
                  }
                }}
                className="text-sm hover:underline disabled:opacity-50"
                style={{ color: 'var(--primary)' }}
              >
                {resending ? 'Отправляем…' : 'Отправить письмо повторно'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingEmail(null);
                  setMode('signin');
                }}
                className="text-sm hover:underline"
                style={{ color: 'var(--primary)' }}
              >
                Уже подтвердили? Войти →
              </button>
            </div>
          </div>
        </div>
      </Centered>
    );
  }

  // ── Форма ─────────────────────────────────────────────────────────────────

  const clearErrors = () => setErrors({});
  const setErr = (k: keyof typeof errors, v: string) =>
    setErrors(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    setSubmitting(true);

    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
        navigate('/', { replace: true });

      } else if (mode === 'signup') {
        if (!name.trim()) { setErr('name', 'Введите ваше имя'); return; }
        if (password.length < 6) { setErr('password', 'Пароль — минимум 6 символов'); return; }

        const { needsConfirmation } = await signUp(email.trim(), password, name.trim());

        if (needsConfirmation) {
          // Показываем экран "проверьте почту"
          setPendingEmail(email.trim());
        } else {
          // Подтверждение email отключено в Supabase — сразу входим
          navigate('/', { replace: true });
        }

      } else if (mode === 'forgot') {
        await resetPassword(email.trim());
        toast.success('Ссылка для сброса пароля отправлена на вашу почту');
        setMode('signin');
      }

    } catch (err: any) {
      console.error('[AuthScreen]', err);
      const msg: string = err?.message ?? '';

      if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
        setErr('email', ' ');
        setErr('password', 'Неверный email или пароль');
      } else if (msg.includes('Email not confirmed')) {
        setErr('banner', 'Email не подтверждён. Проверьте почту и нажмите ссылку из письма.');
      } else if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('User already registered')) {
        setErr('email', 'Этот email уже зарегистрирован');
        setMode('signin');
      } else if (msg.includes('Password should be at least')) {
        setErr('password', 'Пароль — минимум 6 символов');
      } else if (msg.includes('rate limit') || msg.includes('too many')) {
        setErr('banner', 'Слишком много попыток. Подождите немного.');
      } else {
        setErr('banner', msg || 'Что-то пошло не так. Попробуйте ещё раз.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (m: Mode) => { setMode(m); clearErrors(); };

  return (
    <Centered>
      <div className="w-full max-w-md">

        {/* Логотип */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl tracking-tight mb-2"
            style={{ fontFamily: 'var(--font-machine)', color: 'var(--foreground)' }}>
            <Link to="/">Dreamboard</Link>
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {mode === 'signin' && 'Войдите в свой аккаунт'}
            {mode === 'signup' && 'Создайте свой Dreamboard'}
            {mode === 'forgot' && 'Восстановление пароля'}
          </p>
        </div>

        {/* Карточка */}
        <div className="rounded-2xl border border-border p-6 sm:p-8"
          style={{ background: 'var(--card)', border: '1px solid rgba(0,0,0,0.06)' }}>

          {mode !== 'forgot' && <div className="mb-6">
            <button type="button" disabled={googleBusy || submitting} onClick={signInWithGoogle}
              className="w-full rounded-xl border px-4 py-3 text-sm font-medium disabled:opacity-50"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)', background: 'var(--card)' }}>
              {googleBusy ? 'Открываем Google…' : 'Продолжить с Google'}
            </button>
            <p className="text-center text-xs mt-4" style={{ color: 'var(--muted-foreground)' }}>или войдите по почте</p>
          </div>}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Общая ошибка */}
            {errors.banner && (
              <div className="rounded-xl px-4 py-3 text-sm flex gap-2"
                style={{ background: 'var(--muted-bg)', color: 'var(--foreground)', border: '1px solid var(--foreground)' }}>
                <span className="shrink-0">⚠</span>
                <span>{errors.banner}</span>
              </div>
            )}

            {/* Имя */}
            {mode === 'signup' && (
              <Field label="Ваше имя" error={errors.name}>
                <input type="text" value={name}
                  onChange={e => { setName(e.target.value); setErr('name', ''); }}
                  placeholder="Имя или никнейм"
                  autoComplete="name"
                  className={cls(!!errors.name)} />
              </Field>
            )}

            {/* Email */}
            <Field label="Email" error={errors.email?.trim() ? errors.email : undefined}>
              <input type="email" value={email}
                onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '', password: '' })); }}
                placeholder="your@email.com"
                autoComplete="email"
                className={cls(!!errors.email)} />
            </Field>

            {/* Пароль */}
            {mode !== 'forgot' && (
              <Field label="Пароль" error={errors.password}>
                <input type="password" value={password}
                  onChange={e => { setPassword(e.target.value); setErr('password', ''); }}
                  placeholder="••••••••"
                  minLength={6}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  className={cls(!!errors.password)} />
              </Field>
            )}

            <button type="submit" disabled={submitting}
              className="w-full py-3 rounded-xl text-sm font-semibold mt-1 transition-opacity disabled:opacity-50"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
              {submitting
                ? 'Подождите…'
                : mode === 'signin' ? 'Войти'
                : mode === 'signup' ? 'Зарегистрироваться'
                : 'Отправить ссылку'}
            </button>
          </form>

          {/* Переключатели */}
          <div className="mt-6 text-center space-y-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {mode === 'signin' && (
              <>
                <p>Нет аккаунта?{' '}
                  <Btn onClick={() => switchMode('signup')}>Зарегистрироваться</Btn>
                </p>
                <p><Btn onClick={() => switchMode('forgot')}>Забыли пароль?</Btn></p>
              </>
            )}
            {mode === 'signup' && (
              <p>Уже есть аккаунт?{' '}
                <Btn onClick={() => switchMode('signin')}>Войти</Btn>
              </p>
            )}
            {mode === 'forgot' && (
              <p><Btn onClick={() => switchMode('signin')}>← Назад к входу</Btn></p>
            )}
          </div>

          <div className="mt-6 pt-5 text-center" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Личное пространство для ваших мечт · <Link to="/" className="underline underline-offset-4">Что такое Dreamboard</Link>
            </p>
          </div>
        </div>
      </div>
    </Centered>
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

function cls(hasError: boolean) {
  return [
    'w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-all focus:ring-2',
    hasError
      ? 'border-foreground bg-muted focus:ring-ring text-foreground'
      : 'border-border bg-card focus:ring-ring focus:border-foreground',
  ].join(' ');
}

function Field({ label, error, children }: {
  label: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium" style={{ color: 'var(--foreground)' }}>{label}</label>
      {children}
      {error && (
        <p className="text-xs flex gap-1.5" style={{ color: 'var(--foreground)' }}>
          <span className="shrink-0">⚠</span>{error}
        </p>
      )}
    </div>
  );
}

function Btn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className="font-semibold hover:underline" style={{ color: 'var(--foreground)' }}>
      {children}
    </button>
  );
}
