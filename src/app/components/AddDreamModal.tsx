import { useState } from 'react';
import { useDreams } from '../context/DreamContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Category } from '../types';
import { compressImage } from '../utils/imageCompression';
import { toast } from 'sonner';

export const categoryLabels: Record<Category, string> = { travel: 'Путешествия', adventure: 'Приключения', personal: 'Личное', 'style-health': 'Забота о себе', material: 'Покупки' };
export const fieldClass = 'w-full rounded-xl border border-border bg-background px-3 py-3 text-sm';
export const primaryClass = 'rounded-xl bg-primary text-primary-foreground px-5 py-3 text-sm font-medium disabled:opacity-50';

export async function readPhoto(file: File) {
  if (!file.type.startsWith('image/')) throw new Error('Выберите изображение');
  if (file.size > 15 * 1024 * 1024) throw new Error('Выберите фото меньше 15 МБ');
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Не удалось прочитать фото'));
    reader.readAsDataURL(file);
  });
  return compressImage(data, 1000, 0.75);
}

export default function AddDreamModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addDream } = useDreams();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('personal');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [photo, setPhoto] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      const created = await addDream({ title: title.trim(), category, categoryLabel: categoryLabels[category], description: description.trim(), price: price ? Number(price) : undefined, image: photo || '/dream-placeholder.svg', bucketItems: [], tag: '' });
      if (created) { setTitle(''); setDescription(''); setPrice(''); setPhoto(''); onClose(); }
    } finally { setBusy(false); }
  }
  return <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
      <DialogHeader><DialogTitle>Новая мечта</DialogTitle><DialogDescription>Начните с названия. Всё остальное можно добавить позже.</DialogDescription></DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm space-y-2"><span>О чём вы мечтаете?</span><input autoFocus required maxLength={160} value={title} onChange={e => setTitle(e.target.value)} placeholder="Увидеть северное сияние" className={fieldClass}/></label>
        <label className="block text-sm space-y-2"><span>Категория</span><select value={category} onChange={e => setCategory(e.target.value as Category)} className={fieldClass}>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="block text-sm space-y-2"><span>Фото · необязательно</span><input type="file" accept="image/*" disabled={busy} className={fieldClass} onChange={async e => { const file = e.target.files?.[0]; if (!file) return; setBusy(true); try { setPhoto(await readPhoto(file)); } catch (err) { toast.error(err instanceof Error ? err.message : 'Не удалось загрузить фото'); } finally { setBusy(false); } }}/></label>
        {photo && <img src={photo} alt="Обложка мечты" className="h-32 w-full object-cover rounded-xl"/>}
        <details className="rounded-xl border border-border p-4"><summary className="cursor-pointer text-sm">Описание и бюджет · необязательно</summary><div className="space-y-4 mt-4">
          <label className="block text-sm space-y-2"><span>Почему это важно для вас?</span><textarea value={description} onChange={e => setDescription(e.target.value)} className={fieldClass} rows={3}/></label>
          <label className="block text-sm space-y-2"><span>Бюджет, $</span><input type="number" min="0" max="9999999999" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="Можно оставить пустым" className={fieldClass}/></label>
        </div></details>
        <button disabled={busy || !title.trim()} className={`${primaryClass} w-full`}>{busy ? 'Сохраняем…' : 'Добавить мечту'}</button>
      </form>
    </DialogContent>
  </Dialog>;
}
