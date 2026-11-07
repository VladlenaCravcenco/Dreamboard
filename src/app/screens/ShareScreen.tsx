import { publicOrigin, publicShareUrl, shareTitle, shareDescription, shareImagePath } from '../lib/shareMetadata.mjs';
import { saveAutomaticLink } from '../lib/automaticLink.mjs';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Link2, Copy, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDreams } from '../context/DreamContext';
import { wishes, namedInvitePath, type ShareSettings } from '../lib/wishes';
import { fieldClass, primaryClass } from '../components/AddDreamModal';
import { toast } from 'sonner';

export default function ShareScreen() {
 const {user}=useAuth();const {dreams}=useDreams();
 const [settings,setSettings]=useState<ShareSettings|null>(null),[name,setName]=useState(user?.name??''),[future,setFuture]=useState(false),[ids,setIds]=useState<string[]>([]);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[saveError,setSaveError]=useState(''),[editing,setEditing]=useState(true),[rotate,setRotate]=useState(false),[copied,setCopied]=useState(false),[manualCopy,setManualCopy]=useState(false);
 const result=useRef<HTMLElement>(null);
 function fill(s:ShareSettings){setName(s.display_name);setFuture(s.include_future);setIds(s.dream_ids);}
 async function load(){setLoading(true);setError('');try{const s=await wishes<ShareSettings|null>('wish_settings');setSettings(s);if(s){fill(s);setEditing(!s.slug);}}catch(e){setError((e as Error).message);}finally{setLoading(false);}}
 useEffect(()=>{void load();},[user?.id]);
 useEffect(()=>{if(!editing&&!loading&&result.current){result.current.focus({preventScroll:true});result.current.scrollIntoView({block:'start',behavior:'auto'});}},[editing,loading]);
 const path=settings?.slug?namedInvitePath(settings.slug):'';
 const url=path?publicShareUrl(path):'';
 async function save(){setBusy(true);setSaveError('');try{const s=await saveAutomaticLink(args=>wishes<ShareSettings>('wish_configure_named',args),{p_name:name.trim(),p_enabled:true,p_future:future,p_dream_ids:ids},settings?.slug);setSettings(s);fill(s);setCopied(false);setEditing(false);}catch(e){setSaveError((e as Error).message);}finally{setBusy(false);}}
 return <main className="share-screen max-w-xl mx-auto px-4 py-6 space-y-6"><Link to="/friends" className="text-sm text-muted-foreground">← Друзья</Link><h1 className="text-3xl">Моя ссылка</h1>
 {loading?<p role="status">Загружаем…</p>:error?<div role="alert"><p>{error}</p><button className={fieldClass} onClick={load}>Повторить</button></div>:<>
 {editing?<form className="bg-card border border-border rounded-2xl p-5 grid gap-5" onSubmit={e=>{e.preventDefault();void save();}}>
 <label className="dream-create-field">Имя для друзей<input required maxLength={100} disabled={busy} value={name} onChange={e=>setName(e.target.value)} className={fieldClass}/></label>
 <label className="flex items-center gap-3 text-sm min-h-11"><input type="checkbox" disabled={busy} checked={future} onChange={e=>setFuture(e.target.checked)}/>Все текущие и будущие желания</label>
 {!future&&<fieldset className="grid gap-2" disabled={busy}><legend className="text-sm mb-2">Какими желаниями поделиться?</legend>{dreams.length?dreams.map(d=><label className="flex items-center gap-3 text-sm min-h-11" key={d.id}><input type="checkbox" checked={ids.includes(d.id)} onChange={e=>setIds(e.target.checked?[...ids,d.id]:ids.filter(id=>id!==d.id))}/>{d.title}</label>):<p className="text-sm text-muted-foreground">Пока нет желаний. Можно включить будущие.</p>}</fieldset>}
 <p className="text-xs text-muted-foreground">Заметки, шаги и накопления видны только вам.</p>
 {saveError&&<p role="alert" className="text-sm text-destructive">{saveError}</p>}
 <button className={primaryClass} disabled={busy||!name.trim()}>{busy?'Сохраняем…':'Сохранить настройки'}</button>
 {settings?.slug&&<button type="button" disabled={busy} className="text-sm min-h-11" onClick={()=>{fill(settings);setEditing(false);setSaveError('');}}>Отмена</button>}
 </form>:settings&&<section ref={result} tabIndex={-1} className="share-result" aria-label={settings.enabled?'Ссылка готова':'Настройки сохранены'}><Link2 size={28} aria-hidden="true"/><h2>{settings.enabled?'Ссылка готова':'Доступ отключён'}</h2>{settings.enabled?<><div className="share-link-preview"><img src={shareImagePath} alt="Dreamboard — подарки, о которых мечтают" width={1200} height={630}/><div><p className="eyebrow">Так выглядит приглашение</p><h3>{shareTitle}</h3><p>{shareDescription}</p></div></div><div className="share-address"><span>{new URL(publicOrigin).host}</span><strong>/u/{settings.slug}</strong></div>{manualCopy&&<input autoFocus aria-label="Ссылка для копирования" readOnly value={url} className="share-copy-field" onFocus={e=>e.target.select()}/>}<button className={primaryClass} onClick={async()=>{try{await navigator.clipboard.writeText(url);setCopied(true);}catch{setManualCopy(true);toast.error('Выделите ссылку в поле и скопируйте вручную');}}}>{copied?<Check size={18}/>:<Copy size={18}/>} {copied?'Скопировано':'Скопировать ссылку'}</button><span role="status" className="sr-only">{copied?'Ссылка скопирована':''}</span></>:<p className="text-sm text-muted-foreground">Ваш список сейчас недоступен по ссылке.</p>}</section>}
 {settings&&editing&&<details className="share-more"><summary>Отозвать старый доступ</summary><p className="text-sm my-3">Ссылка перестанет работать, друзья и их планы для вашего списка будут сброшены. При следующем сохранении новый адрес создастся автоматически.</p>{rotate?<div className="flex flex-wrap gap-3"><button className={primaryClass} disabled={busy} onClick={async()=>{setBusy(true);try{const s=await wishes<ShareSettings>('wish_rotate');setSettings(s);fill(s);setRotate(false);toast.success('Старый доступ отозван');}catch(e){toast.error((e as Error).message);}finally{setBusy(false);}}}>Отозвать доступ</button><button type="button" disabled={busy} onClick={()=>setRotate(false)}>Отмена</button></div>:<button type="button" className="text-sm min-h-11" onClick={()=>setRotate(true)}>Заменить ссылку</button>}</details>}
 </>}
 </main>;
}
