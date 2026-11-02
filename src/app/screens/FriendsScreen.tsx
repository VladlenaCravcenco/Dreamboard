import { occasionText } from '../lib/giftDetails';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { wishes, readInvite, invitePath, type Friend } from '../lib/wishes';
import { User } from '../components/PixelIcons';
import { fieldClass, primaryClass } from '../components/AddDreamModal';
import { toast } from 'sonner';
export default function FriendsScreen() {
  const { user }=useAuth(); const navigate=useNavigate();
  const [friends,setFriends]=useState<Friend[]>([]),[url,setUrl]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(true);
  async function load(){setError('');try{setFriends(await wishes<Friend[]>('wish_friends_list'));}catch(e){setError((e as Error).message);}finally{setLoading(false);}}
  useEffect(()=>{void load();const onFocus=()=>void load();window.addEventListener('focus',onFocus);return()=>window.removeEventListener('focus',onFocus);},[user?.id]);
  const upcoming=friends.filter(f=>f.available&&f.preferences?.occasion&&f.preferences?.occasion_date&&new Date(`${f.preferences.occasion_date}T23:59:59`).getTime()>=Date.now()).sort((a,b)=>a.preferences!.occasion_date!.localeCompare(b.preferences!.occasion_date!));
  return <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
    <div className="flex justify-between items-center gap-4"><h1 className="board-heading">Друзья</h1><Link to="/share" className={primaryClass}>Моя ссылка</Link></div>
    <p className="text-sm text-muted-foreground">Желания близких и ваши секретные идеи подарков.</p>
    <form className="flex flex-wrap gap-2" onSubmit={e=>{e.preventDefault();const token=readInvite(url.trim());if(!token){toast.error('Вставьте личную ссылку Dreamboard, которую прислал друг');return;}navigate(invitePath(token));}}>
      <input aria-label="Ссылка друга" value={url} onChange={e=>setUrl(e.target.value)} placeholder="Вставьте ссылку друга" className={`${fieldClass} flex-1 min-w-0`} required/><button className={primaryClass}>Открыть</button>
    </form>
    {!error&&upcoming.length>0&&<section className="border border-border rounded-2xl p-5 space-y-3"><h2 className="text-lg">Ближайшие поводы</h2>{upcoming.slice(0,5).map(f=><Link key={f.id} to={`/friends/${f.id}`} className="block text-sm underline">{f.name} · {occasionText(f.preferences)}</Link>)}</section>}
    {error?<div role="alert"><p>{error}</p><button className="underline mt-3" onClick={load}>Повторить</button></div>:loading?<p role="status">Загружаем…</p>:friends.length===0?<section className="border border-border rounded-2xl p-8 text-center space-y-3"><User size={36} className="mx-auto"/><h2 className="text-xl">Здесь будут ваши близкие</h2><p className="text-sm text-muted-foreground">Откройте ссылку, которую вам прислал друг, и нажмите «Сохранить друга». Своей ссылкой можно поделиться в ответ.</p></section>:<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{friends.map(f=><Link key={f.id} to={`/friends/${f.id}`} className="bg-card rounded-2xl border border-border p-5 space-y-4"><div className="rounded-full w-14 h-14 bg-foreground text-background grid place-items-center text-xl">{f.name.slice(0,1).toUpperCase()}</div><h2 className="break-words text-lg">{f.name}</h2><p className="text-xs text-muted-foreground">{f.available?`Желаний: ${f.count}`:'Доступ отключён'}</p></Link>)}</div>}
  </main>;
}
