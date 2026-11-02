import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { fieldClass, primaryClass } from '../components/AddDreamModal';

export default function ResetPasswordScreen() {
  const { user, loading, changePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (loading) return <p className="p-8">Проверяем ссылку…</p>;
  if (!user) return <div className="max-w-md mx-auto p-8"><p>Ссылка недействительна или устарела. Запросите новое письмо для восстановления.</p><Link to="/auth" className="underline">Перейти ко входу</Link></div>;
  return <form className="max-w-md mx-auto p-6 mt-12 space-y-4" onSubmit={async e => { e.preventDefault(); if (password !== confirmation) { setError('Пароли не совпадают'); return; } setBusy(true); setError(''); try { await changePassword(password); navigate('/', { replace: true }); } catch { setError('Не удалось изменить пароль. Попробуйте запросить новую ссылку.'); } finally { setBusy(false); } }}><h1 className="text-3xl">Новый пароль</h1><label className="block space-y-2"><span>Пароль · от 8 символов</span><input type="password" autoComplete="new-password" required minLength={8} className={fieldClass} value={password} onChange={e => setPassword(e.target.value)}/></label><label className="block space-y-2"><span>Повторите пароль</span><input type="password" autoComplete="new-password" required className={fieldClass} value={confirmation} onChange={e => setConfirmation(e.target.value)}/></label>{error && <p role="alert" className="text-destructive">{error}</p>}<button className={primaryClass} disabled={busy}>{busy ? 'Сохраняем…' : 'Сохранить пароль'}</button></form>;
}
