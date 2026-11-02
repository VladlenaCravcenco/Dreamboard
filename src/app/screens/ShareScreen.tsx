import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useDreams } from '../context/DreamContext';
import { wishes, invitePath, type ShareSettings } from '../lib/wishes';
import { fieldClass, primaryClass } from '../components/AddDreamModal';
import { toast } from 'sonner';

export default function ShareScreen() {
  const { user } = useAuth();
  const { dreams } = useDreams();
  const [settings, setSettings] = useState<ShareSettings | null>(null);
  const [name,setName] = useState(user?.name ?? '');
  const [enabled,setEnabled] = useState(false);
  const [future,setFuture] = useState(false);
  const [ids,setIds] = useState<string[]>([]);
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [rotate,setRotate] = useState(false);
  async function load() {
    setLoading(true);setError('');
    try { const s=await wishes<ShareSettings|null>('wish_settings');setSettings(s);if(s){setName(s.display_name);setEnabled(s.enabled);setFuture(s.include_future);setIds(s.dream_ids);} }
    catch(e){setError((e as Error).message);}finally{setLoading(false);}
  }
  useEffect(()=>{void load();},[user?.id]);
  const dirty = !settings || settings.display_name !== name.trim() || settings.enabled !== enabled || settings.include_future !== future || [...settings.dream_ids].sort().join() !== [...ids].sort().join();
  const url = settings ? `${window.location.origin}${invitePath(settings.token)}` : '';
  async function save() {
    setBusy(true);
    try {setSettings(await wishes<ShareSettings>('wish_configure',{p_name:name.trim(),p_enabled:enabled,p_future:future,p_dream_ids:ids}));toast.success('Настройки ссылки сохранены');}
    catch(e){toast.error((e as Error).message);}finally{setBusy(false);}
  }
  return <main className="max-w-xl mx-auto px-4 py-6 space-y-6">
    <Link to="/friends" className="text-sm text-muted-foreground">← Друзья</Link>
    <h1 className="text-3xl">Моя ссылка</h1>
    <p className="text-sm text-muted-foreground">Делитесь желаниями с близкими. Их планы на подарки останутся для вас сюрпризом.</p>
    {loading ? <p role="status">Загружаем…</p> : error ? <div role="alert"><p>{error}</p><button onClick={load} className={fieldClass}>Повторить</button></div> : <>
      <form className="bg-card border border-border rounded-2xl p-5 grid gap-5" onSubmit={e=>{e.preventDefault();void save();}}>
        <label className="dream-create-field">Имя для друзей<input required maxLength={100} value={name} onChange={e=>setName(e.target.value)} className={fieldClass}/></label>
        <label className="flex gap-3 text-sm"><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/>Разрешить доступ по ссылке</label>
        <p className="text-xs text-muted-foreground">Любой человек с этой ссылкой после входа сможет увидеть выбранные желания и сохранить ваш список. Поиск по именам и аккаунтам отсутствует.</p>
        <label className="flex gap-3 text-sm"><input type="checkbox" checked={future} onChange={e=>setFuture(e.target.checked)}/>Все текущие и будущие желания</label>
        {!future && <fieldset className="grid gap-3"><legend className="text-sm mb-3">Какими желаниями поделиться?</legend>{dreams.length===0 ? <p className="text-xs text-muted-foreground">Сначала добавьте мечту на доску.</p> : dreams.map(d=><label className="flex gap-3 text-sm" key={d.id}><input type="checkbox" checked={ids.includes(d.id)} onChange={e=>setIds(e.target.checked ? [...ids,d.id] : ids.filter(id=>id!==d.id))}/>{d.title}</label>)}</fieldset>}
        <p className="text-xs text-muted-foreground">Видны название, фото, описание и бюджет. Личные заметки, шаги и накопления остаются только у вас. Сбывшиеся мечты исчезают из списка друзей.</p>
        <button className={primaryClass} disabled={busy||!name.trim()||!dirty}>{busy?'Сохраняем…':'Сохранить настройки'}</button>
      </form>
      {settings?.enabled && <section className="rounded-2xl border border-border p-5 space-y-3"><label className="dream-create-field">Ваша личная ссылка<input readOnly value={url} className={fieldClass} onFocus={e=>e.target.select()}/></label><button className={primaryClass} disabled={busy||dirty} onClick={async()=>{try{await navigator.clipboard.writeText(url);toast.success('Ссылка скопирована');}catch{toast.error('Выделите и скопируйте ссылку из поля выше');}}}>Скопировать ссылку</button>{dirty&&<p className="text-xs">Сначала сохраните изменения.</p>}<Link to={invitePath(settings.token)} className="block text-sm underline">Посмотреть глазами друга</Link></section>}
      {settings && <div className="text-sm space-y-3">{!rotate ? <button className="underline" onClick={()=>setRotate(true)}>Заменить ссылку и отозвать старый доступ</button> : <><p>Старая ссылка перестанет работать. Друзьям понадобится новая ссылка, их сохранённые отметки для этого списка будут сброшены.</p><button className={primaryClass} disabled={busy||dirty} onClick={async()=>{setBusy(true);try{setSettings(await wishes<ShareSettings>('wish_rotate'));setRotate(false);toast.success('Ссылка заменена');}catch(e){toast.error((e as Error).message);}finally{setBusy(false);}}}>Заменить ссылку</button><button className="ml-4" onClick={()=>setRotate(false)}>Отмена</button></>}</div>}
    </>}
  </main>;
}
