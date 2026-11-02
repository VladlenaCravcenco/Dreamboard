import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Plus, Trash2, ArrowLeft, Check } from '../components/PixelIcons';
import { useDreams } from '../context/DreamContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { fieldClass, primaryClass, readPhoto } from '../components/AddDreamModal';
import { toast } from 'sonner';

const panel = 'bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4';

export default function DetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dreams, loading, updateDreamField, updateDreamProgress, updateDreamNote, addCustomBucketItem, toggleBucketItem, removeCustomBucketItem, updateBucketItem, completeDream, deleteDream } = useDreams();
  const dream = dreams.find(d => d.id === id);
  const [task, setTask] = useState('');
  const [saved, setSaved] = useState('0');
  const [completing, setCompleting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [photo, setPhoto] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { setSaved(String(dream?.saved_amount ?? 0)); }, [dream?.saved_amount]);
  if (!dream) return <div className="max-w-6xl mx-auto p-6"><p>{loading ? 'Загружаем мечту…' : 'Эта мечта больше не на доске.'}</p><Link className="underline" to="/">Вернуться к мечтам</Link></div>;
  const goal = dream.price ?? 0;
  const percent = goal > 0 ? Math.min(100, Math.max(0, (dream.saved_amount ?? 0) / goal * 100)) : 0;
  const checked = dream.bucketItems.filter(item => item.checked).length;
  async function upload(file: File | undefined, completion = false) {
    if (!file) return;
    setBusy(true);
    try { const image = await readPhoto(file); if (completion) setPhoto(image); else await updateDreamField(id!, 'image', image); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Не удалось загрузить фото'); }
    finally { setBusy(false); }
  }
  return <main className="max-w-6xl mx-auto px-4 py-6 pb-16">
    <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-5"><ArrowLeft size={16}/>Все мечты</Link>
    <h1 className="text-4xl break-words mb-6" style={{ fontFamily: 'var(--font-machine)' }}>{dream.title}</h1>
    <div className="grid md:grid-cols-[0.85fr_1.15fr] gap-6 items-start">
      <div className="space-y-5">
        <div className="rounded-2xl overflow-hidden bg-muted"><img src={dream.image || '/dream-placeholder.svg'} alt={dream.title} className="w-full aspect-[4/3] object-cover"/></div>
        <label className="block text-sm space-y-2"><span>Изменить фото</span><input type="file" accept="image/*" disabled={busy} onChange={e => void upload(e.target.files?.[0])} className={fieldClass}/></label>
        <section className={panel}>
          <h2 className="text-xl">О мечте</h2>
          <label className="block text-sm space-y-2"><span>Название</span><input key={`title-${dream.id}`} defaultValue={dream.title} maxLength={160} className={fieldClass} onBlur={e => { const value = e.target.value.trim(); if (value) void updateDreamField(id!, 'title', value); else e.target.value = dream.title; }}/></label>
          <label className="block text-sm space-y-2"><span>Описание</span><textarea key={`description-${dream.id}`} defaultValue={dream.description} rows={3} placeholder="Почему вы хотите это осуществить?" className={fieldClass} onBlur={e => void updateDreamField(id!, 'description', e.target.value)}/></label>
          <p className="text-xs text-muted-foreground">Изменения сохраняются, когда вы выходите из поля.</p>
        </section>
      </div>
      <div className="space-y-5">
        <section className={panel}>
          <div className="flex justify-between items-center"><h2 className="text-xl">Шаги к мечте</h2><span className="text-sm text-muted-foreground">{checked} / {dream.bucketItems.length}</span></div>
          {!dream.bucketItems.length && <p className="text-sm text-muted-foreground">Добавьте первый маленький шаг. Или оставьте мечту без плана — это тоже нормально.</p>}
          <ul className="space-y-2">{dream.bucketItems.map(item => <li key={item.id} className="flex items-center gap-2">
            <input type="checkbox" checked={item.checked} onChange={() => toggleBucketItem(id!, item.id)} aria-label={`Выполнено: ${item.text}`} className="w-5 h-5 accent-primary shrink-0"/>
            <input aria-label="Название шага" defaultValue={item.text} onBlur={e => { if (e.target.value.trim()) updateBucketItem(id!, item.id, e.target.value.trim()); else e.target.value = item.text; }} className={`min-w-0 flex-1 bg-transparent py-2 text-sm ${item.checked ? 'line-through text-muted-foreground' : ''}`}/>
            <button aria-label={`Удалить шаг: ${item.text}`} onClick={() => removeCustomBucketItem(id!, item.id)} className="p-2 text-muted-foreground"><Trash2 size={16}/></button>
          </li>)}</ul>
          <form className="flex gap-2" onSubmit={e => { e.preventDefault(); if (task.trim()) { addCustomBucketItem(id!, task.trim()); setTask(''); } }}><input value={task} onChange={e => setTask(e.target.value)} placeholder="Например, выбрать даты" aria-label="Новый шаг" className={fieldClass}/><button aria-label="Добавить шаг" disabled={!task.trim()} className={primaryClass}><Plus size={18}/></button></form>
        </section>
        <details className={panel} open={goal > 0 ? true : undefined}>
          <summary className="cursor-pointer text-lg">Бюджет <span className="text-sm text-muted-foreground">· необязательно</span></summary>
          <p className="text-sm text-muted-foreground">Записывайте, сколько вы отложили самостоятельно.</p>
          <label className="block text-sm space-y-2"><span>Нужно накопить, $</span><input type="number" min="0" max="9999999999" step="0.01" defaultValue={dream.price ?? ''} placeholder="Без бюджета" className={fieldClass} onBlur={e => { if (!e.target.validity.valid) return; void updateDreamField(id!, 'price', e.target.value === '' ? undefined : Number(e.target.value)); }}/></label>
          {goal > 0 && <><form className="space-y-3" onSubmit={e => { e.preventDefault(); const amount = Number(saved); if (!Number.isFinite(amount) || amount < 0) return; updateDreamProgress(id!, amount); }}><label className="block text-sm space-y-2"><span>Уже накоплено, $</span><input type="number" required min="0" max="9999999999" step="0.01" value={saved} onChange={e => setSaved(e.target.value)} className={fieldClass}/></label><button className={primaryClass}>Сохранить сумму</button></form><div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${percent}%` }}/></div><p className="text-sm text-muted-foreground">{Math.round(percent)}% · Осталось ${Math.max(0, goal - (dream.saved_amount ?? 0)).toLocaleString()}</p></>}
        </details>
        <section className={panel}><h2 className="text-xl">Заметки</h2><textarea aria-label="Заметки к мечте" defaultValue={dream.note ?? ''} key={`note-${dream.id}`} rows={3} placeholder="Идеи, ссылки и то, что хочется запомнить…" className={fieldClass} onBlur={e => updateDreamNote(id!, e.target.value)}/></section>
        <section className={panel}><h2 className="text-xl">Мечта сбылась?</h2><p className="text-sm text-muted-foreground">Вы решаете, когда она исполнена. Фото, выполненные шаги и накопления необязательны.</p><button onClick={() => setCompleting(true)} className={`${primaryClass} w-full flex items-center justify-center gap-2`}><Check size={18}/>Мечта сбылась</button></section>
        <button onClick={() => setDeleting(true)} className="text-sm text-destructive p-2">Удалить мечту</button>
      </div>
    </div>
    <Dialog open={completing} onOpenChange={open => { if (!busy) setCompleting(open); }}><DialogContent><DialogHeader><DialogTitle>Сохранить воспоминание</DialogTitle><DialogDescription>«{dream.title}» появится в воспоминаниях. Можно добавить фото момента или оставить обложку.</DialogDescription></DialogHeader>
      <img src={photo || dream.image || '/dream-placeholder.svg'} alt="Фото воспоминания" className="w-full h-48 object-cover rounded-xl"/>
      <label className="text-sm space-y-2"><span>Фото момента · необязательно</span><input type="file" accept="image/*" disabled={busy} onChange={e => void upload(e.target.files?.[0], true)} className={fieldClass}/></label>
      <button disabled={busy} onClick={() => { completeDream(id!, photo || dream.image); navigate('/completed'); }} className={primaryClass}>{busy ? 'Готовим фото…' : 'Сохранить в воспоминания'}</button>
    </DialogContent></Dialog>
    <Dialog open={deleting} onOpenChange={setDeleting}><DialogContent><DialogHeader><DialogTitle>Удалить «{dream.title}»?</DialogTitle><DialogDescription>Мечта, её шаги и заметки будут удалены. Это действие нельзя отменить.</DialogDescription></DialogHeader><div className="flex gap-3"><button className={fieldClass} onClick={() => setDeleting(false)}>Оставить</button><button disabled={busy} className={`${primaryClass} bg-destructive`} onClick={async () => { setBusy(true); try { if (await deleteDream(id!)) navigate('/'); } finally { setBusy(false); } }}>{busy ? 'Удаляем…' : 'Удалить'}</button></div></DialogContent></Dialog>
  </main>;
}
