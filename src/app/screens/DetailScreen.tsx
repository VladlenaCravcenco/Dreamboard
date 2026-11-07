import DreamBudget from '../components/DreamBudget';
import { Camera } from 'lucide-react';
import type { Category } from '../types';
import GiftDetailsEditor from '../components/GiftDetailsEditor';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Plus, Trash2, ArrowLeft, Check } from '../components/PixelIcons';
import { useDreams } from '../context/DreamContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { fieldClass, primaryClass, readPhoto, categoryLabels } from '../components/AddDreamModal';
import { toast } from 'sonner';

const panel = 'detail-panel';

export default function DetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dreams, loading, updateDreamField, updateDreamProgress, addCustomBucketItem, toggleBucketItem, removeCustomBucketItem, updateBucketItem, completeDream, deleteDream } = useDreams();
  const dream = dreams.find(d => d.id === id);
  const [task, setTask] = useState('');
  const [completing, setCompleting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [photo, setPhoto] = useState('');
  const [busy, setBusy] = useState(false);
  if (!dream) return <div className="max-w-6xl mx-auto p-6"><p>{loading ? 'Загружаем мечту…' : 'Эта мечта больше не на доске.'}</p><Link className="underline" to="/">Вернуться к мечтам</Link></div>;
  const checked = dream.bucketItems.filter(item => item.checked).length;
  async function upload(file: File | undefined, completion = false) {
    if (!file) return;
    setBusy(true);
    try { const image = await readPhoto(file); if (completion) setPhoto(image); else await updateDreamField(id!, 'image', image); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Не удалось загрузить фото'); }
    finally { setBusy(false); }
  }
  return <main className="detail-screen max-w-6xl mx-auto px-4 py-6 pb-16">
    <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-5"><ArrowLeft size={16}/>Все мечты</Link>
    <div className="detail-layout">
      <div className="detail-column">
        <div className="detail-cover"><img src={dream.image || '/dream-placeholder.svg'} alt={dream.title}/><label className="detail-photo-edit"><Camera size={18}/><span className="sr-only">Изменить фото</span><input type="file" accept="image/*" disabled={busy} className="sr-only" onChange={e=>void upload(e.target.files?.[0])}/></label></div>
        <section className="detail-basics">
          <h1 className="sr-only">{dream.title}</h1>
          <label className="dream-create-field"><span className="sr-only">Название мечты</span><textarea rows={2} key={`title-${dream.id}`} defaultValue={dream.title} maxLength={160} className="detail-title-input" onBlur={e=>{const value=e.target.value.trim();if(value)void updateDreamField(id!,'title',value);else e.target.value=dream.title;}}/></label>
          <fieldset className="detail-categories"><legend className="sr-only">Категория</legend>{Object.entries(categoryLabels).map(([value,label])=><button type="button" key={value} aria-pressed={dream.category===value} onClick={async()=>{await updateDreamField(id!,'category',value as Category);await updateDreamField(id!,'categoryLabel',label);}}>{label}</button>)}</fieldset>
          <label className="dream-create-field"><span>Описание мечты</span><textarea key={`description-${dream.id}`} defaultValue={dream.description} rows={2} placeholder="Добавить описание…" className={fieldClass} onBlur={e=>void updateDreamField(id!,'description',e.target.value)}/></label>
        </section>
      </div>
      <div className="detail-column">
        <GiftDetailsEditor key={dream.id} dreamId={dream.id}/>
        <section className={panel}>
          <div className="flex justify-between items-center"><h2 className="text-xl">Шаги</h2><span className="text-sm text-muted-foreground">{checked} / {dream.bucketItems.length}</span></div>
          {!dream.bucketItems.length && <p className="text-sm text-muted-foreground">Что поможет исполнить мечту?</p>}
          <ul className="task-list space-y-2">{dream.bucketItems.map(item => <li key={item.id} className="flex items-center gap-2">
            <label className="task-check"><input type="checkbox" checked={item.checked} onChange={() => toggleBucketItem(id!, item.id)} aria-label={`Выполнено: ${item.text}`} className="w-5 h-5 accent-primary shrink-0"/></label>
            <input aria-label="Название шага" defaultValue={item.text} onBlur={e => { if (e.target.value.trim()) updateBucketItem(id!, item.id, e.target.value.trim()); else e.target.value = item.text; }} className={`min-w-0 flex-1 bg-transparent py-2 text-sm ${item.checked ? 'line-through text-muted-foreground' : ''}`}/>
            <button aria-label={`Удалить шаг: ${item.text}`} onClick={() => removeCustomBucketItem(id!, item.id)} className="p-2 text-muted-foreground"><Trash2 size={16}/></button>
          </li>)}</ul>
          <form className="flex gap-2" onSubmit={e => { e.preventDefault(); if (task.trim()) { addCustomBucketItem(id!, task.trim()); setTask(''); } }}><input value={task} onChange={e => setTask(e.target.value)} placeholder="Добавить шаг…" aria-label="Новый шаг" className={fieldClass}/><button aria-label="Добавить шаг" disabled={!task.trim()} className={primaryClass}><Plus size={18}/></button></form>
        </section>
        <DreamBudget key={dream.id} goal={dream.price??0} saved={dream.saved_amount??0} onSave={(goal,amount)=>{void updateDreamField(id!,'price',goal);updateDreamProgress(id!,amount);}}/>
        <div className="detail-final-actions"><button onClick={()=>setCompleting(true)} className="dream-complete-button"><Check size={18}/><span>Мечта сбылась</span></button><button onClick={()=>setDeleting(true)} className="dream-delete-button" aria-label="Удалить мечту" title="Удалить мечту"><Trash2 size={20}/><span className="mobile-delete-label">Удалить мечту</span></button></div>
      </div>
    </div>
    <Dialog open={completing} onOpenChange={open => { if (!busy) setCompleting(open); }}><DialogContent><DialogHeader><DialogTitle>Сохранить воспоминание</DialogTitle><DialogDescription>«{dream.title}» появится в воспоминаниях. Можно добавить фото момента или оставить обложку.</DialogDescription></DialogHeader>
      <img src={photo || dream.image || '/dream-placeholder.svg'} alt="Фото воспоминания" className="w-full h-48 object-cover rounded-xl"/>
      <label className="text-sm space-y-2"><span>Фото момента · необязательно</span><input type="file" accept="image/*" disabled={busy} onChange={e => void upload(e.target.files?.[0], true)} className={fieldClass}/></label>
      <button disabled={busy} onClick={() => { completeDream(id!, photo || dream.image); navigate('/completed', { state: { celebrateDream: id } }); }} className={primaryClass}>{busy ? 'Готовим фото…' : 'Сохранить в воспоминания'}</button>
    </DialogContent></Dialog>
    <Dialog open={deleting} onOpenChange={setDeleting}><DialogContent><DialogHeader><DialogTitle>Удалить «{dream.title}»?</DialogTitle><DialogDescription>Мечта, её шаги и заметки будут удалены. Это действие нельзя отменить.</DialogDescription></DialogHeader><div className="flex gap-3"><button className={fieldClass} onClick={() => setDeleting(false)}>Оставить</button><button disabled={busy} className={`${primaryClass} bg-destructive`} onClick={async () => { setBusy(true); try { if (await deleteDream(id!)) navigate('/'); } finally { setBusy(false); } }}>{busy ? 'Удаляем…' : 'Удалить'}</button></div></DialogContent></Dialog>
  </main>;
}
