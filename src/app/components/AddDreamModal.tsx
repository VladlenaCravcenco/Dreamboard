import { supabase } from '../lib/supabase';
import { giftUrl } from '../lib/giftDetails';
import { useId, useState } from 'react';
import { useDreams } from '../context/DreamContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Category } from '../types';
import { compressImage } from '../utils/imageCompression';
import { toast } from 'sonner';

export const categoryLabels: Record<Category, string> = { travel: 'Путешествия', material: 'Вещи', adventure: 'Впечатления', personal: 'Развитие', 'style-health': 'Забота о себе' };
const categoryHints: Record<Category, { title: string; question: string; description: string }> = {
  travel: { title: 'Провести неделю в Японии', question: 'Как вы представляете эту поездку?', description: 'Куда, с кем и что хочется увидеть…' },
  material: { title: 'Купить плёночный фотоаппарат', question: 'Какую именно вещь хочется?', description: 'Модель, цвет, размер или ссылка на магазин…' },
  adventure: { title: 'Попасть на концерт любимой группы', question: 'Что хочется испытать?', description: 'Где это будет и с кем хочется разделить момент…' },
  personal: { title: 'Научиться играть на пианино', question: 'Чему хочется научиться?', description: 'Какой результат вас порадует и с чего можно начать…' },
  'style-health': { title: 'Устроить себе день в спа', question: 'Что поможет почувствовать себя лучше?', description: 'Отдых, движение или маленький ритуал для себя…' },
};
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
  const photoId = useId();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('personal');
  const [description, setDescription] = useState('');
  const [productUrl,setProductUrl] = useState('');
  const [importing,setImporting] = useState(false);
  const [preview,setPreview] = useState<{title:string;image:string}|null>(null);
  const [price, setPrice] = useState('');
  const [photo, setPhoto] = useState('');
  const [busy, setBusy] = useState(false);
  const hints = categoryHints[category];
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    if (productUrl && !giftUrl(productUrl)) { toast.error('Проверьте ссылку на товар'); return; }
    setBusy(true);
    try {
      const created = await addDream({ title: title.trim(), category, categoryLabel: categoryLabels[category], product_url: productUrl.trim(), description: description.trim(), price: price ? Number(price) : undefined, image: photo || '/dream-placeholder.svg', bucketItems: [], tag: '' });
      if (created) { setTitle(''); setCategory('personal'); setDescription(''); setPrice(''); setPhoto(''); setProductUrl(''); setPreview(null); onClose(); }
    } finally { setBusy(false); }
  }
  return <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !busy && !importing) onClose(); }}>
    <DialogContent className="dream-create-dialog max-h-[90dvh] overflow-y-auto sm:max-w-lg" onOpenAutoFocus={event => event.preventDefault()}>
      <DialogHeader className="text-left pr-6 gap-2"><DialogTitle>Новая мечта</DialogTitle><DialogDescription>Что хочется осуществить? Незавершённая форма сохранится, пока вы на этой странице.</DialogDescription></DialogHeader>
      <form onSubmit={submit} className="dream-create-form">
        <label className="dream-create-field"><span>О чём вы мечтаете?</span><input required maxLength={160} value={title} onChange={e => setTitle(e.target.value)} placeholder={hints.title} className={fieldClass}/></label>
        <details className="dream-extra"><summary>Добавить по ссылке на товар</summary><div className="grid gap-3 mt-3">
          <input aria-label="Ссылка на товар" disabled={importing||busy} type="url" maxLength={2000} value={productUrl} onChange={e=>{setProductUrl(e.target.value);setPreview(null);}} placeholder="https://магазин/товар" className={fieldClass}/>
          <button type="button" disabled={importing||busy||!productUrl.trim()} className={primaryClass} onClick={async()=>{setImporting(true);setPreview(null);try{const {data:{session}}=await supabase.auth.getSession();if(!session)throw new Error('Войдите в аккаунт');const response=await fetch('/api/product-preview',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({url:productUrl.trim()}),signal:AbortSignal.timeout(25000)});const result=await response.json().catch(()=>({error:'Автозаполнение доступно после публикации на Vercel. Можно заполнить вручную.'}));if(!response.ok||result.error)throw new Error(result.error||'Не удалось получить превью');setPreview(result);}catch(e){toast.error((e as Error).message);}finally{setImporting(false);}}}>{importing?'Получаем название и фото…':'Найти название и фото'}</button>
          {preview&&<div className="border border-border rounded-xl p-3 space-y-3">{preview.image&&<img src={preview.image} alt="Фото из магазина" referrerPolicy="no-referrer" className="h-24 w-full object-contain"/>}<p className="text-sm">{preview.title||'Название не найдено'}</p><button type="button" className={primaryClass} onClick={()=>{if(preview.title)setTitle(preview.title);if(preview.image)setPhoto(preview.image);setCategory('material');setPreview(null);}}>Использовать название и фото</button></div>}
          <p className="text-xs text-muted-foreground">Ссылка сохранится даже без автозаполнения. Не все магазины разрешают получать фото.</p>
        </div></details>
        <fieldset className="dream-category-field">
          <legend>Категория</legend>
          <div className="dream-category-options">
            {Object.entries(categoryLabels).map(([value, label]) => <label key={value} className="dream-category-choice">
              <input type="radio" name="dream-category" value={value} checked={category === value} onChange={() => setCategory(value as Category)}/>
              <span>{label}</span>
            </label>)}
          </div>
        </fieldset>
        <div className="dream-photo-row">
          {photo && <img src={photo} alt="Обложка мечты" className="h-14 w-14 shrink-0 object-cover rounded-lg"/>}
          <div className="min-w-0 flex-1"><span className="text-sm">Фото</span><p className="text-xs text-muted-foreground mt-1">Можно добавить позже</p></div>
          <label htmlFor={photoId} className="dream-photo-button">{photo ? 'Заменить' : '+ Добавить'}<input id={photoId} type="file" accept="image/*" disabled={busy} className="sr-only" onChange={async e => { const file = e.target.files?.[0]; if (!file) return; setBusy(true); try { setPhoto(await readPhoto(file)); } catch (err) { toast.error(err instanceof Error ? err.message : 'Не удалось загрузить фото'); } finally { setBusy(false); } e.target.value = ''; }}/></label>
        </div>
        <details className="dream-extra"><summary className="cursor-pointer text-sm">Описание и бюджет</summary><div className="grid gap-4 mt-4">
          <label className="dream-create-field"><span>{hints.question}</span><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={hints.description} className={fieldClass} rows={3}/></label>
          <label className="dream-create-field"><span>Бюджет, $</span><input type="number" inputMode="decimal" min="0" max="9999999999" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="Можно оставить пустым" className={fieldClass}/></label>
        </div></details>
        <button disabled={busy || importing || !title.trim()} className={`${primaryClass} w-full`}>{busy ? 'Сохраняем…' : 'Добавить мечту'}</button>
      </form>
    </DialogContent>
  </Dialog>;
}
