import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { wishes, invitePath, type Board } from '../lib/wishes';
import { categoryLabels, primaryClass } from '../components/AddDreamModal';
import { Check, Spark } from '../components/PixelIcons';
import { Category } from '../types';
import { toast } from 'sonner';

export default function FriendBoardScreen(){
  const {token,id}=useParams();const {user,loading:authLoading}=useAuth();const navigate=useNavigate();
  const [board,setBoard]=useState<Board|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[onlyMarked,setOnlyMarked]=useState(false),[remove,setRemove]=useState(false);
  useEffect(()=>{
    if(!user){setBoard(null);return;}
    let active=true, running=false;
    async function load(){if(running)return;running=true;try{const b=await wishes<Board>('wish_board',token?{p_token:token}:{p_link_id:id});if(active){setBoard(b);setError('');}}catch(e){if(active){setBoard(null);setError((e as Error).message);}}finally{running=false;if(active)setLoading(false);}}
    setBoard(null);setLoading(true);void load();
    const refresh=()=>{if(document.visibilityState==='visible')void load();};
    const timer=window.setInterval(refresh,15000);window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);
    return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);};
  },[token,id,user?.id]);
  if(authLoading)return <main className="p-8" role="status">Загружаем…</main>;
  if(!user)return <main className="max-w-md mx-auto px-6 py-16 space-y-6"><Spark size={40}/><h1 className="text-3xl">Вам поделились желаниями</h1><p className="text-sm text-muted-foreground">Войдите, чтобы сохранить список друга и тайно выбрать подарок. Ваши отметки увидите только вы.</p><Link to="/auth" className={`${primaryClass} inline-block`} onClick={()=>{if(token)sessionStorage.setItem('dreamboard-pending-invite',invitePath(token));}}>Войти и открыть список</Link></main>;
  return <main className="max-w-4xl mx-auto px-4 py-6 space-y-6"><Link to="/friends" className="text-sm text-muted-foreground">← Друзья</Link>
    {loading?<p role="status">Загружаем желания…</p>:error?<section role="alert" className="border border-border p-6 rounded-2xl space-y-4"><p>{error}</p><p className="text-sm text-muted-foreground">Попросите друга проверить доступ или прислать новую ссылку.</p>{id&&<button className={primaryClass} onClick={()=>window.location.reload()}>Повторить</button>}</section>:board&&<>
      <header className="space-y-3"><p className="eyebrow">Список желаний</p><h1 className="board-heading break-words">{board.name}</h1><p className="text-sm text-muted-foreground">Список обновляется автоматически. Ваши отметки — только для вас.</p></header>
      {board.is_owner?<p className="rounded-xl border border-border p-4 text-sm">Так друзья видят ваш список. Их отметки здесь не отображаются. <Link className="underline" to="/share">Настроить доступ</Link></p>:!board.saved?<button disabled={busy} className={primaryClass} onClick={async()=>{if(!token)return;setBusy(true);try{const linkId=await wishes<string>('wish_save_friend',{p_token:token});navigate(`/friends/${linkId}`,{replace:true});toast.success('Друг сохранён');}catch(e){toast.error((e as Error).message);}finally{setBusy(false);}}}>Сохранить друга</button>:<div className="flex flex-wrap gap-3"><button className={primaryClass} aria-pressed={onlyMarked} onClick={()=>setOnlyMarked(!onlyMarked)}>{onlyMarked?'Показать все желания':'Мои идеи подарков'}</button><Link className="border border-border rounded-xl px-4 py-3 text-sm" to="/share">Поделиться своими желаниями</Link></div>}
      {!board.is_owner&&<p className="text-xs text-muted-foreground">Это личные планы, а не бронь: другие люди тоже могут выбрать тот же подарок.</p>}
      <div className="grid sm:grid-cols-2 gap-5">{board.dreams.filter(d=>!onlyMarked||d.marked).map(d=><article key={d.id} className="bg-card border border-border rounded-2xl overflow-hidden"><img src={d.image||'/dream-placeholder.svg'} alt={d.title} className="w-full aspect-square object-cover" onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src='/dream-placeholder.svg';}}/><div className="p-5 space-y-3"><p className="eyebrow">{categoryLabels[d.category as Category]??'Желание'}</p><h2 className="text-xl break-words">{d.title}</h2>{d.description&&<p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{d.description}</p>}{d.price!=null&&<p className="text-sm">Бюджет: ${Number(d.price).toLocaleString('ru-RU')}</p>}{!board.is_owner&&<button aria-pressed={d.marked} disabled={busy||!board.saved} className={`${primaryClass} w-full flex justify-center items-center gap-2`} onClick={async()=>{setBusy(true);try{await wishes('wish_mark',{p_link_id:board.id,p_dream_id:d.id,p_marked:!d.marked});setBoard(current=>current?{...current,dreams:current.dreams.map(x=>x.id===d.id?{...x,marked:!d.marked}:x)}:current);}catch(e){toast.error((e as Error).message);}finally{setBusy(false);}}}>{d.marked&&<Check size={16}/>} {d.marked?'Выбрано · снять отметку':'Хочу подарить'}</button>}</div></article>)}</div>
      {board.dreams.filter(d=>!onlyMarked||d.marked).length===0&&<p className="border border-border rounded-2xl p-8 text-center text-sm text-muted-foreground">{onlyMarked?'Пока нет выбранных подарков.': 'Пока нет доступных желаний. Новые появятся здесь, когда друг ими поделится.'}</p>}
      {!board.saved&&!board.is_owner&&<p className="text-sm">Сохраните друга, чтобы отмечать подарки.</p>}
      {board.saved&&<div className="text-sm">{remove?<><p className="mb-3">Убрать друга и ваши отметки? Можно снова добавить его по ссылке.</p><button disabled={busy} className={primaryClass} onClick={async()=>{setBusy(true);try{await wishes('wish_remove_friend',{p_link_id:board.id});navigate('/friends');}catch(e){toast.error((e as Error).message);}finally{setBusy(false);}}}>Убрать</button><button className="ml-4" onClick={()=>setRemove(false)}>Отмена</button></>:<button className="underline text-muted-foreground" onClick={()=>setRemove(true)}>Убрать из друзей</button>}</div>}
    </>}
  </main>;
}
