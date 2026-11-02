import { useEffect, useState } from 'react';
import { wishes } from '../lib/wishes';
import { emptyDetails, giftUrl, type GiftDetails } from '../lib/giftDetails';
import { fieldClass, primaryClass } from './AddDreamModal';
import { toast } from 'sonner';
export default function GiftDetailsEditor({dreamId}:{dreamId:string}) {
  const [value,setValue]=useState<GiftDetails>(emptyDetails),[ready,setReady]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  async function load(){setError('');try{setValue({...emptyDetails,...await wishes<GiftDetails>('wish_own_details',{p_dream_id:dreamId})});setReady(true);}catch(e){setError((e as Error).message);}}
  useEffect(()=>{void load();},[dreamId]);
  return <section className="bg-card border border-border rounded-2xl p-5 sm:p-6 space-y-4"><h2 className="text-xl">Подсказки для подарка</h2>{error?<div role="alert"><p className="text-sm">{error}</p><button className="underline text-sm" onClick={load}>Повторить</button></div>:!ready?<p role="status">Загружаем…</p>:<form className="grid gap-4" onSubmit={async e=>{e.preventDefault();if(value.product_url&&!giftUrl(value.product_url)){toast.error('Укажите полную ссылку с https://');return;}setBusy(true);try{await wishes('wish_save_details',{p_dream_id:dreamId,p_url:value.product_url,p_size:value.size,p_color:value.color,p_similar:value.allow_similar,p_priority:value.priority});toast.success('Детали подарка сохранены');}catch(e){toast.error((e as Error).message);}finally{setBusy(false);}}}>
    <label className="dream-create-field">Ссылка на товар<input type="url" maxLength={2000} placeholder="https://…" className={fieldClass} value={value.product_url} onChange={e=>setValue({...value,product_url:e.target.value})}/></label>
    <div className="grid grid-cols-2 gap-3"><label className="dream-create-field">Размер<input maxLength={100} placeholder="M / 38 / 50 мл" className={fieldClass} value={value.size} onChange={e=>setValue({...value,size:e.target.value})}/></label><label className="dream-create-field">Цвет<input maxLength={100} placeholder="Например, чёрный" className={fieldClass} value={value.color} onChange={e=>setValue({...value,color:e.target.value})}/></label></div>
    <label className="flex gap-3 text-sm"><input type="checkbox" checked={value.allow_similar} onChange={e=>setValue({...value,allow_similar:e.target.checked})}/>Можно похожее</label>
    <label className="flex gap-3 text-sm"><input type="checkbox" checked={value.priority} onChange={e=>setValue({...value,priority:e.target.checked})}/>Особенно хочу · до трёх желаний</label>
    <p className="text-xs text-muted-foreground">Эти детали увидят друзья, если вы поделитесь желанием.</p><button className={primaryClass} disabled={busy}>{busy?'Сохраняем…':'Сохранить детали'}</button>
  </form>}</section>;
}
