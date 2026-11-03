import BirthdayEditor from '../components/BirthdayEditor';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { fieldClass, primaryClass } from '../components/AddDreamModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { toast } from 'sonner';

export default function ProfileScreen() {
  const { user, updateName, changePassword, signOut, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? '');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  async function action(work: () => Promise<void>, message?: string) {
    setBusy(true);
    try { await work(); if (message) toast.success(message); }
    catch { toast.error('Не удалось выполнить действие. Проверьте подключение и попробуйте ещё раз.'); }
    finally { setBusy(false); }
  }
  return <main className="max-w-xl mx-auto px-4 py-6 space-y-6"><h1 className="text-4xl" style={{ fontFamily: 'var(--font-machine)' }}>Мой аккаунт</h1>
    <form className="bg-card border border-border rounded-2xl p-6 space-y-4" onSubmit={e => { e.preventDefault(); void action(() => updateName(name.trim()), 'Имя сохранено'); }}><p className="text-sm text-muted-foreground break-all">{user?.email}</p><label className="block text-sm space-y-2"><span>Ваше имя</span><input required maxLength={100} value={name} onChange={e => setName(e.target.value)} className={fieldClass}/></label><button disabled={busy || !name.trim()} className={primaryClass}>Сохранить имя</button></form>
    <BirthdayEditor key={user?.id}/>
    <details className="bg-card border border-border rounded-2xl p-6"><summary className="cursor-pointer">Изменить пароль</summary><form className="mt-4 space-y-4" onSubmit={e => { e.preventDefault(); if (password !== confirmation) { toast.error('Пароли не совпадают'); return; } void action(async () => { await changePassword(password); setPassword(''); setConfirmation(''); }, 'Пароль изменён'); }}><label className="block text-sm space-y-2"><span>Новый пароль · от 8 символов</span><input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className={fieldClass}/></label><label className="block text-sm space-y-2"><span>Повторите пароль</span><input required type="password" autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} className={fieldClass}/></label><button disabled={busy} className={primaryClass}>Сохранить пароль</button></form></details>
    <button disabled={busy} className={`${fieldClass} text-left`} onClick={() => void action(async () => { await signOut(); navigate('/auth'); })}>Выйти из аккаунта</button>
    <button disabled={busy} className="text-destructive text-sm p-2" onClick={() => setDeleting(true)}>Удалить аккаунт</button>
    <Dialog open={deleting} onOpenChange={setDeleting}><DialogContent><DialogHeader><DialogTitle>Удалить аккаунт?</DialogTitle><DialogDescription>Все ваши мечты и воспоминания будут удалены без возможности восстановления.</DialogDescription></DialogHeader><button disabled={busy} className={`${primaryClass} bg-destructive`} onClick={() => void action(async () => { await deleteAccount(); navigate('/auth'); })}>{busy ? 'Удаляем…' : 'Удалить аккаунт и данные'}</button><button disabled={busy} className={fieldClass} onClick={() => setDeleting(false)}>Оставить аккаунт</button></DialogContent></Dialog>
  </main>;
}
