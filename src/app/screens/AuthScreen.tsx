import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

type Mode = 'signin' | 'signup' | 'forgot';

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
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

  if (!loading && user) return <Navigate to="/" replace />;

  if (loading) {
    return (
      <Centered>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#c9a84c', borderTopColor: 'transparent' }} />
        <p style={{ fontFamily: 'Cormorant Garamond, serif', color: '#1a1a2e', opacity: 0.5 }}>
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
            <div className="text-6xl mb-4">📬</div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, color: '#1a1a2e' }}>
              Проверьте почту
            </h2>
          </div>

          <div className="rounded-2xl p-8 shadow-xl text-center space-y-4"
            style={{ background: 'rgba(255,255,255,0.94)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <p style={{ color: '#1a1a2e' }}>
              Мы отправили письмо с подтверждением на
            </p>
            <p className="font-semibold text-lg" style={{ color: '#1a1a2e' }}>
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
                style={{ color: '#c9a84c' }}
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
                style={{ color: '#c9a84c' }}
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
          <h1 className="text-6xl tracking-tight mb-2"
            style={{ fontFamily: 'Cormorant Garamond, serif', color: '#1a1a2e' }}>
            Dreamboard
          </h1>
          <p className="text-sm" style={{ color: 'rgba(26,26,46,0.45)' }}>
            {mode === 'signin' && 'Войдите в свой аккаунт'}
            {mode === 'signup' && 'Создайте свой Dreamboard'}
            {mode === 'forgot' && 'Восстановление пароля'}
          </p>
        </div>

        {/* Карточка */}
        <div className="rounded-2xl shadow-xl p-8"
          style={{ background: 'rgba(255,255,255,0.94)', border: '1px solid rgba(0,0,0,0.06)' }}>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Общая ошибка */}
            {errors.banner && (
              <div className="rounded-xl px-4 py-3 text-sm flex gap-2"
                style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
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
              style={{ background: '#c9a84c', color: '#1a1a2e' }}>
              {submitting
                ? 'Подождите…'
                : mode === 'signin' ? 'Войти'
                : mode === 'signup' ? 'Зарегистрироваться'
                : 'Отправить ссылку'}
            </button>
          </form>

          {/* Переключатели */}
          <div className="mt-6 text-center space-y-2 text-sm" style={{ color: 'rgba(0,0,0,0.4)' }}>
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
            <p className="text-xs" style={{ color: 'rgba(0,0,0,0.22)' }}>
              🔒 Ваши данные надёжно хранятся и синхронизируются
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
      style={{ background: 'linear-gradient(135deg, #f5f0e8 0%, #ede8de 100%)' }}>
      {children}
    </div>
  );
}

function cls(hasError: boolean) {
  return [
    'w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-all focus:ring-2',
    hasError
      ? 'border-red-400 bg-red-50 focus:ring-red-100 text-red-900'
      : 'border-gray-200 bg-white focus:ring-amber-100 focus:border-amber-400',
  ].join(' ');
}

function Field({ label, error, children }: {
  label: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium" style={{ color: '#1a1a2e' }}>{label}</label>
      {children}
      {error && (
        <p className="text-xs flex gap-1.5" style={{ color: '#b91c1c' }}>
          <span className="shrink-0">⚠</span>{error}
        </p>
      )}
    </div>
  );
}

function Btn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className="font-semibold hover:underline" style={{ color: '#1a1a2e' }}>
      {children}
    </button>
  );
}
